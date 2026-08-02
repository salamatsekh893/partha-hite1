import mysql from 'mysql2/promise';
import { User, DownlineMember, ReferralTreeNode, SystemStats, DBConfigStatus, WebsiteContent } from '../types.js';

// In-memory fallback array for website contents (Clean official defaults)
let inMemoryWebsiteContents: WebsiteContent[] = [
  {
    id: 1,
    type: 'photo',
    title: '100kW Commercial Rooftop Solar Power Plant',
    description: 'High-efficiency Mono PERC solar panel installation powering industrial facilities under PM Surya Ghar & State Solar Green Policy.',
    media_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    badge: 'REAL FIELD WORK',
    category: 'Rooftop Solar Plant',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    type: 'text',
    title: '☀️ PM Surya Ghar Muft Bijli Yojana Official Subsidy Active',
    description: 'Avail up to ₹78,000 direct Government subsidy for 3kW Rooftop Solar Installation through SuccessIndia authorized channel partners.',
    badge: 'OFFICIAL NOTICE',
    category: 'Government Subsidy',
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    type: 'video',
    title: '5HP Agricultural Solar Water Pump Live Field Demonstration',
    description: 'Watch 5HP solar water pump running continuously supplying clean water for agricultural irrigation.',
    media_url: 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=1200&q=80',
    badge: 'DEMO VIDEO',
    category: 'Solar Agriculture',
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// Check if MySQL is configured
const isMySQLConfigured = (): boolean => {
  return !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_NAME
  );
};

let mysqlPool: mysql.Pool | null = null;
let isDbConnected = false;
let dbConnectionError: string | null = null;
let lastConnectAttemptTime = 0;
const RECONNECT_THROTTLE_MS = 5000; // Throttle reconnection attempts to at most once per 5 seconds
let isInitialized = false;

// Initialize MySQL Connection Pool
const getMySQLPool = (): mysql.Pool | null => {
  if (!isMySQLConfigured()) return null;
  if (mysqlPool) return mysqlPool;

  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    return mysqlPool;
  } catch (error: any) {
    console.error('Failed to create MySQL connection pool:', error);
    dbConnectionError = error.message || 'MySQL Pool Creation Error';
    return null;
  }
};

// Seed admin user values
const DEFAULT_ADMIN = {
  name: 'System Admin',
  phone: '01700000000',
  email: 'admin@gmail.com',
  password: 'admin123',
  referrer_id: null,
  status: 'active',
  role: 'admin',
  created_at: new Date().toISOString(),
};

// Unified helper to connect and initialize database tables if needed
async function ensureConnectedAndInitialized(): Promise<boolean> {
  const isMySQL = isMySQLConfigured();
  if (!isMySQL) {
    dbConnectionError = 'MySQL environment variables are not configured in your settings.';
    isDbConnected = false;
    return false;
  }

  if (isDbConnected && isInitialized) {
    return true;
  }

  const now = Date.now();
  // Throttle reconnect attempts to avoid spamming connection requests during server down
  if (!isDbConnected && (now - lastConnectAttemptTime < RECONNECT_THROTTLE_MS)) {
    return isDbConnected;
  }

  lastConnectAttemptTime = now;

  try {
    const pool = getMySQLPool();
    if (!pool) {
      throw new Error('MySQL connection pool could not be initialized. Please check credentials.');
    }

    const conn = await pool.getConnection();
    console.log('MySQL connected successfully.');

    if (!isInitialized) {
      console.log('Verifying or creating database tables...');
      // Create users table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          referrer_id INT NULL,
          status VARCHAR(50) DEFAULT 'inactive',
          role VARCHAR(50) DEFAULT 'user',
          created_at VARCHAR(100) NOT NULL,
          additional_details LONGTEXT NULL,
          FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create website_contents table for videos, photos, announcements
      await conn.query(`
        CREATE TABLE IF NOT EXISTS website_contents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          media_url LONGTEXT NULL,
          badge VARCHAR(100) NULL,
          category VARCHAR(100) NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at VARCHAR(100) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Attempt to safely add the additional_details column to existing tables if it doesn't exist
      try {
        await conn.query('ALTER TABLE users ADD COLUMN additional_details LONGTEXT NULL');
        console.log('Successfully upgraded table with additional_details column.');
      } catch (colErr) {
        // Column may already exist, ignore error safely
      }

      // Check if admin exists
      const [rows]: any = await conn.query('SELECT * FROM users WHERE role = "admin" OR email = ? LIMIT 1', [DEFAULT_ADMIN.email]);
      if (rows.length === 0) {
        console.log('Seeding root admin into MySQL database...');
        await conn.query(
          'INSERT INTO users (name, phone, email, password, referrer_id, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            DEFAULT_ADMIN.name,
            DEFAULT_ADMIN.phone,
            DEFAULT_ADMIN.email,
            DEFAULT_ADMIN.password,
            DEFAULT_ADMIN.referrer_id,
            DEFAULT_ADMIN.status,
            DEFAULT_ADMIN.role,
            DEFAULT_ADMIN.created_at,
          ]
        );
      }
      isInitialized = true;
    }

    conn.release();
    isDbConnected = true;
    dbConnectionError = null;
    return true;
  } catch (err: any) {
    console.error('Database connection/init failed:', err);
    isDbConnected = false;
    dbConnectionError = err.message || 'Database connection failed';
    return false;
  }
}

// Main Database Service
export const DB = {
  async getStatus(): Promise<DBConfigStatus> {
    const isMySQL = isMySQLConfigured();
    if (!isMySQL) {
      return {
        isMySQL: false,
        connected: false,
        error: 'MySQL environment variables are not configured in your Hosting/Environment settings.',
      };
    }

    await ensureConnectedAndInitialized();

    return {
      isMySQL: true,
      connected: isDbConnected,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      error: dbConnectionError || undefined,
    };
  },

  async init(): Promise<void> {
    await ensureConnectedAndInitialized();
  },

  async getUsers(): Promise<User[]> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const [rows] = await pool.query('SELECT * FROM users ORDER BY id DESC');
        return rows as User[];
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getUserById(id: number): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (rows.length === 0) return null;
        return rows[0] as User;
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        if (rows.length === 0) return null;
        return rows[0] as User;
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getUserByPhone(phone: string): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const [rows]: any = await pool.query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone]);
        if (rows.length === 0) return null;
        return rows[0] as User;
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getUserByEmailOrPhone(identifier: string): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        // 1. Direct exact match
        const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1', [identifier, identifier]);
        if (rows.length > 0) return rows[0] as User;

        // 2. Flexible phone match if identifier contains digits
        const digits = identifier.replace(/\D/g, '');
        if (digits.length >= 6) {
          // Compare trailing 10 digits or exact digits
          const lastDigits = digits.slice(-10);
          const [phoneRows]: any = await pool.query(
            "SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', '') LIKE ? LIMIT 1",
            [`%${lastDigits}`]
          );
          if (phoneRows.length > 0) return phoneRows[0] as User;
        }

        return null;
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const [result]: any = await pool.query(
          'INSERT INTO users (name, phone, email, password, referrer_id, status, role, created_at, additional_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            userData.name,
            userData.phone,
            userData.email,
            userData.password,
            userData.referrer_id,
            userData.status,
            userData.role,
            userData.created_at || new Date().toISOString(),
            userData.additional_details || null,
          ]
        );
        const insertedId = result.insertId;
        return { id: insertedId, ...userData };
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async updateUserStatus(id: number, activeStatus: 'active' | 'inactive'): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        await pool.query('UPDATE users SET status = ? WHERE id = ?', [activeStatus, id]);
        return this.getUserById(id);
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async updateUserProfile(id: number, name: string, email: string, phone: string, password?: string, additionalDetails?: string): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        if (password && password.trim() !== "") {
          await pool.query(
            'UPDATE users SET name = ?, email = ?, phone = ?, password = ?, additional_details = ? WHERE id = ?', 
            [name, email, phone, password, additionalDetails || null, id]
          );
        } else {
          await pool.query(
            'UPDATE users SET name = ?, email = ?, phone = ?, additional_details = ? WHERE id = ?', 
            [name, email, phone, additionalDetails || null, id]
          );
        }
        return this.getUserById(id);
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        // Explicitly set referrer_id of referrals to NULL first to prevent foreign key errors
        await pool.query('UPDATE users SET referrer_id = NULL WHERE referrer_id = ?', [id]);
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Query failed';
        throw err;
      }
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getStats(): Promise<SystemStats> {
    const users = await this.getUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

    let maxLevelsDeep = 0;
    const userMap = new Map<number, User>();
    users.forEach((u) => userMap.set(u.id, u));

    const getDepth = (userId: number, currentDepth: number): number => {
      let maxChildDepth = currentDepth;
      users.forEach((u) => {
        if (u.referrer_id === userId) {
          const depth = getDepth(u.id, currentDepth + 1);
          if (depth > maxChildDepth) maxChildDepth = depth;
        }
      });
      return maxChildDepth;
    };

    const rootUsers = users.filter((u) => u.referrer_id === null);
    rootUsers.forEach((root) => {
      const depth = getDepth(root.id, 1);
      if (depth > maxLevelsDeep) maxLevelsDeep = depth;
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      maxLevelsDeep,
    };
  },

  async getDownlineData(targetUserId: number): Promise<{ flatList: DownlineMember[]; tree: ReferralTreeNode | null }> {
    const users = await this.getUsers();
    const userMap = new Map<number, User>();
    users.forEach((u) => userMap.set(u.id, u));

    const targetUser = userMap.get(targetUserId);
    if (!targetUser) {
      return { flatList: [], tree: null };
    }

    const flatList: DownlineMember[] = [];

    const traverse = (currentUserId: number, currentLevel: number): ReferralTreeNode[] => {
      const childrenNodes: ReferralTreeNode[] = [];
      
      users.forEach((u) => {
        if (u.referrer_id === currentUserId) {
          const referrerUser = userMap.get(currentUserId);
          
          flatList.push({
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            referrer_id: u.referrer_id,
            status: u.status,
            level: currentLevel,
            created_at: u.created_at,
            referrer_name: referrerUser ? referrerUser.name : undefined,
            referrer_phone: referrerUser ? referrerUser.phone : undefined,
          });

          const subChildren = traverse(u.id, currentLevel + 1);
          
          childrenNodes.push({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            status: u.status,
            level: currentLevel,
            children: subChildren,
          });
        }
      });

      return childrenNodes;
    };

    const children = traverse(targetUserId, 1);
    const tree: ReferralTreeNode = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      status: targetUser.status,
      level: 0,
      children,
    };

    flatList.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return b.id - a.id;
    });

    return { flatList, tree };
  },

  // Website Content Management Methods (Photos, Videos, Text Announcements)
  async getWebsiteContents(onlyActive = true): Promise<WebsiteContent[]> {
    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const query = onlyActive 
          ? 'SELECT * FROM website_contents WHERE is_active = 1 ORDER BY id DESC' 
          : 'SELECT * FROM website_contents ORDER BY id DESC';
        const [rows]: any = await pool.query(query);
        if (rows) {
          return rows.map((r: any) => ({
            ...r,
            is_active: Boolean(r.is_active),
          }));
        }
      } catch (err) {
        console.error('Error fetching website contents from DB, using fallback:', err);
      }
    }
    // Fallback in-memory filter
    if (onlyActive) {
      return inMemoryWebsiteContents.filter((c) => c.is_active);
    }
    return inMemoryWebsiteContents;
  },

  async createWebsiteContent(data: Omit<WebsiteContent, 'id'>): Promise<WebsiteContent> {
    const newId = inMemoryWebsiteContents.length > 0 ? Math.max(...inMemoryWebsiteContents.map(i => i.id)) + 1 : 1;
    const newItem: WebsiteContent = {
      id: newId,
      type: data.type,
      title: data.title,
      description: data.description || '',
      media_url: data.media_url || '',
      badge: data.badge || '',
      category: data.category || '',
      is_active: data.is_active ?? true,
      created_at: data.created_at || new Date().toISOString(),
    };

    inMemoryWebsiteContents.unshift(newItem);

    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const [result]: any = await pool.query(
          'INSERT INTO website_contents (type, title, description, media_url, badge, category, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newItem.type,
            newItem.title,
            newItem.description,
            newItem.media_url,
            newItem.badge,
            newItem.category,
            newItem.is_active ? 1 : 0,
            newItem.created_at,
          ]
        );
        newItem.id = result.insertId;
      } catch (err) {
        console.error('Failed to insert website content to MySQL:', err);
      }
    }

    return newItem;
  },

  async updateWebsiteContent(id: number, data: Partial<WebsiteContent>): Promise<WebsiteContent | null> {
    const itemIndex = inMemoryWebsiteContents.findIndex(c => c.id === id);
    if (itemIndex !== -1) {
      inMemoryWebsiteContents[itemIndex] = {
        ...inMemoryWebsiteContents[itemIndex],
        ...data,
      };
    }

    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        const updates: string[] = [];
        const values: any[] = [];

        if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
        if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
        if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
        if (data.media_url !== undefined) { updates.push('media_url = ?'); values.push(data.media_url); }
        if (data.badge !== undefined) { updates.push('badge = ?'); values.push(data.badge); }
        if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
        if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

        if (updates.length > 0) {
          values.push(id);
          await pool.query(`UPDATE website_contents SET ${updates.join(', ')} WHERE id = ?`, values);
        }
      } catch (err) {
        console.error('Failed to update website content in MySQL:', err);
      }
    }

    return itemIndex !== -1 ? inMemoryWebsiteContents[itemIndex] : null;
  },

  async deleteWebsiteContent(id: number): Promise<boolean> {
    inMemoryWebsiteContents = inMemoryWebsiteContents.filter(c => c.id !== id);

    const status = await this.getStatus();
    if (status.connected) {
      try {
        const pool = getMySQLPool()!;
        await pool.query('DELETE FROM website_contents WHERE id = ?', [id]);
      } catch (err) {
        console.error('Failed to delete website content in MySQL:', err);
      }
    }

    return true;
  }
};

