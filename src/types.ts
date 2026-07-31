export interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  password?: string;
  referrer_id: number | null;
  status: 'active' | 'inactive';
  role: 'user' | 'admin';
  created_at: string;
}

export interface DownlineMember {
  id: number;
  name: string;
  phone: string;
  email: string;
  referrer_id: number | null;
  status: 'active' | 'inactive';
  level: number; // level relative to the logged-in user
  created_at: string;
  referrer_name?: string;
}

export interface ReferralTreeNode {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  level: number;
  children: ReferralTreeNode[];
}

export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  maxLevelsDeep: number;
}

export interface DBConfigStatus {
  isMySQL: boolean;
  connected: boolean;
  host?: string;
  database?: string;
  error?: string | null;
}
