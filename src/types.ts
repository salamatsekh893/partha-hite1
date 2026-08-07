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

export interface CustomLevelCommission {
  level: number;
  percentage?: number;
  amount?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  subCategories: string[];
}

export interface SolarProduct {
  id: number;
  name: string;
  category: string;
  subCategory?: string;
  sku?: string;
  brand?: string;
  mrp: number; // Maximum Retail Price ₹
  distributorPrice: number; // DP / Selling Price ₹
  businessValue: number; // BV
  pointValue: number; // PV
  stock?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'sold_out';
  image: string;
  isUpcoming: boolean;
  description: string;

  // Payment Options
  paymentType?: 'both' | 'cod_only' | 'online_only';
  advancePaymentRequired?: boolean;
  advancePaymentNote?: string;

  // Custom Level Commission Settings
  useCustomCommission?: boolean;
  customCommissionLevels?: CustomLevelCommission[];

  // Offers & Discounts
  isOfferActive?: boolean;
  offerPrice?: number;
  discountPercent?: number;
  flatDiscount?: number;
  couponOffer?: string;
  offerStartDate?: string;
  offerEndDate?: string;
  offerStartTime?: string;
  offerEndTime?: string;
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

export interface CompanyFundLog {
  id: string;
  orderId: string;
  memberId: number;
  memberName: string;
  level: number;
  levelName: string;
  amount: number;
  percentage: number;
  timestamp: string;
  dateOnly: string;
  reason: string;
  productName: string;
  totalBV: number;
}

export interface BusinessTargetConfig {
  id: string;
  title: string;
  description: string;
  directBvTarget: number;
  directPvTarget: number;
  teamBvTarget: number;
  teamPvTarget: number;
  ratioRuleEnabled: boolean;
  strongLegMaxRatio: number; // e.g. 50%
  otherLegsMinRatio: number; // e.g. 50%
  startDate: string;
  endDate: string;
  isActive: boolean;
  rewardTitle?: string;
}

