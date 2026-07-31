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
let connectionTested = false;

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

    if (!connectionTested) {
      try {
        const pool = getMySQLPool();
        if (!pool) {
          throw new Error('MySQL connection pool could not be initialized. Please check credentials.');
        }
        const conn = await pool.getConnection();
        conn.release();
        isDbConnected = true;
        dbConnectionError = null;
      } catch (err: any) {
        isDbConnected = false;
        dbConnectionError = err.message || 'Database connection failed';
      }
      connectionTested = true;
    }

    return {
      isMySQL: true,
      connected: isDbConnected,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      error: dbConnectionError || undefined,
    };
  },

  async init(): Promise<void> {
    connectionTested = true;
    const isMySQL = isMySQLConfigured();
    
    if (!isMySQL) {
      const errMsg = 'CRITICAL: MySQL config is missing! Please configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in environment settings.';
      console.error(errMsg);
      dbConnectionError = errMsg;
      isDbConnected = false;
      return;
    }

    console.log('Database Mode: Remote MySQL configured. Testing connection and creating tables...');
    try {
      const pool = getMySQLPool();
      if (!pool) throw new Error('Could not create MySQL pool. Verify DB credentials.');
      
      const conn = await pool.getConnection();
      console.log('MySQL connected successfully. Verifying tables...');
      
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
          FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

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
      conn.release();
      console.log('MySQL database initialization complete.');
      isDbConnected = true;
      dbConnectionError = null;
    } catch (err: any) {
      console.error('MySQL initialization failed:', err);
      isDbConnected = false;
      dbConnectionError = err.message || 'MySQL Init Error';
    }
  },

  async getUsers(): Promise<User[]> {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool()!;
      const [rows] = await pool.query('SELECT * FROM users ORDER BY id DESC');
      return rows as User[];
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getUserById(id: number): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool()!;
      const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) return null;
      return rows[0] as User;
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool()!;
      const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (rows.length === 0) return null;
      return rows[0] as User;
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool()!;
      const [result]: any = await pool.query(
        'INSERT INTO users (name, phone, email, password, referrer_id, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          userData.name,
          userData.phone,
          userData.email,
          userData.password,
          userData.referrer_id,
          userData.status,
          userData.role,
          userData.created_at || new Date().toISOString(),
        ]
      );
      const insertedId = result.insertId;
      return { id: insertedId, ...userData };
    } else {
      throw new Error('MySQL Database is not connected: ' + (status.error || 'Connection offline'));
    }
  },

  async updateUserStatus(id: number, activeStatus: 'active' | 'inactive'): Promise<User | null> {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool()!;
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [activeStatus, id]);
      return this.getUserById(id);
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
