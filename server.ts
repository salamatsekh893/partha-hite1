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

// In-memory OTP storage for phone verification: mobile -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Helper to clean phone numbers to digits only (e.g. +91 98145 22052 -> 919814522052)
const cleanPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// OTP 1: Send OTP endpoint via apitxt.com
app.post('/api/otp/send', async (req, res) => {
  const { mobile, channel = 'sms', template_id, template_name, project_ref_id, country } = req.body;

  if (!mobile) {
    return res.status(400).json({ error: 'Mobile phone number is required to send OTP.' });
  }

  const cleanMobile = cleanPhoneNumber(mobile);
  const last10Digits = cleanMobile.slice(-10);

  if (cleanMobile.length < 6) {
    return res.status(400).json({ error: 'Please enter a valid mobile number with country code.' });
  }

  // Generate a random 6-digit numeric OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  // Store OTP against clean mobile, original input, and trailing 10 digits
  const otpData = { otp: otpCode, expiresAt };
  otpStore.set(cleanMobile, otpData);
  if (mobile) otpStore.set(mobile, otpData);
  if (last10Digits) otpStore.set(last10Digits, otpData);

  const authKey = process.env.APITXT_AUTHKEY;
  const templateIdConfig = template_id || process.env.APITXT_TEMPLATE_ID;

  if (authKey && authKey.trim() !== '' && authKey !== 'YOUR_KEY') {
    try {
      // Build apitxt.com URL
      const apiUrl = new URL('https://apitxt.com/api/sendOTP');
      apiUrl.searchParams.append('authkey', authKey.trim());
      apiUrl.searchParams.append('mobile', cleanMobile);
      apiUrl.searchParams.append('otp', otpCode);

      if (channel) apiUrl.searchParams.append('channel', channel);
      if (templateIdConfig) apiUrl.searchParams.append('template_id', templateIdConfig);
      if (template_name) apiUrl.searchParams.append('template_name', template_name);
      if (project_ref_id) apiUrl.searchParams.append('project_ref_id', project_ref_id);
      if (country) apiUrl.searchParams.append('country', country);

      console.log(`Sending OTP via apitxt.com API to mobile: ${cleanMobile} [Channel: ${channel}] [OTP: ${otpCode}]`);

      const apiRes = await fetch(apiUrl.toString());
      const apiData = await apiRes.text();

      console.log('apitxt.com API response:', apiData);

      return res.json({
        success: true,
        message: `OTP sent successfully via ${channel.toUpperCase()}!`,
        mobile: cleanMobile,
        apiResponse: apiData,
      });
    } catch (err: any) {
      console.error('Failed to dispatch OTP via apitxt.com:', err);
      // Fallback response with demo OTP if live API call failed
      return res.json({
        success: true,
        message: 'OTP dispatch attempted. (Fallback code generated)',
        otp: otpCode,
        isDemo: true,
        error: err.message,
      });
    }
  } else {
    // Demo Mode (When APITXT_AUTHKEY is not yet added in environment settings)
    console.log(`[DEMO MODE] OTP for ${cleanMobile}: ${otpCode}`);
    return res.json({
      success: true,
      message: 'OTP sent! (Demo mode: Use code below or add APITXT_AUTHKEY in .env)',
      otp: otpCode,
      isDemo: true,
      mobile: cleanMobile,
    });
  }
});

// OTP 2: Verify OTP endpoint
app.post('/api/otp/verify', (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Both mobile number and OTP code are required.' });
  }

  const cleanMobile = cleanPhoneNumber(mobile);
  const last10Digits = cleanMobile.slice(-10);
  const stored = otpStore.get(cleanMobile) || otpStore.get(mobile) || otpStore.get(last10Digits);

  if (!stored) {
    return res.status(400).json({ error: 'No OTP requested for this mobile number. Please request a new OTP.' });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanMobile);
    otpStore.delete(mobile);
    otpStore.delete(last10Digits);
    return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
  }

  if (stored.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
  }

  // OTP verified successfully! Clear stored OTP
  otpStore.delete(cleanMobile);
  otpStore.delete(mobile);
  otpStore.delete(last10Digits);

  return res.json({
    success: true,
    message: 'Mobile number verified successfully!',
    mobile: cleanMobile,
  });
});

// OTP 3: Mobile Login using OTP endpoint
app.post('/api/auth/login-otp', async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ error: 'Please enter your mobile number and OTP code.' });
  }

  const cleanMobile = cleanPhoneNumber(mobile);
  const last10Digits = cleanMobile.slice(-10);
  const stored = otpStore.get(cleanMobile) || otpStore.get(mobile) || otpStore.get(last10Digits);

  if (!stored) {
    return res.status(400).json({ error: 'No active OTP found for this number. Please click "Send OTP" first.' });
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanMobile);
    otpStore.delete(mobile);
    otpStore.delete(last10Digits);
    return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
  }

  if (stored.otp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid OTP code entered. Please check the code received.' });
  }

  // Clear OTP on successful match
  otpStore.delete(cleanMobile);
  otpStore.delete(mobile);
  otpStore.delete(last10Digits);

  try {
    // Find user by phone number (try full mobile, clean mobile, or last 10 digits)
    let user = await DB.getUserByEmailOrPhone(mobile);
    if (!user && cleanMobile) {
      user = await DB.getUserByEmailOrPhone(cleanMobile);
    }
    if (!user && last10Digits) {
      user = await DB.getUserByEmailOrPhone(last10Digits);
    }

    if (!user) {
      return res.status(404).json({
        error: 'No registered member account found with this phone number. Please click "Create an account" to register.'
      });
    }

    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'Your account is registered but currently Pending Admin Approval. Please wait for an administrator to activate your account.'
      });
    }

    return res.json({
      message: 'OTP Login successful!',
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
  } catch (err: any) {
    console.error('OTP Login error:', err);
    return res.status(500).json({ error: 'Server error during OTP login.' });
  }
});

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

// --- WEBSITE CONTENT API ROUTES ---

// Public GET active website contents (photos, videos, announcements)
app.get('/api/website/contents', async (req, res) => {
  try {
    const contents = await DB.getWebsiteContents(true);
    res.json({ contents });
  } catch (err: any) {
    console.error('Error fetching website contents:', err);
    res.status(500).json({ error: 'Failed to retrieve website contents.' });
  }
});

// Admin GET all website contents (including inactive)
app.get('/api/admin/website/contents', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const contents = await DB.getWebsiteContents(false);
    res.json({ contents });
  } catch (err: any) {
    console.error('Error fetching admin website contents:', err);
    res.status(500).json({ error: 'Failed to retrieve website contents for admin.' });
  }
});

// Admin POST create new website content (photo, video, or text)
app.post('/api/admin/website/contents', authenticateUser, requireAdmin, async (req, res) => {
  const { type, title, description, media_url, badge, category, is_active } = req.body;
  if (!type || !title) {
    return res.status(400).json({ error: 'Content type and title are required.' });
  }

  try {
    const newItem = await DB.createWebsiteContent({
      type,
      title,
      description,
      media_url,
      badge,
      category,
      is_active: is_active ?? true,
      created_at: new Date().toISOString(),
    });

    res.json({
      message: 'Website content added successfully!',
      content: newItem,
    });
  } catch (err: any) {
    console.error('Error creating website content:', err);
    res.status(500).json({ error: 'Failed to save website content.' });
  }
});

// Admin PUT update website content
app.put('/api/admin/website/contents/:id', authenticateUser, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid content ID.' });
  }

  try {
    const updated = await DB.updateWebsiteContent(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Website content item not found.' });
    }
    res.json({
      message: 'Website content updated successfully!',
      content: updated,
    });
  } catch (err: any) {
    console.error('Error updating website content:', err);
    res.status(500).json({ error: 'Failed to update website content.' });
  }
});

// Admin DELETE website content
app.delete('/api/admin/website/contents/:id', authenticateUser, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid content ID.' });
  }

  try {
    await DB.deleteWebsiteContent(id);
    res.json({
      message: 'Website content deleted successfully!',
      success: true,
    });
  } catch (err: any) {
    console.error('Error deleting website content:', err);
    res.status(500).json({ error: 'Failed to delete website content.' });
  }
});


// --- CLIENT SERVING ---

// Catch-all for undefined /api routes so they return JSON instead of falling through to HTML
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.originalUrl}' not found.` });
});

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
