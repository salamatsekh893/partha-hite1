import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { DB } from './src/db/db.js';
import { User } from './src/types.js';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production' || 
  (typeof __filename !== 'undefined' && __filename.endsWith('.cjs')) || 
  (typeof __dirname !== 'undefined' && __dirname.includes('dist'));

const app = express();
const PORT = isProduction ? (process.env.PORT || '3000') : '3000';

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---

// Middleware to verify if a request is authenticated
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userIdHeader = req.headers['x-user-id'];
  if (!userIdHeader) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  const userId = parseInt(userIdHeader as string, 10);
  if (isNaN(userId)) {
    return res.status(401).json({ error: 'Invalid user ID.' });
  }

  try {
    const user = await DB.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Middleware to verify admin access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user as User;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can perform this action.' });
  }
  next();
};

// 1. Get DB configuration and connectivity status
app.get('/api/db-status', async (req, res) => {
  try {
    const dbStatus = await DB.getStatus();
    res.json(dbStatus);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, email, password, sponsorId, additionalDetails } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'Please fill in all required fields (Name, Phone, Email, and Password).' });
  }

  try {
    // Check if email already exists
    const existingUserByEmail = await DB.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    // Check if phone already exists
    const existingUserByPhone = await DB.getUserByPhone(phone);
    if (existingUserByPhone) {
      return res.status(400).json({ error: 'This phone number is already registered.' });
    }

    let referrerIdVal: number | null = null;
    
    // Validate Sponsor ID
    if (sponsorId) {
      const parsedSponsorId = parseInt(sponsorId, 10);
      if (isNaN(parsedSponsorId)) {
        return res.status(400).json({ error: 'Sponsor ID must be a numeric ID.' });
      }
      
      const sponsor = await DB.getUserById(parsedSponsorId);
      if (!sponsor) {
        return res.status(400).json({ error: 'The provided Sponsor ID was not found.' });
      }

      if (sponsor.status !== 'active') {
        return res.status(400).json({ error: 'The provided Sponsor ID is Inactive. You can only register under active sponsors.' });
      }
      
      referrerIdVal = parsedSponsorId;
    } else {
      // If there are already users, then sponsor is mandatory to maintain level plan integrity
      const allUsers = await DB.getUsers();
      // If only admin exists (length 1), they can join directly under admin (ID 1)
      if (allUsers.length > 1) {
        return res.status(400).json({ error: 'A valid Referrer/Sponsor ID is required to register.' });
      } else {
        // Default to joining under Admin (ID 1) if no sponsor provided and database is empty
        const admin = allUsers.find(u => u.role === 'admin');
        referrerIdVal = admin ? admin.id : 1;
      }
    }

    // Stringify additionalDetails if they exist
    const additionalDetailsStr = additionalDetails ? JSON.stringify(additionalDetails) : null;

    const newUser = await DB.createUser({
      name,
      phone,
      email,
      password,
      referrer_id: referrerIdVal,
      status: 'inactive', // New registers are inactive by default until approved
      role: 'user',
      created_at: new Date().toISOString(),
      additional_details: additionalDetailsStr || undefined,
    });

    res.status(201).json({
      message: 'Registration successful! Your account is pending administrator review and activation.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        referrer_id: newUser.referrer_id,
        status: newUser.status,
      }
    });

  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'A server error occurred during registration.' });
  }
});

// 3. Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body; // email is used as general identifier

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both your email/phone and password.' });
  }

  try {
    const user = await DB.getUserByEmailOrPhone(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your details.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your details.' });
    }

    // Verify account status (Only Active users or Admins can log in)
    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Your account is currently Inactive (Pending Approval). Please wait for an administrator to activate it.'
      });
    }

    res.json({
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referrer_id: user.referrer_id,
        status: user.status,
        role: user.role,
        additional_details: user.additional_details,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'A server error occurred during login.' });
  }
});

// 4. Get Current User profile
app.get('/api/auth/me', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    referrer_id: user.referrer_id,
    status: user.status,
    role: user.role,
    created_at: user.created_at,
    additional_details: user.additional_details,
  });
});

// 4.5 Update User profile (supports self profile editing of name, phone, email, password)
app.post('/api/user/update-profile', authenticateUser, async (req, res) => {
  const currentUser = (req as any).user as User;
  const { name, email, phone, password, additionalDetails } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone number are required.' });
  }

  try {
    // Check if email is already taken by another user
    const userWithEmail = await DB.getUserByEmail(email);
    if (userWithEmail && userWithEmail.id !== currentUser.id) {
      return res.status(400).json({ error: 'This email is already in use by another user.' });
    }

    // Check if phone is already taken by another user
    const userWithPhone = await DB.getUserByPhone(phone);
    if (userWithPhone && userWithPhone.id !== currentUser.id) {
      return res.status(400).json({ error: 'This phone number is already in use by another user.' });
    }

    const updatedUser = await DB.updateUserProfile(
      currentUser.id, 
      name, 
      email, 
      phone, 
      password, 
      additionalDetails ? (typeof additionalDetails === 'string' ? additionalDetails : JSON.stringify(additionalDetails)) : undefined
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        referrer_id: updatedUser.referrer_id,
        status: updatedUser.status,
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        additional_details: updatedUser.additional_details,
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'An error occurred while updating your profile.' });
  }
});

// 5. Get Downline Data (Unlimited recursive levels)
app.get('/api/user/downline', authenticateUser, async (req, res) => {
  const currentUser = (req as any).user as User;
  
  // Can request specific user if requester is Admin
  let targetUserId = currentUser.id;
  const queryUserId = req.query.userId;
  
  if (queryUserId && currentUser.role === 'admin') {
    targetUserId = parseInt(queryUserId as string, 10);
  }

  try {
    const downlineData = await DB.getDownlineData(targetUserId);
    res.json(downlineData);
  } catch (err) {
    console.error('Fetch downline error:', err);
    res.status(500).json({ error: 'Failed to load downline referral data.' });
  }
});

// 6. Admin: List all registered users and global stats
app.get('/api/admin/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await DB.getUsers();
    const stats = await DB.getStats();
    
    // Remove passwords from response list
    const sanitizedUsers = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    res.json({
      users: sanitizedUsers,
      stats,
    });
  } catch (err) {
    console.error('Admin fetch users error:', err);
    res.status(500).json({ error: 'Failed to load user list and system statistics.' });
  }
});

// 6.5 Admin: Update Any User's profile
app.post('/api/admin/update-profile', authenticateUser, requireAdmin, async (req, res) => {
  const { userId, name, email, phone, password, additionalDetails } = req.body;

  if (!userId || !name || !email || !phone) {
    return res.status(400).json({ error: 'User ID, Name, email, and phone number are required.' });
  }

  try {
    const targetUserId = parseInt(userId, 10);
    const targetUser = await DB.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if email is already taken by another user
    const userWithEmail = await DB.getUserByEmail(email);
    if (userWithEmail && userWithEmail.id !== targetUserId) {
      return res.status(400).json({ error: 'This email is already in use by another user.' });
    }

    // Check if phone is already taken by another user
    const userWithPhone = await DB.getUserByPhone(phone);
    if (userWithPhone && userWithPhone.id !== targetUserId) {
      return res.status(400).json({ error: 'This phone number is already in use by another user.' });
    }

    const updatedUser = await DB.updateUserProfile(
      targetUserId, 
      name, 
      email, 
      phone, 
      password, 
      additionalDetails ? (typeof additionalDetails === 'string' ? additionalDetails : JSON.stringify(additionalDetails)) : undefined
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully by Administrator!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        referrer_id: updatedUser.referrer_id,
        status: updatedUser.status,
        role: updatedUser.role,
        created_at: updatedUser.created_at,
        additional_details: updatedUser.additional_details,
      }
    });
  } catch (err) {
    console.error('Admin update profile error:', err);
    res.status(500).json({ error: 'An error occurred while updating the profile.' });
  }
});

// 7. Admin: Approve / Activate User
app.post('/api/admin/approve', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updated = await DB.updateUserStatus(targetUser.id, 'active');
    res.json({
      message: `Account of ${targetUser.name} has been activated successfully.`,
      user: {
        id: updated?.id,
        name: updated?.name,
        status: updated?.status,
      }
    });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'An error occurred while activating the user.' });
  }
});

// 8. Admin: Suspend / Deactivate User
app.post('/api/admin/suspend', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'System administrator cannot be suspended.' });
    }

    const updated = await DB.updateUserStatus(targetUser.id, 'inactive');
    res.json({
      message: `Account of ${targetUser.name} has been suspended successfully.`,
      user: {
        id: updated?.id,
        name: updated?.name,
        status: updated?.status,
      }
    });
  } catch (err) {
    console.error('Suspend error:', err);
    res.status(500).json({ error: 'An error occurred while suspending the user.' });
  }
});

// 9. Admin: Delete / Reject User
app.post('/api/admin/delete', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'System administrator cannot be deleted.' });
    }

    await DB.deleteUser(targetUser.id);
    res.json({
      message: `Account of ${targetUser.name} has been deleted successfully.`,
      success: true,
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'An error occurred while trying to delete the user.' });
  }
});

// --- CLIENT SERVING ---

async function bootstrap() {
  // 1. Initialize DB (Auto create tables / Seed Admin)
  try {
    await DB.init();
  } catch (dbInitErr: any) {
    console.error('Initial database connection/initialization failed. Will auto-retry on API calls:', dbInitErr);
  }

  // 2. Vite Integration or Production static serving
  if (!isProduction) {
    console.log("Starting in development mode with Vite...");
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode (serving static files)...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 3. Listen on port
  if (typeof PORT === 'string' && !/^\d+$/.test(PORT)) {
    app.listen(PORT, () => {
      console.log(`Server listening on socket path: ${PORT}`);
    });
  } else {
    const portNum = typeof PORT === 'number' ? PORT : parseInt(PORT, 10);
    app.listen(portNum, '0.0.0.0', () => {
      console.log(`Server listening on http://localhost:${portNum}`);
    });
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
});
