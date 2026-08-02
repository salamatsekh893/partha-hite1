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
  additional_details?: string;
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
  referrer_phone?: string;
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

export interface WebsiteContent {
  id: number;
  type: 'video' | 'photo' | 'text';
  title: string;
  description?: string;
  media_url?: string;
  badge?: string;
  category?: string;
  is_active: boolean | number;
  created_at: string;
}

export interface SolarProduct {
  id: number;
  name: string;
  category: string;
  mrp: number; // Maximum Retail Price ₹
  distributorPrice: number; // DP ₹
  businessValue: number; // BV
  pointValue: number; // PV
  image: string;
  isUpcoming: boolean;
  description: string;
}

export interface ProductOrder {
  id: string;
  userId?: number;
  productId: number;
  productName: string;
  qty: number;
  totalAmount: number;
  totalBV: number;
  totalPV: number;
  orderDate: string;
  status: 'Pending' | 'Approved' | 'Shipped' | 'Delivered';
  shippingAddress: string;
}

export interface OfferItem {
  id: string;
  title: string;
  reward: string;
  criteria: string;
  validTill: string;
  badge: string;
  progressPercent: number;
  category: string;
}
