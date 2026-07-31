import mysql from 'mysql2/promise';
import { User, DownlineMember, ReferralTreeNode, SystemStats, DBConfigStatus } from '../types.js';

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
  name: 'System Admin (সিস্টেম এডমিন)',
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
      // Create table
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
        const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1', [identifier, identifier]);
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
  }
};
