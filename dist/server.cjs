var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_vite = require("vite");

// src/db/db.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var isMySQLConfigured = () => {
  return !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
};
var mysqlPool = null;
var isDbConnected = false;
var dbConnectionError = null;
var connectionTested = false;
var getMySQLPool = () => {
  if (!isMySQLConfigured()) return null;
  if (mysqlPool) return mysqlPool;
  try {
    mysqlPool = import_promise.default.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    return mysqlPool;
  } catch (error) {
    console.error("Failed to create MySQL connection pool:", error);
    dbConnectionError = error.message || "MySQL Pool Creation Error";
    return null;
  }
};
var DEFAULT_ADMIN = {
  name: "System Admin (\u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE \u098F\u09A1\u09AE\u09BF\u09A8)",
  phone: "01700000000",
  email: "admin@gmail.com",
  password: "admin123",
  referrer_id: null,
  status: "active",
  role: "admin",
  created_at: (/* @__PURE__ */ new Date()).toISOString()
};
var DB = {
  async getStatus() {
    const isMySQL = isMySQLConfigured();
    if (!isMySQL) {
      return {
        isMySQL: false,
        connected: false,
        error: "MySQL environment variables are not configured in your Hosting/Environment settings."
      };
    }
    if (!connectionTested) {
      try {
        const pool = getMySQLPool();
        if (!pool) {
          throw new Error("MySQL connection pool could not be initialized. Please check credentials.");
        }
        const conn = await pool.getConnection();
        conn.release();
        isDbConnected = true;
        dbConnectionError = null;
      } catch (err) {
        isDbConnected = false;
        dbConnectionError = err.message || "Database connection failed";
      }
      connectionTested = true;
    }
    return {
      isMySQL: true,
      connected: isDbConnected,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      error: dbConnectionError || void 0
    };
  },
  async init() {
    connectionTested = true;
    const isMySQL = isMySQLConfigured();
    if (!isMySQL) {
      const errMsg = "CRITICAL: MySQL config is missing! Please configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in environment settings.";
      console.error(errMsg);
      dbConnectionError = errMsg;
      isDbConnected = false;
      return;
    }
    console.log("Database Mode: Remote MySQL configured. Testing connection and creating tables...");
    try {
      const pool = getMySQLPool();
      if (!pool) throw new Error("Could not create MySQL pool. Verify DB credentials.");
      const conn = await pool.getConnection();
      console.log("MySQL connected successfully. Verifying tables...");
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
      const [rows] = await conn.query('SELECT * FROM users WHERE role = "admin" OR email = ? LIMIT 1', [DEFAULT_ADMIN.email]);
      if (rows.length === 0) {
        console.log("Seeding root admin into MySQL database...");
        await conn.query(
          "INSERT INTO users (name, phone, email, password, referrer_id, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            DEFAULT_ADMIN.name,
            DEFAULT_ADMIN.phone,
            DEFAULT_ADMIN.email,
            DEFAULT_ADMIN.password,
            DEFAULT_ADMIN.referrer_id,
            DEFAULT_ADMIN.status,
            DEFAULT_ADMIN.role,
            DEFAULT_ADMIN.created_at
          ]
        );
      }
      conn.release();
      console.log("MySQL database initialization complete.");
      isDbConnected = true;
      dbConnectionError = null;
    } catch (err) {
      console.error("MySQL initialization failed:", err);
      isDbConnected = false;
      dbConnectionError = err.message || "MySQL Init Error";
    }
  },
  async getUsers() {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool();
      const [rows] = await pool.query("SELECT * FROM users ORDER BY id DESC");
      return rows;
    } else {
      throw new Error("MySQL Database is not connected: " + (status.error || "Connection offline"));
    }
  },
  async getUserById(id) {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool();
      const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
      if (rows.length === 0) return null;
      return rows[0];
    } else {
      throw new Error("MySQL Database is not connected: " + (status.error || "Connection offline"));
    }
  },
  async getUserByEmail(email) {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool();
      const [rows] = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
      if (rows.length === 0) return null;
      return rows[0];
    } else {
      throw new Error("MySQL Database is not connected: " + (status.error || "Connection offline"));
    }
  },
  async createUser(userData) {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool();
      const [result] = await pool.query(
        "INSERT INTO users (name, phone, email, password, referrer_id, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userData.name,
          userData.phone,
          userData.email,
          userData.password,
          userData.referrer_id,
          userData.status,
          userData.role,
          userData.created_at || (/* @__PURE__ */ new Date()).toISOString()
        ]
      );
      const insertedId = result.insertId;
      return { id: insertedId, ...userData };
    } else {
      throw new Error("MySQL Database is not connected: " + (status.error || "Connection offline"));
    }
  },
  async updateUserStatus(id, activeStatus) {
    const status = await this.getStatus();
    if (status.connected) {
      const pool = getMySQLPool();
      await pool.query("UPDATE users SET status = ? WHERE id = ?", [activeStatus, id]);
      return this.getUserById(id);
    } else {
      throw new Error("MySQL Database is not connected: " + (status.error || "Connection offline"));
    }
  },
  async getStats() {
    const users = await this.getUsers();
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const inactiveUsers = users.filter((u) => u.status === "inactive").length;
    let maxLevelsDeep = 0;
    const userMap = /* @__PURE__ */ new Map();
    users.forEach((u) => userMap.set(u.id, u));
    const getDepth = (userId, currentDepth) => {
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
      maxLevelsDeep
    };
  },
  async getDownlineData(targetUserId) {
    const users = await this.getUsers();
    const userMap = /* @__PURE__ */ new Map();
    users.forEach((u) => userMap.set(u.id, u));
    const targetUser = userMap.get(targetUserId);
    if (!targetUser) {
      return { flatList: [], tree: null };
    }
    const flatList = [];
    const traverse = (currentUserId, currentLevel) => {
      const childrenNodes = [];
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
            referrer_name: referrerUser ? referrerUser.name : void 0
          });
          const subChildren = traverse(u.id, currentLevel + 1);
          childrenNodes.push({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            status: u.status,
            level: currentLevel,
            children: subChildren
          });
        }
      });
      return childrenNodes;
    };
    const children = traverse(targetUserId, 1);
    const tree = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      status: targetUser.status,
      level: 0,
      children
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

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
app.use(import_express.default.urlencoded({ extended: true }));
var authenticateUser = async (req, res, next) => {
  const userIdHeader = req.headers["x-user-id"];
  if (!userIdHeader) {
    return res.status(401).json({ error: "\u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09BE \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u0964" });
  }
  const userId = parseInt(userIdHeader, 10);
  if (isNaN(userId)) {
    return res.status(401).json({ error: "\u0985\u0995\u09BE\u09B0\u09CD\u09AF\u0995\u09B0 \u0987\u0989\u099C\u09BE\u09B0 \u0986\u0987\u09A1\u09BF\u0964" });
  }
  try {
    const user = await DB.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "\u0987\u0989\u099C\u09BE\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: "\u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09A4\u09CD\u09B0\u09C1\u099F\u09BF\u0964" });
  }
};
var requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "\u09B6\u09C1\u09A7\u09C1\u09AE\u09BE\u09A4\u09CD\u09B0 \u098F\u09A1\u09AE\u09BF\u09A8 \u098F\u0987 \u0995\u09BE\u099C\u099F\u09BF \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964" });
  }
  next();
};
app.get("/api/db-status", async (req, res) => {
  try {
    const dbStatus = await DB.getStatus();
    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/auth/register", async (req, res) => {
  const { name, phone, email, password, sponsorId } = req.body;
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: "\u09A6\u09DF\u09BE \u0995\u09B0\u09C7 \u09B8\u09AC\u0995\u099F\u09BF \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C0\u09DF \u09A4\u09A5\u09CD\u09AF \u09AA\u09C2\u09B0\u09A3 \u0995\u09B0\u09C1\u09A8\u0964" });
  }
  try {
    const existingUser = await DB.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "\u098F\u0987 \u0987\u09AE\u09C7\u0987\u09B2 \u09A6\u09BF\u09DF\u09C7 \u0987\u09A4\u09BF\u09AE\u09A7\u09CD\u09AF\u09C7\u0987 \u098F\u0995\u099F\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u0996\u09CB\u09B2\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
    }
    let referrerIdVal = null;
    if (sponsorId) {
      const parsedSponsorId = parseInt(sponsorId, 10);
      if (isNaN(parsedSponsorId)) {
        return res.status(400).json({ error: "\u09B8\u09CD\u09AA\u09A8\u09CD\u09B8\u09B0 \u0986\u0987\u09A1\u09BF \u0985\u09AC\u09B6\u09CD\u09AF\u0987 \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7\u0964" });
      }
      const sponsor = await DB.getUserById(parsedSponsorId);
      if (!sponsor) {
        return res.status(400).json({ error: "\u09AA\u09CD\u09B0\u09A6\u09A4\u09CD\u09A4 \u09B8\u09CD\u09AA\u09A8\u09CD\u09B8\u09B0 \u0986\u0987\u09A1\u09BF \u09AC\u09BE \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09B2 \u0986\u0987\u09A1\u09BF\u099F\u09BF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964" });
      }
      if (sponsor.status !== "active") {
        return res.status(400).json({ error: "\u09AA\u09CD\u09B0\u09A6\u09A4\u09CD\u09A4 \u09B8\u09CD\u09AA\u09A8\u09CD\u09B8\u09B0 \u0986\u0987\u09A1\u09BF\u099F\u09BF \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF (Inactive)\u0964 \u09B6\u09C1\u09A7\u09C1\u09AE\u09BE\u09A4\u09CD\u09B0 \u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u09B8\u09CD\u09AA\u09A8\u09CD\u09B8\u09B0\u09C7\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 \u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC\u0964" });
      }
      referrerIdVal = parsedSponsorId;
    } else {
      const allUsers = await DB.getUsers();
      if (allUsers.length > 1) {
        return res.status(400).json({ error: "\u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u0995\u099F\u09BF \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09B2 \u09AC\u09BE \u09B8\u09CD\u09AA\u09A8\u09CD\u09B8\u09B0 \u0986\u0987\u09A1\u09BF \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u0964" });
      } else {
        const admin = allUsers.find((u) => u.role === "admin");
        referrerIdVal = admin ? admin.id : 1;
      }
    }
    const newUser = await DB.createUser({
      name,
      phone,
      email,
      password,
      referrer_id: referrerIdVal,
      status: "inactive",
      // New registers are inactive by default until approved
      role: "user",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.status(201).json({
      message: "\u09A8\u09BF\u09AC\u09A8\u09CD\u09A7\u09A8 \u09B8\u09AB\u09B2 \u09B9\u09DF\u09C7\u099B\u09C7! \u0986\u09AA\u09A8\u09BE\u09B0 \u0986\u0987\u09A1\u09BF\u099F\u09BF \u098F\u09A1\u09AE\u09BF\u09A8 \u098F\u09AA\u09CD\u09B0\u09C1\u09AD\u09BE\u09B2\u09C7\u09B0 \u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE\u09DF \u09B0\u09DF\u09C7\u099B\u09C7\u0964",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        referrer_id: newUser.referrer_id,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "\u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09C7\u09B6\u09A8 \u0995\u09B0\u09BE\u09B0 \u09B8\u09AE\u09DF \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u0998\u099F\u09C7\u099B\u09C7\u0964" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "\u0987\u09AE\u09C7\u0987\u09B2 \u098F\u09AC\u0982 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09C1\u09A8\u0964" });
  }
  try {
    const user = await DB.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "\u0987\u09AE\u09C7\u0987\u09B2 \u0985\u09A5\u09AC\u09BE \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF\u0964" });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "\u0987\u09AE\u09C7\u0987\u09B2 \u0985\u09A5\u09AC\u09BE \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09B8\u09A0\u09BF\u0995 \u09A8\u09DF\u0964" });
    }
    if (user.status !== "active" && user.role !== "admin") {
      return res.status(403).json({
        error: "\u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u099F\u09BF \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF (Inactive) \u09B0\u09DF\u09C7\u099B\u09C7\u0964 \u098F\u09A1\u09AE\u09BF\u09A8 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09A8 \u0995\u09B0\u09B2\u09C7\u0987 \u0986\u09AA\u09A8\u09BF \u09A1\u09CD\u09AF\u09BE\u09B6\u09AC\u09CB\u09B0\u09CD\u09A1 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"
      });
    }
    res.json({
      message: "\u09B2\u0997\u0987\u09A8 \u09B8\u09AB\u09B2 \u09B9\u09DF\u09C7\u099B\u09C7!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referrer_id: user.referrer_id,
        status: user.status,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "\u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09BE\u09B0 \u09B8\u09AE\u09DF \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u0998\u099F\u09C7\u099B\u09C7\u0964" });
  }
});
app.get("/api/auth/me", authenticateUser, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    referrer_id: user.referrer_id,
    status: user.status,
    role: user.role,
    created_at: user.created_at
  });
});
app.get("/api/user/downline", authenticateUser, async (req, res) => {
  const currentUser = req.user;
  let targetUserId = currentUser.id;
  const queryUserId = req.query.userId;
  if (queryUserId && currentUser.role === "admin") {
    targetUserId = parseInt(queryUserId, 10);
  }
  try {
    const downlineData = await DB.getDownlineData(targetUserId);
    res.json(downlineData);
  } catch (err) {
    console.error("Fetch downline error:", err);
    res.status(500).json({ error: "\u09A1\u09BE\u0989\u09A8\u09B2\u09BE\u0987\u09A8 \u09B0\u09C7\u09AB\u09BE\u09B0\u09C7\u09B2 \u09A1\u09BE\u099F\u09BE \u09B2\u09CB\u09A1 \u0995\u09B0\u09A4\u09C7 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
  }
});
app.get("/api/admin/users", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await DB.getUsers();
    const stats = await DB.getStats();
    const sanitizedUsers = users.map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
    res.json({
      users: sanitizedUsers,
      stats
    });
  } catch (err) {
    console.error("Admin fetch users error:", err);
    res.status(500).json({ error: "\u0987\u0989\u099C\u09BE\u09B0\u09A6\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u098F\u09AC\u0982 \u09AA\u09B0\u09BF\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09A8 \u09B2\u09CB\u09A1 \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09B9\u09DF\u09A8\u09BF\u0964" });
  }
});
app.post("/api/admin/approve", authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "\u0987\u0989\u099C\u09BE\u09B0 \u0986\u0987\u09A1\u09BF \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964" });
  }
  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: "\u0987\u0989\u099C\u09BE\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964" });
    }
    const updated = await DB.updateUserStatus(targetUser.id, "active");
    res.json({
      message: `${targetUser.name} \u098F\u09B0 \u0986\u0987\u09A1\u09BF \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09B8\u0995\u09CD\u09B0\u09BF\u09DF (Active) \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`,
      user: {
        id: updated?.id,
        name: updated?.name,
        status: updated?.status
      }
    });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "\u0987\u0989\u099C\u09BE\u09B0\u0995\u09C7 \u09B8\u0995\u09CD\u09B0\u09BF\u09DF \u0995\u09B0\u09BE\u09B0 \u09B8\u09AE\u09DF \u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u0998\u099F\u09C7\u099B\u09C7\u0964" });
  }
});
app.post("/api/admin/suspend", authenticateUser, requireAdmin, async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "\u0987\u0989\u099C\u09BE\u09B0 \u0986\u0987\u09A1\u09BF \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09BE \u09B9\u09DF\u09A8\u09BF\u0964" });
  }
  try {
    const targetUser = await DB.getUserById(parseInt(userId, 10));
    if (!targetUser) {
      return res.status(404).json({ error: "\u0987\u0989\u099C\u09BE\u09B0 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964" });
    }
    if (targetUser.role === "admin") {
      return res.status(400).json({ error: "\u09B8\u09BF\u09B8\u09CD\u099F\u09C7\u09AE \u098F\u09A1\u09AE\u09BF\u09A8\u0995\u09C7 \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF \u0995\u09B0\u09BE \u09B8\u09AE\u09CD\u09AD\u09AC \u09A8\u09DF\u0964" });
    }
    const updated = await DB.updateUserStatus(targetUser.id, "inactive");
    res.json({
      message: `${targetUser.name} \u098F\u09B0 \u0986\u0987\u09A1\u09BF \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF (Inactive) \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`,
      user: {
        id: updated?.id,
        name: updated?.name,
        status: updated?.status
      }
    });
  } catch (err) {
    console.error("Suspend error:", err);
    res.status(500).json({ error: "\u0987\u0989\u099C\u09BE\u09B0\u0995\u09C7 \u09A8\u09BF\u09B7\u09CD\u0995\u09CD\u09B0\u09BF\u09DF \u0995\u09B0\u09BE\u09B0 \u09B8\u09AE\u09DF \u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u0998\u099F\u09C7\u099B\u09C7\u0964" });
  }
});
async function bootstrap() {
  await DB.init();
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
// deployed successfully
