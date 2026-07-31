import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { User, DownlineMember, ReferralTreeNode, SystemStats, DBConfigStatus } from '../types.js';

const JSON_DB_PATH = path.join(process.cwd(), 'src/db/local_db.json');

// Ensure parent directory exists for JSON DB
const dbDir = path.dirname(JSON_DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Check if MySQL is configured
const isMySQLConfigured = (): boolean => {
  return !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_NAME
  );
};

let mysqlPool: mysql.Pool | null = null;

// Initialize MySQL Connection Pool if configured
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
  } catch (error) {
    console.error('Failed to create MySQL connection pool:', error);
    return null;
  }
};

// Seed admin user
const DEFAULT_ADMIN: Omit<User, 'id'> = {
  name: 'System Admin (সিস্টেম এডমিন)',
  phone: '01700000000',
  email: 'admin@gmail.com',
  password: 'admin123', // Under production, use hash, but keeping readable/secure for instant usage
  referrer_id: null,
  status: 'active',
  role: 'admin',
  created_at: new Date().toISOString(),
};

// Helpers for File-Based DB
const readJsonDb = (): User[] => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    writeJsonDb([
      {
        id: 1,
        ...DEFAULT_ADMIN,
      },
    ]);
    return [{ id: 1, ...DEFAULT_ADMIN }];
  }
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB, reinitializing:', err);
    const initial = [{ id: 1, ...DEFAULT_ADMIN }];
    writeJsonDb(initial);
    return initial;
  }
};

const writeJsonDb = (users: User[]): void => {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(users, null, 2), 'utf-8');
};

// Main Database Service
export const DB = {
  async getStatus(): Promise<DBConfigStatus> {
    const isMySQL = isMySQLConfigured();
    if (!isMySQL) {
      return {
        isMySQL: false,
        connected: true,
      };
    }

    try {
      const pool = getMySQLPool();
      if (!pool) {
        throw new Error('MySQL connection pool could not be initialized.');
      }
      const conn = await pool.getConnection();
      conn.release();
      return {
        isMySQL: true,
        connected: true,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
      };
    } catch (err: any) {
      return {
        isMySQL: true,
        connected: false,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        error: err.message || 'Database connection failed',
      };
    }
  },

  async init(): Promise<void> {
    const isMySQL = isMySQLConfigured();
    if (isMySQL) {
      console.log('Database Mode: Remote MySQL configured. Testing connection and creating tables...');
      try {
        const pool = getMySQLPool();
        if (!pool) throw new Error('Could not create MySQL pool');
        
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
      } catch (err) {
        console.error('MySQL initialization failed, falling back to JSON storage mode:', err);
        readJsonDb(); // Ensures JSON DB is seeded as fallback
      }
    } else {
      console.log('Database Mode: Local Offline Fallback (JSON DB).');
      readJsonDb(); // Seed fallback
    }
  },

  async getUsers(): Promise<User[]> {
    const status = await this.getStatus();
    if (status.isMySQL && status.connected) {
      const pool = getMySQLPool()!;
      const [rows] = await pool.query('SELECT * FROM users ORDER BY id DESC');
      return rows as User[];
    } else {
      return readJsonDb().sort((a, b) => b.id - a.id);
    }
  },

  async getUserById(id: number): Promise<User | null> {
    const status = await this.getStatus();
    if (status.isMySQL && status.connected) {
      const pool = getMySQLPool()!;
      const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      if (rows.length === 0) return null;
      return rows[0] as User;
    } else {
      const users = readJsonDb();
      return users.find((u) => u.id === id) || null;
    }
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const status = await this.getStatus();
    if (status.isMySQL && status.connected) {
      const pool = getMySQLPool()!;
      const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (rows.length === 0) return null;
      return rows[0] as User;
    } else {
      const users = readJsonDb();
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const status = await this.getStatus();
    if (status.isMySQL && status.connected) {
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
      const users = readJsonDb();
      const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
      const newUser: User = {
        id: newId,
        ...userData,
        created_at: userData.created_at || new Date().toISOString(),
      };
      users.push(newUser);
      writeJsonDb(users);
      return newUser;
    }
  },

  async updateUserStatus(id: number, activeStatus: 'active' | 'inactive'): Promise<User | null> {
    const status = await this.getStatus();
    if (status.isMySQL && status.connected) {
      const pool = getMySQLPool()!;
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [activeStatus, id]);
      return this.getUserById(id);
    } else {
      const users = readJsonDb();
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      users[idx].status = activeStatus;
      writeJsonDb(users);
      return users[idx];
    }
  },

  // Calculates stats
  async getStats(): Promise<SystemStats> {
    const users = await this.getUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;
    const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

    // Find deep levels - we calculate the maximum depth starting from root users (referrer_id is null)
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

  // Gets complete recursive downline tree and a flat list sorted by level for a given user
  async getDownlineData(targetUserId: number): Promise<{ flatList: DownlineMember[]; tree: ReferralTreeNode | null }> {
    const users = await this.getUsers();
    const userMap = new Map<number, User>();
    users.forEach((u) => userMap.set(u.id, u));

    const targetUser = userMap.get(targetUserId);
    if (!targetUser) {
      return { flatList: [], tree: null };
    }

    const flatList: DownlineMember[] = [];

    // Recursive helper to traverse down and calculate levels
    const traverse = (currentUserId: number, currentLevel: number): ReferralTreeNode[] => {
      const childrenNodes: ReferralTreeNode[] = [];
      
      users.forEach((u) => {
        if (u.referrer_id === currentUserId) {
          // Direct refer is Level 1, their referrals are Level 2, etc.
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

    // Build tree root
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

    // Sort flat downline list by level, then by ID descending
    flatList.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return b.id - a.id;
    });

    return { flatList, tree };
  }
};
