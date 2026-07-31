import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { DB } from './src/db/db.js';
import { User } from './src/types.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API ROUTES ---

// Middleware to verify if a request is authenticated
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userIdHeader = req.headers['x-user-id'];
  if (!userIdHeader) {
    return res.status(401).json({ error: 'লগইন করা প্রয়োজন।' });
  }

  const userId = parseInt(userIdHeader as string, 10);
  if (isNaN(userId)) {
    return res.status(401).json({ error: 'অকার্যকর ইউজার আইডি।' });
  }

  try {
    const user = await DB.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'ইউজার পাওয়া যায়নি।' });
    }
    // Attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'সার্ভার ত্রুটি।' });
  }
};

// Middleware to verify admin access
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as any).user as User;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'শুধুমাত্র এডমিন এই কাজটি করতে পারবেন।' });
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
  const { name, phone, email, password, sponsorId } = req.body;

  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'দয়া করে সবকটি প্রয়োজনীয় তথ্য পূরণ করুন।' });
  }

  try {
    // Check if email already exists
    const existingUser = await DB.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যেই একটি অ্যাকাউন্ট খোলা হয়েছে।' });
    }

    let referrerIdVal: number | null = null;
    
    // Validate Sponsor ID
    if (sponsorId) {
      const parsedSponsorId = parseInt(sponsorId, 10);
      if (isNaN(parsedSponsorId)) {
        return res.status(400).json({ error: 'স্পন্সর আইডি অবশ্যই সংখ্যা হতে হবে।' });
      }
      
      const sponsor = await DB.getUserById(parsedSponsorId);
      if (!sponsor) {
        return res.status(400).json({ error: 'প্রদত্ত স্পন্সর আইডি বা রেফারেল আইডিটি পাওয়া যায়নি।' });
      }

      if (sponsor.status !== 'active') {
        return res.status(400).json({ error: 'প্রদত্ত স্পন্সর আইডিটি নিষ্ক্রিয় (Inactive)। শুধুমাত্র সক্রিয় স্পন্সরের মাধ্যমে জয়েন করা সম্ভব।' });
      }
      
      referrerIdVal = parsedSponsorId;
    } else {
      // If there are already users, then sponsor is mandatory to maintain level plan integrity
      const allUsers = await DB.getUsers();
      // If only admin exists (length 1), they can join directly under admin (ID 1)
      if (allUsers.length > 1) {
        return res.status(400).json({ error: 'জয়েন করার জন্য একটি রেফারেল বা স্পন্সর আইডি প্রয়োজন।' });
      } else {
        // Default to joining under Admin (ID 1) if no sponsor provided and database is empty
        const admin = allUsers.find(u => u.role === 'admin');
        referrerIdVal = admin ? admin.id : 1;
      }
    }

    const newUser = await DB.createUser({
      name,
      phone,
      email,
      password,
      referrer_id: referrerIdVal,
      status: 'inactive', // New registers are inactive by default until approved
      role: 'user',
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'নিবন্ধন সফল হয়েছে! আপনার আইডিটি এডমিন এপ্রুভালের অপেক্ষায় রয়েছে।',
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
    res.status(500).json({ error: 'রেজিস্ট্রেশন করার সময় সার্ভার ত্রুটি ঘটেছে।' });
  }
});

// 3. Login User
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' });
  }

  try {
    const user = await DB.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
    }

    // Verify account status (Only Active users or Admins can log in)
    if (user.status !== 'active' && user.role !== 'admin') {
      return res.status(403).json({
        error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় (Inactive) রয়েছে। এডমিন অনুমোদন করলেই আপনি ড্যাশবোর্ড ব্যবহার করতে পারবেন।'
      });
    }

    res.json({
      message: 'লগইন সফল হয়েছে!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referrer_id: user.referrer_id,
        status: user.status,
        role: user.role,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'লগইন করার সময় সার্ভার ত্রুটি ঘটেছে।' });
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
  });
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
    res.status(500).json({ error: 'ডাউনলাইন রেফারেল ডাটা লোড করতে সমস্যা হয়েছে।' });
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
    res.status(500).json({ error: 'ইউজারদের তালিকা এবং পরিসংখ্যান লোড করা সম্ভব হয়নি।' });
  }
});

// 7. Admin: Approve / Activate User
app.post('/api/admin/approve', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'ইউজার আইডি প্রদান করা হয়নি।' });
  }

  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: 'ইউজার পাওয়া যায়নি।' });
    }

    const updated = await DB.updateUserStatus(targetUser.id, 'active');
    res.json({
      message: `${targetUser.name} এর আইডি সফলভাবে সক্রিয় (Active) করা হয়েছে।`,
      user: {
        id: updated?.id,
        name: updated?.name,
        status: updated?.status,
      }
    });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'ইউজারকে সক্রিয় করার সময় ত্রুটি ঘটেছে।' });
  }
});

// 8. Admin: Suspend / Deactivate User
app.post('/api/admin/suspend', authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'ইউজার আইডি প্রদান করা হয়নি।' });
  }

  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: 'ইউজার পাওয়া যায়নি।' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'সিস্টেম এডমিনকে নিষ্ক্রিয় করা সম্ভব নয়।' });
    }

    const updated = await DB.updateUserStatus(targetUser.id, 'inactive');
    res.json({
      message: `${targetUser.name} এর আইডি সফলভাবে নিষ্ক্রিয় (Inactive) করা হয়েছে।`,
      user: {
        id: updated?.id,
        name: updated?.name,
        status: updated?.status,
      }
    });
  } catch (err) {
    console.error('Suspend error:', err);
    res.status(500).json({ error: 'ইউজারকে নিষ্ক্রিয় করার সময় ত্রুটি ঘটেছে।' });
  }
});

// --- CLIENT SERVING ---

async function bootstrap() {
  // 1. Initialize DB (Auto create tables / Seed Admin)
  await DB.init();

  // 2. Vite Integration or Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 3. Listen on port
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
});
