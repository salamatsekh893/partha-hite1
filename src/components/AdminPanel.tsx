import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, RefreshCw, 
  Calendar, Shield, ShieldCheck, UserCheck, AlertCircle, Phone, Mail, Network, FileText, Trash2, Edit,
  Globe, Video, Image as ImageIcon, Plus, Eye, EyeOff, Sparkles, Upload, Play, Check, ExternalLink, Layers, X, LogIn,
  ShoppingBag, DollarSign, ArrowUpRight, CheckSquare, Clock, Settings, AlertTriangle, Building2, Wallet, FileSpreadsheet, Printer, Filter,
  Package, Tag, FolderPlus, Sliders, Percent, ToggleLeft, ToggleRight, Box, Sparkle, Award
} from 'lucide-react';
import { User, SystemStats, ReferralTreeNode, WebsiteContent, ProductOrder, CompanyFundLog, SolarProduct, ProductCategory, CustomLevelCommission, BusinessTargetConfig } from '../types.js';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/products.js';
import { getEmbedVideoUrl, getDirectImageUrl } from '../utils/mediaUtils.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';
import VisualTree from './VisualTree.js';
import ProfileEditModal from './ProfileEditModal.js';

interface AdminPanelProps {
  adminUser: User;
  initialTab?: 'members' | 'website' | 'orders' | 'company-fund' | 'products' | 'business-targets';
  onImpersonateUser?: (user: User) => void;
  orders?: ProductOrder[];
  onOrdersChange?: (orders: ProductOrder[]) => void;
  products?: SolarProduct[];
  onProductsChange?: (products: SolarProduct[]) => void;
  categories?: ProductCategory[];
  onCategoriesChange?: (categories: ProductCategory[]) => void;
}

export default function AdminPanel({ 
  adminUser, 
  initialTab = 'members', 
  onImpersonateUser, 
  orders: propOrders, 
  onOrdersChange,
  products: propProducts,
  onProductsChange,
  categories: propCategories,
  onCategoriesChange
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'website' | 'orders' | 'company-fund' | 'products' | 'business-targets'>(initialTab);
  const [directLoginId, setDirectLoginId] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Orders State
  const [localOrders, setLocalOrders] = useState<ProductOrder[]>([]);
  const ordersList = propOrders !== undefined ? propOrders : localOrders;
  const [orderSearchTerm, setOrderSearchTerm] = useState('');

  // --- PRODUCT & CATEGORY MANAGEMENT ENGINE STATE ---
  const [localProducts, setLocalProducts] = useState<SolarProduct[]>(() => {
    try {
      const saved = localStorage.getItem('mlm_solar_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });
  const products = propProducts !== undefined ? propProducts : localProducts;

  const updateProductsState = (newProducts: SolarProduct[]) => {
    setLocalProducts(newProducts);
    if (onProductsChange) {
      onProductsChange(newProducts);
    }
    localStorage.setItem('mlm_solar_products', JSON.stringify(newProducts));
  };

  const [localCategories, setLocalCategories] = useState<ProductCategory[]>(() => {
    try {
      const saved = localStorage.getItem('mlm_product_categories');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CATEGORIES;
  });
  const categories = propCategories !== undefined ? propCategories : localCategories;

  const updateCategoriesState = (newCategories: ProductCategory[]) => {
    setLocalCategories(newCategories);
    if (onCategoriesChange) {
      onCategoriesChange(newCategories);
    }
    localStorage.setItem('mlm_product_categories', JSON.stringify(newCategories));
  };

  // Product Modals & Filters
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SolarProduct | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Filters
  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all');
  const [prodStockFilter, setProdStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'sold_out'>('all');
  const [prodOfferFilter, setProdOfferFilter] = useState<'all' | 'offer_only'>('all');

  // Product Form State
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('Solar Panels');
  const [pSubCategory, setPSubCategory] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pSku, setPSku] = useState('');
  const [pMrp, setPMrp] = useState<number>(0);
  const [pDistributorPrice, setPDistributorPrice] = useState<number>(0);
  const [pBusinessValue, setPBusinessValue] = useState<number>(0);
  const [pPointValue, setPPointValue] = useState<number>(0);
  const [pStock, setPStock] = useState<number>(50);
  const [pStockStatus, setPStockStatus] = useState<'in_stock' | 'out_of_stock' | 'sold_out'>('in_stock');
  const [pImage, setPImage] = useState('');
  const [pIsUpcoming, setPIsUpcoming] = useState(false);
  const [pDescription, setPDescription] = useState('');
  const [pPaymentType, setPPaymentType] = useState<'both' | 'cod_only' | 'online_only'>('both');
  const [pAdvancePaymentRequired, setPAdvancePaymentRequired] = useState(false);
  const [pAdvancePaymentNote, setPAdvancePaymentNote] = useState('');

  // Custom Level Commission State inside Form
  const [pUseCustomCommission, setPUseCustomCommission] = useState(false);
  const [pCustomCommissionLevels, setPCustomCommissionLevels] = useState<CustomLevelCommission[]>([
    { level: 1, percentage: 30 },
    { level: 2, percentage: 20 },
    { level: 3, percentage: 15 },
    { level: 4, percentage: 10 },
    { level: 5, percentage: 5 }
  ]);

  // Offer State inside Form
  const [pIsOfferActive, setPIsOfferActive] = useState(false);
  const [pOfferPrice, setPOfferPrice] = useState<number>(0);
  const [pDiscountPercent, setPDiscountPercent] = useState<number>(0);
  const [pFlatDiscount, setPFlatDiscount] = useState<number>(0);
  const [pCouponOffer, setPCouponOffer] = useState('');
  const [pOfferStartDate, setPOfferStartDate] = useState('');
  const [pOfferEndDate, setPOfferEndDate] = useState('');
  const [pOfferStartTime, setPOfferStartTime] = useState('00:00');
  const [pOfferEndTime, setPOfferEndTime] = useState('23:59');

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [selectedCatIdForSub, setSelectedCatIdForSub] = useState<string | null>(null);
  const [newSubCatName, setNewSubCatName] = useState('');

  // Handlers for Product Form Reset & Load
  const handleOpenAddProductModal = () => {
    setEditingProduct(null);
    setPName('');
    setPCategory(categories[0]?.name || 'Solar Panels');
    setPSubCategory(categories[0]?.subCategories[0] || '');
    setPBrand('');
    setPSku(`SP-${Math.floor(1000 + Math.random() * 9000)}`);
    setPMrp(10000);
    setPDistributorPrice(8000);
    setPBusinessValue(5000);
    setPPointValue(50);
    setPStock(50);
    setPStockStatus('in_stock');
    setPImage('https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80');
    setPIsUpcoming(false);
    setPDescription('Premium high performance solar system designed for commercial & residential rooftops.');
    setPPaymentType('both');
    setPAdvancePaymentRequired(false);
    setPAdvancePaymentNote('');
    setPUseCustomCommission(false);
    setPCustomCommissionLevels([
      { level: 1, percentage: 30 },
      { level: 2, percentage: 20 },
      { level: 3, percentage: 15 },
      { level: 4, percentage: 10 },
      { level: 5, percentage: 5 }
    ]);
    setPIsOfferActive(false);
    setPOfferPrice(0);
    setPDiscountPercent(0);
    setPFlatDiscount(0);
    setPCouponOffer('');
    setPOfferStartDate('');
    setPOfferEndDate('');
    setPOfferStartTime('00:00');
    setPOfferEndTime('23:59');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProductModal = (prod: SolarProduct) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPCategory(prod.category);
    setPSubCategory(prod.subCategory || '');
    setPBrand(prod.brand || '');
    setPSku(prod.sku || `SP-${prod.id}`);
    setPMrp(prod.mrp);
    setPDistributorPrice(prod.distributorPrice);
    setPBusinessValue(prod.businessValue);
    setPPointValue(prod.pointValue);
    setPStock(prod.stock !== undefined ? prod.stock : 50);
    setPStockStatus(prod.stockStatus || 'in_stock');
    setPImage(prod.image);
    setPIsUpcoming(prod.isUpcoming || false);
    setPDescription(prod.description);
    setPPaymentType(prod.paymentType || 'both');
    setPAdvancePaymentRequired(prod.advancePaymentRequired || false);
    setPAdvancePaymentNote(prod.advancePaymentNote || '');
    setPUseCustomCommission(prod.useCustomCommission || false);
    setPCustomCommissionLevels(prod.customCommissionLevels && prod.customCommissionLevels.length > 0 ? prod.customCommissionLevels : [
      { level: 1, percentage: 30 },
      { level: 2, percentage: 20 },
      { level: 3, percentage: 15 },
      { level: 4, percentage: 10 },
      { level: 5, percentage: 5 }
    ]);
    setPIsOfferActive(prod.isOfferActive || false);
    setPOfferPrice(prod.offerPrice || 0);
    setPDiscountPercent(prod.discountPercent || 0);
    setPFlatDiscount(prod.flatDiscount || 0);
    setPCouponOffer(prod.couponOffer || '');
    setPOfferStartDate(prod.offerStartDate || '');
    setPOfferEndDate(prod.offerEndDate || '');
    setPOfferStartTime(prod.offerStartTime || '00:00');
    setPOfferEndTime(prod.offerEndTime || '23:59');
    setIsProductModalOpen(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      alert('প্রোডাক্টের নাম লিখুন (Product Name is required)');
      return;
    }
    if (pMrp <= 0 || pDistributorPrice <= 0) {
      alert('সঠিক MRP এবং Selling Price নির্ধারণ করুন');
      return;
    }

    const updatedProd: SolarProduct = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: pName.trim(),
      category: pCategory,
      subCategory: pSubCategory.trim(),
      brand: pBrand.trim(),
      sku: pSku.trim(),
      mrp: Number(pMrp),
      distributorPrice: Number(pDistributorPrice),
      businessValue: Number(pBusinessValue),
      pointValue: Number(pPointValue),
      stock: Number(pStock),
      stockStatus: pStockStatus,
      image: pImage.trim() || 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80',
      isUpcoming: pIsUpcoming,
      description: pDescription.trim(),
      paymentType: pPaymentType,
      advancePaymentRequired: pAdvancePaymentRequired,
      advancePaymentNote: pAdvancePaymentNote.trim(),
      useCustomCommission: pUseCustomCommission,
      customCommissionLevels: pUseCustomCommission ? pCustomCommissionLevels : [],
      isOfferActive: pIsOfferActive,
      offerPrice: pIsOfferActive ? Number(pOfferPrice) : undefined,
      discountPercent: pIsOfferActive ? Number(pDiscountPercent) : undefined,
      flatDiscount: pIsOfferActive ? Number(pFlatDiscount) : undefined,
      couponOffer: pIsOfferActive ? pCouponOffer.trim() : undefined,
      offerStartDate: pIsOfferActive ? pOfferStartDate : undefined,
      offerEndDate: pIsOfferActive ? pOfferEndDate : undefined,
      offerStartTime: pIsOfferActive ? pOfferStartTime : undefined,
      offerEndTime: pIsOfferActive ? pOfferEndTime : undefined,
    };

    let newProds: SolarProduct[] = [];
    if (editingProduct) {
      newProds = products.map(p => p.id === editingProduct.id ? updatedProd : p);
    } else {
      newProds = [updatedProd, ...products];
    }

    updateProductsState(newProds);
    setIsProductModalOpen(false);
    setSuccessMsg(editingProduct ? 'প্রোডাক্ট সফলভাবে আপডেট করা হয়েছে!' : 'নতুন প্রোডাক্ট সফলভাবে যুক্ত করা হয়েছে!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleDeleteProduct = (prodId: number, prodName: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে "${prodName}" প্রোডাক্টটি সম্পূর্ণ মুছে ফেলতে চান?`)) {
      const newProds = products.filter(p => p.id !== prodId);
      updateProductsState(newProds);
      setSuccessMsg(`"${prodName}" প্রোডাক্টটি সফলভাবে মুছে ফেলা হয়েছে।`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleToggleProductStock = (prodId: number) => {
    const newProds = products.map(p => {
      if (p.id === prodId) {
        const nextStatus = p.stockStatus === 'sold_out' || p.stockStatus === 'out_of_stock' ? 'in_stock' : 'sold_out';
        return {
          ...p,
          stockStatus: nextStatus as 'in_stock' | 'out_of_stock' | 'sold_out'
        };
      }
      return p;
    });
    updateProductsState(newProds);
  };

  // Category & SubCategory Handlers
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const catId = `cat-${Date.now()}`;
    const newCat: ProductCategory = {
      id: catId,
      name: newCatName.trim(),
      subCategories: []
    };
    updateCategoriesState([...categories, newCat]);
    setNewCatName('');
  };

  const handleAddSubCategorySubmit = (catId: string) => {
    if (!newSubCatName.trim()) return;
    const newCats = categories.map(c => {
      if (c.id === catId) {
        if (!c.subCategories.includes(newSubCatName.trim())) {
          return { ...c, subCategories: [...c.subCategories, newSubCatName.trim()] };
        }
      }
      return c;
    });
    updateCategoriesState(newCats);
    setNewSubCatName('');
  };

  const handleDeleteSubCategory = (catId: string, subName: string) => {
    const newCats = categories.map(c => {
      if (c.id === catId) {
        return { ...c, subCategories: c.subCategories.filter(s => s !== subName) };
      }
      return c;
    });
    updateCategoriesState(newCats);
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    if (confirm(`আপনি কি "${catName}" ক্যাটাগরি এবং এর সকল সাব-ক্যাটাগরি মুছে ফেলতে চান?`)) {
      updateCategoriesState(categories.filter(c => c.id !== catId));
    }
  };
  const [orderStatusTab, setOrderStatusTab] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  // Level Incentive Engine Settings
  const [maxIncentiveLevels, setMaxIncentiveLevels] = useState<number>(10);
  const [commissionPoolPercent, setCommissionPoolPercent] = useState<number>(15);
  const [levelPercentages, setLevelPercentages] = useState<{ [level: number]: number }>({
    1: 30, // Level 1 Upline gets 30% of commission pool
    2: 20, // Level 2 Upline gets 20% of pool
    3: 15, // Level 3 Upline gets 15% of pool
    4: 10, // Level 4 Upline gets 10% of pool
    5: 5,  // Level 5 Upline gets 5% of pool
    6: 5,  // Level 6 Upline gets 5% of pool
    7: 4,  // Level 7 Upline gets 4% of pool
    8: 4,  // Level 8 Upline gets 4% of pool
    9: 4,  // Level 9 Upline gets 4% of pool
    10: 3, // Level 10 Upline gets 3% of pool
    11: 2, 12: 2, 13: 2, 14: 2, 15: 2
  });

  // Company Fund History & Audit Log State
  const [fundSearchTerm, setFundSearchTerm] = useState('');
  const [fundLevelFilter, setFundLevelFilter] = useState<string>('all');
  const [fundDateFilter, setFundDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [companyFundLogs, setCompanyFundLogs] = useState<CompanyFundLog[]>(() => {
    try {
      const saved = localStorage.getItem('mlm_company_fund_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "CFL-ORD-849201-L3",
        orderId: "ORD-849201",
        memberId: 104,
        memberName: "Rahul Roy",
        level: 3,
        levelName: "Level 3",
        amount: 1125,
        percentage: 15,
        timestamp: "06 Aug 2026, 02:30:15 PM",
        dateOnly: "2026-08-06",
        reason: "নির্ধারিত লেভেল ৩-এ কোনো যোগ্য আপলাইন সদস্য না থাকা (Unclaimed Upline Level Reversion)",
        productName: "5kW Grid-Tied Solar System",
        totalBV: 25000
      },
      {
        id: "CFL-ORD-849201-L4",
        orderId: "ORD-849201",
        memberId: 104,
        memberName: "Rahul Roy",
        level: 4,
        levelName: "Level 4",
        amount: 750,
        percentage: 10,
        timestamp: "06 Aug 2026, 02:30:15 PM",
        dateOnly: "2026-08-06",
        reason: "নির্ধারিত লেভেল ৪-এ কোনো যোগ্য আপলাইন সদস্য না থাকা (Unclaimed Upline Level Reversion)",
        productName: "5kW Grid-Tied Solar System",
        totalBV: 25000
      },
      {
        id: "CFL-ORD-849201-L5",
        orderId: "ORD-849201",
        memberId: 104,
        memberName: "Rahul Roy",
        level: 5,
        levelName: "Level 5",
        amount: 375,
        percentage: 5,
        timestamp: "06 Aug 2026, 02:30:15 PM",
        dateOnly: "2026-08-06",
        reason: "নির্ধারিত লেভেল ৫-এ কোনো যোগ্য আপলাইন সদস্য না থাকা (Unclaimed Upline Level Reversion)",
        productName: "5kW Grid-Tied Solar System",
        totalBV: 25000
      },
      {
        id: "CFL-ORD-739102-L2",
        orderId: "ORD-739102",
        memberId: 108,
        memberName: "Ananya Ghosh",
        level: 2,
        levelName: "Level 2",
        amount: 1080,
        percentage: 20,
        timestamp: "05 Aug 2026, 11:15:40 AM",
        dateOnly: "2026-08-05",
        reason: "নির্ধারিত লেভেল ২-এ কোনো যোগ্য আপলাইন সদস্য না থাকা (Unclaimed Upline Level Reversion)",
        productName: "3kW Solar Inverter",
        totalBV: 18000
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mlm_company_fund_logs', JSON.stringify(companyFundLogs));
  }, [companyFundLogs]);

  // Business Target & 50:50 Ratio Configuration State
  const [targetConfig, setTargetConfig] = useState<BusinessTargetConfig>(() => {
    try {
      const saved = localStorage.getItem('mlm_business_target_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing business target config:', e);
    }
    return {
      id: 'TARGET-2026-01',
      title: 'Executive Star Royalty & Business Target 2026',
      description: 'বিজনেস ভ্যালু (BV) ও পয়েন্ট ভ্যালু (PV)-এর জন্য ৫০:৫০ রেশিও অনুযায়ী পৃথক ও সম্মিলিত টার্গেট সিস্টেম',
      targetPeriodType: 'yearly',
      bvTarget: 60000,
      pvTarget: 3000,
      directBvTarget: 10000,
      directPvTarget: 500,
      teamBvTarget: 50000,
      teamPvTarget: 2500,
      ratioRuleEnabled: true,
      strongLegMaxRatio: 50,
      otherLegsMinRatio: 50,
      startDate: '2026-08-01',
      endDate: '2026-12-31',
      isActive: true,
      rewardTitle: 'Executive Star Rank & Royalty Qualification',
      rewardGift: 'iPhone 15 Pro / 55" Smart 4K TV / Gold Coin',
      rewardIncentive: '5% Monthly Company Global Royalty Pool Share',
      rewardBonusAmount: 25000
    };
  });

  const [targetSearchTerm, setTargetSearchTerm] = useState('');
  const [targetStatusFilter, setTargetStatusFilter] = useState<'all' | 'achieved' | 'in_progress'>('all');

  useEffect(() => {
    localStorage.setItem('mlm_business_target_config', JSON.stringify(targetConfig));
    window.dispatchEvent(new CustomEvent('business-target-updated', { detail: targetConfig }));
  }, [targetConfig]);

  // Commission & Company Reverted Funds Audit Ledger
  const [auditLogs, setAuditLogs] = useState<Array<{
    orderId: string;
    productName: string;
    buyerName: string;
    buyerId: number;
    totalAmount: number;
    totalBV: number;
    totalCommissionPool: number;
    buyerIncentive: number;
    uplinePaidTotal: number;
    uplineBreakdown: Array<{ level: number; amount: number }>;
    companyRevertedAmount: number;
    revertedLevels: string;
    approvalDate: string;
  }>>([]);

  // --- ORDER APPROVAL & LEVEL INCENTIVE ENGINE ---
  const handleApproveOrder = (order: ProductOrder) => {
    // 1. Calculate Total Commission Pool for this order
    const totalPool = Math.round((order.totalBV || 0) * (commissionPoolPercent / 100));

    // 2. Buyer gets 0 direct incentive (per user explicit rule)
    const buyerIncentive = 0;

    // 3. Find Buyer Name and Upline Chain
    const buyerUser = users.find(u => u.id === order.userId);
    const buyerName = buyerUser ? buyerUser.name : (adminUser.name || `Distributor #${order.userId || 1}`);

    // Trace Upline Sponsors
    let currentRefId = buyerUser ? buyerUser.referrer_id : null;
    const uplineChain: { level: number; userId: number; name: string }[] = [];
    let level = 1;

    while (currentRefId && level <= maxIncentiveLevels) {
      const uplineUser = users.find(u => u.id === currentRefId);
      if (uplineUser) {
        uplineChain.push({ level, userId: uplineUser.id, name: uplineUser.name });
        currentRefId = uplineUser.referrer_id;
        level++;
      } else {
        break;
      }
    }

    // 4. Calculate Upline Level Distribution & Company Reverted Funds
    let uplinePaidTotal = 0;
    const uplineBreakdown: Array<{ level: number; amount: number }> = [];
    const newFundLogs: CompanyFundLog[] = [];
    const nowFormatted = new Date().toLocaleString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const dateOnly = new Date().toISOString().split('T')[0];

    for (let l = 1; l <= maxIncentiveLevels; l++) {
      const levelPct = levelPercentages[l] || 0;
      const levelAmount = Math.round(totalPool * (levelPct / 100));
      const hasUpline = uplineChain.some(u => u.level === l);

      if (hasUpline) {
        uplinePaidTotal += levelAmount;
        uplineBreakdown.push({ level: l, amount: levelAmount });
      } else {
        // Record Company Fund Reversion Audit Entry
        if (levelAmount > 0) {
          newFundLogs.push({
            id: `CFL-${order.id}-L${l}`,
            orderId: order.id,
            memberId: order.userId || 1,
            memberName: buyerName,
            level: l,
            levelName: `Level ${l}`,
            amount: levelAmount,
            percentage: levelPct,
            timestamp: nowFormatted,
            dateOnly,
            reason: `নির্ধারিত লেভেল ${l}-এ কোনো যোগ্য আপলাইন সদস্য না থাকা (Unclaimed Upline Level Reversion)`,
            productName: order.productName,
            totalBV: order.totalBV || 0
          });
        }
      }
    }

    if (newFundLogs.length > 0) {
      setCompanyFundLogs(prev => [...newFundLogs, ...prev]);
    }

    const companyRevertedAmount = totalPool - uplinePaidTotal;
    const missingStart = uplineChain.length + 1;
    const revertedLevels = missingStart <= maxIncentiveLevels 
      ? `Level ${missingStart} to Level ${maxIncentiveLevels} (No Uplines Exist - Returned to Company)`
      : 'None (All Uplines Present)';

    // Update order status in central state
    const updated = ordersList.map(o => o.id === order.id ? { ...o, status: 'Approved' as const } : o);
    if (onOrdersChange) {
      onOrdersChange(updated);
    } else {
      setLocalOrders(updated);
    }

    // Append Audit Log
    const newAudit = {
      orderId: order.id,
      productName: order.productName,
      buyerName,
      buyerId: order.userId || 1,
      totalAmount: order.totalAmount,
      totalBV: order.totalBV,
      totalCommissionPool: totalPool,
      buyerIncentive,
      uplinePaidTotal,
      uplineBreakdown,
      companyRevertedAmount,
      revertedLevels,
      approvalDate: new Date().toISOString().split('T')[0]
    };

    setAuditLogs(prev => [newAudit, ...prev.filter(a => a.orderId !== order.id)]);

    showSweetToast(
      'success',
      `Order #${order.id} Approved! Commission Pool: ₹${totalPool.toLocaleString('en-IN')} | Paid Uplines: ₹${uplinePaidTotal.toLocaleString('en-IN')} | Company Reverted: ₹${companyRevertedAmount.toLocaleString('en-IN')}`
    );
  };

  const handleRejectOrder = (order: ProductOrder) => {
    const updated = ordersList.map(o => o.id === order.id ? { ...o, status: 'Rejected' as const } : o);
    if (onOrdersChange) {
      onOrdersChange(updated);
    } else {
      setLocalOrders(updated);
    }
    showSweetToast('error', `Order #${order.id} rejected.`);
  };
  
  // Website Content Management State
  const [websiteContents, setWebsiteContents] = useState<WebsiteContent[]>([]);
  const [websiteLoading, setWebsiteLoading] = useState(false);
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'photo' | 'video' | 'text'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(true);
  
  // New content form fields
  const [newType, setNewType] = useState<'photo' | 'video' | 'text'>('photo');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [submittingContent, setSubmittingContent] = useState(false);

  // Edit website content modal
  const [editingContent, setEditingContent] = useState<WebsiteContent | null>(null);

  // Sweet Alert modal confirmation state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    subtitle?: string;
    description: string;
    confirmBtnText: string;
    onConfirm: () => void;
  } | null>(null);

  // Sweet Toast message notification
  const [sweetToast, setSweetToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showSweetToast = (type: 'success' | 'error' | 'info', message: string) => {
    setSweetToast({ type, message });
    setTimeout(() => {
      setSweetToast(null);
    }, 4000);
  };

  // Edit specific user's full profile info
  const [editingUser, setEditingUser] = useState<User | null>(null);


  // Inspect specific user's tree
  const [inspectingUser, setInspectingUser] = useState<Omit<User, 'password'> | null>(null);
  const [inspectedTree, setInspectedTree] = useState<ReferralTreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  // Audit specific user's Success India application details
  const [auditingUser, setAuditingUser] = useState<Omit<User, 'password'> | null>(null);

  // Fetch admin list and stats
  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'X-User-Id': adminUser.id.toString(),
        },
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid non-JSON response.');
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load admin dashboard data.');
      }
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch website contents
  const fetchWebsiteContents = async () => {
    setWebsiteLoading(true);
    try {
      const res = await fetch('/api/admin/website/contents', {
        headers: {
          'X-User-Id': adminUser.id.toString(),
        },
      }).catch(() => null);
      if (!res || !res.ok) return;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) return;
      const data = await res.json().catch(() => null);
      if (data && Array.isArray(data.contents)) {
        setWebsiteContents(data.contents);
      }
    } catch {
      // Gracefully ignore network drops
    } finally {
      setWebsiteLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchWebsiteContents();
  }, [adminUser.id]);

  // Handle local file upload for photos or videos with auto-compression for photos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('File size is larger than 25MB. Please choose a smaller file or paste an external video link.');
      return;
    }

    // If it's an image, compress it via canvas for optimal upload speed & small payload size
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setNewMediaUrl(compressedDataUrl);
          } else {
            setNewMediaUrl(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      return;
    }

    // For videos or other files, read directly
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setNewMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit new content
  const handleCreateWebsiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Please enter a title for the content.');
      return;
    }

    setSubmittingContent(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/website/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': adminUser.id.toString(),
        },
        body: JSON.stringify({
          type: newType,
          title: newTitle,
          description: newDescription,
          media_url: newMediaUrl,
          badge: newBadge,
          category: newCategory,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save website content.');
      }

      setSuccessMsg(data.message || 'Website content published successfully!');
      showSweetToast('success', 'New website content published live! ✨');
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewMediaUrl('');
      setNewBadge('');
      setNewCategory('');
      setIsAddModalOpen(false);

      // Refresh list
      fetchWebsiteContents();
      window.dispatchEvent(new Event('website-contents-updated'));
    } catch (err: any) {
      setError(err.message);
      showSweetToast('error', err.message || 'Failed to create content.');
    } finally {
      setSubmittingContent(false);
    }
  };

  // Toggle content visibility
  const handleToggleActiveContent = async (item: WebsiteContent) => {
    try {
      const res = await fetch(`/api/admin/website/contents/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': adminUser.id.toString(),
        },
        body: JSON.stringify({
          is_active: !item.is_active,
        }),
      });
      if (res.ok) {
        setWebsiteContents(prev =>
          prev.map(c => c.id === item.id ? { ...c, is_active: !item.is_active } : c)
        );
        window.dispatchEvent(new Event('website-contents-updated'));
        showSweetToast('info', item.is_active ? 'Content hidden from live website.' : 'Content is now live on website!');
      }
    } catch (err) {
      console.error('Failed to toggle content status:', err);
    }
  };

  // Delete content with Sweet Alert Modal confirmation
  const handleDeleteContent = (item: WebsiteContent) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Website Item?',
      subtitle: 'Confirm permanent deletion',
      description: `Are you sure you want to delete "${item.title}"? This item will be permanently removed from the website.`,
      confirmBtnText: 'Yes, Delete Item',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetch(`/api/admin/website/contents/${item.id}`, {
            method: 'DELETE',
            headers: {
              'X-User-Id': adminUser.id.toString(),
            },
          });
          if (res.ok) {
            setWebsiteContents(prev => prev.filter(c => c.id !== item.id));
            window.dispatchEvent(new Event('website-contents-updated'));
            showSweetToast('success', `"${item.title}" item deleted successfully!`);
          } else {
            const data = await res.json();
            showSweetToast('error', data.error || 'Failed to delete content.');
          }
        } catch (err) {
          console.error('Failed to delete content:', err);
          showSweetToast('error', 'Network error while deleting content.');
        }
      }
    });
  };


  // Keep local users list synchronized if adminUser prop updates
  useEffect(() => {
    if (adminUser) {
      setUsers(prev => prev.map(u => u.id === adminUser.id ? { ...u, ...adminUser } : u));
    }
  }, [adminUser]);

  // Handle Approve (Activate)
  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': adminUser.id.toString(),
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to complete activation approval.');
      }
      setSuccessMsg(data.message);
      
      // Update local state without full reload
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      if (stats) {
        setStats({
          ...stats,
          activeUsers: stats.activeUsers + 1,
          inactiveUsers: Math.max(0, stats.inactiveUsers - 1),
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Suspend (Deactivate)
  const handleSuspend = async (userId: number) => {
    setActionLoading(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': adminUser.id.toString(),
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to complete deactivation suspension.');
      }
      setSuccessMsg(data.message);
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'inactive' } : u));
      if (stats) {
        setStats({
          ...stats,
          activeUsers: Math.max(0, stats.activeUsers - 1),
          inactiveUsers: stats.inactiveUsers + 1,
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger Sweet Alert modal for member account deletion
  const handleDelete = (userId: number, userName: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Member Account?',
      subtitle: 'Confirm member account deletion',
      description: `You are about to permanently delete member "${userName}" from the system. Their downline connection and registration history cannot be recovered.`,
      confirmBtnText: 'Yes, Delete Member Account',
      onConfirm: async () => {
        setConfirmModal(null);
        setActionLoading(userId);
        setError(null);
        setSuccessMsg(null);
        try {
          const res = await fetch('/api/admin/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': adminUser.id.toString(),
            },
            body: JSON.stringify({ userId }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to delete the user.');
          }
          showSweetToast('success', data.message || `${userName} deleted successfully.`);
          
          if (auditingUser?.id === userId) setAuditingUser(null);
          if (inspectingUser?.id === userId) {
            setInspectingUser(null);
            setInspectedTree(null);
          }

          setUsers(prev => prev.filter(u => u.id !== userId));
          fetchAdminData();
        } catch (err: any) {
          showSweetToast('error', err.message || 'Failed to delete member.');
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  // Inspect any user's downline tree
  const handleInspectTree = async (userObj: Omit<User, 'password'>) => {
    setInspectingUser(userObj);
    setAuditingUser(null);
    setInspectedTree(null);
    setTreeLoading(true);
    try {
      const res = await fetch(`/api/user/downline?userId=${userObj.id}`, {
        headers: {
          'X-User-Id': adminUser.id.toString(),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setInspectedTree(data.tree);
      }
    } catch (err) {
      console.error('Failed to inspect tree', err);
    } finally {
      setTreeLoading(false);
    }
  };

  // Filter users lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.id.toString().includes(searchTerm);

    const matchesStatus = 
      statusFilter === 'all' || 
      u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="admin-panel-root" className="space-y-6">
      {/* 1. Compact & Premium Admin Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-5 shadow-lg shadow-indigo-950/30 border border-indigo-700/40 relative overflow-hidden">
        {/* Subtle decorative glow elements */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            {/* Admin Avatar Display */}
            {(() => {
              let photo: string | null = null;
              try {
                if (adminUser.additional_details) {
                  const details = typeof adminUser.additional_details === 'string'
                    ? JSON.parse(adminUser.additional_details)
                    : adminUser.additional_details;
                  photo = details?.photo || null;
                }
              } catch (e) {}

              if (photo) {
                return (
                  <img
                    src={photo}
                    alt={adminUser.name}
                    className="w-12 h-14 rounded-xl object-cover ring-2 ring-amber-400 shrink-0 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                );
              }
              return (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-md ring-2 ring-amber-300">
                  {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
              );
            })()}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide backdrop-blur-sm shadow-sm">
                  <Shield className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  SYSTEM ADMIN
                </span>
                <span className="text-xs font-mono font-bold text-indigo-200 bg-white/10 px-2 py-0.5 rounded">
                  ID: #{adminUser.id}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{adminUser.name}</span>
                <span className="text-xs font-normal text-slate-300">({adminUser.email})</span>
              </h2>
              <p className="text-xs text-indigo-100/80 max-w-xl leading-normal font-medium">
                Approve registrations, inspect active member downlines, manage live website media, and edit admin profile.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setEditingUser(adminUser)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-400/60 hover:border-amber-400 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              title="Edit System Admin Profile"
            >
              <Edit className="w-3.5 h-3.5 text-slate-950" />
              <span>Edit Admin Profile</span>
            </button>
            <button
              type="button"
              onClick={fetchAdminData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-white/20 hover:border-white/40 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-col sm:flex-row bg-slate-200/80 p-1.5 rounded-2xl gap-2 font-bold text-xs sm:text-sm shadow-inner">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-white text-indigo-950 shadow-md border border-slate-200/80 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-bold'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Distributor Directory & Network</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-bold'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-slate-950" />
          <span>Product Orders & Level Incentive</span>
          {(() => {
            const pendingCount = ordersList.filter(o => o.status === 'Pending').length;
            if (pendingCount > 0) {
              return (
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse shadow-xs">
                  {pendingCount} Pending
                </span>
              );
            }
            return null;
          })()}
        </button>

        <button
          onClick={() => setActiveTab('company-fund')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'company-fund'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-bold'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-300" />
          <span>Company Fund History (কোম্পানি ফান্ড)</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-bold'
          }`}
        >
          <Package className="w-4 h-4 text-blue-300" />
          <span>Product Management (প্রোডাক্ট ম্যানেজমেন্ট)</span>
          <span className="text-[10px] bg-blue-500/30 text-white font-extrabold px-2 py-0.5 rounded-full border border-blue-400/30">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('business-targets')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'business-targets'
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md shadow-amber-600/20 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-bold'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-300" />
          <span>Business Targets (বিজনেস টার্গেট ৫০:৫০)</span>
        </button>

        <button
          onClick={() => setActiveTab('website')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'website'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 font-bold'
          }`}
        >
          <Globe className="w-4 h-4 text-amber-300" />
          <span>Manage Website</span>
        </button>
      </div>

      {activeTab === 'members' ? (
        <>
          {/* 2. Global Stats Grid */}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Total Registered */}
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 hover:-translate-y-0.5 ${
              statusFilter === 'all'
                ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/40 shadow-md'
                : 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-white dark:to-slate-900 border-blue-200/80 dark:border-blue-900/40 hover:border-blue-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              {statusFilter === 'all' && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                  Active Filter
                </span>
              )}
            </div>
            <span className="text-[10px] text-blue-900 dark:text-blue-300 font-extrabold uppercase tracking-wider block">Total Registered</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 block leading-tight">
              {stats.totalUsers} <span className="text-xs font-bold text-blue-600 dark:text-blue-400">distributors</span>
            </span>
            <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80 mt-1 block">
              👆 Click to view All List
            </span>
          </div>

          {/* Card 2: Active Distributors */}
          <div
            onClick={() => setStatusFilter('active')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 hover:-translate-y-0.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
                : 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white dark:to-slate-900 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              {statusFilter === 'active' && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                  Active Filter
                </span>
              )}
            </div>
            <span className="text-[10px] text-emerald-900 dark:text-emerald-300 font-extrabold uppercase tracking-wider block">Active Distributors</span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block leading-tight">
              {stats.activeUsers} <span className="text-xs font-bold text-emerald-600/80">distributors</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              👆 Click for Active List
            </span>
          </div>

          {/* Card 3: Pending Approval */}
          <div
            onClick={() => setStatusFilter('inactive')}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 hover:-translate-y-0.5 ${
              statusFilter === 'inactive'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                : 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white dark:to-slate-900 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-xs">
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              {statusFilter === 'inactive' && (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                  Active Filter
                </span>
              )}
            </div>
            <span className="text-[10px] text-amber-900 dark:text-amber-300 font-extrabold uppercase tracking-wider block">Pending Approval</span>
            <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block leading-tight">
              {stats.inactiveUsers} <span className="text-xs font-bold text-amber-600/80">distributors</span>
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 block">
              👆 Click for Pending List
            </span>
          </div>

          {/* Card 4: System Depth */}
          <div
            onClick={() => {
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="p-3 sm:p-3.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-98 hover:-translate-y-0.5 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-white dark:to-slate-900 border-purple-200/80 dark:border-purple-900/40 hover:border-purple-400 shadow-xs"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <span className="text-[10px] text-purple-900 dark:text-purple-300 font-extrabold uppercase tracking-wider block">System Depth</span>
            <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block leading-tight">
              {stats.maxLevelsDeep} <span className="text-xs font-bold text-purple-600/80">Levels</span>
            </span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-1 block">
              👆 Click to view All Levels
            </span>
          </div>
        </div>
      )}

      {/* Action Notification banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-emerald-800 text-xs shadow-sm leading-relaxed">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <div>
            <span className="font-bold">Action Success:</span> {successMsg}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-800 text-xs shadow-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <div>
            <span className="font-bold">Error Occurred:</span> {error}
          </div>
        </div>
      )}

      {/* 3. Member Directory Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-4">
          {/* Quick Direct Member ID Login Tool */}
          <div className="p-4 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-indigo-900/60 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  ADMIN DIRECT MEMBER ACCESS TOOL
                </h4>
                <p className="text-[11px] text-slate-300 font-medium">
                  Log into any registered member's account directly
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!directLoginId.trim()) return;
                const searchKey = directLoginId.trim().toLowerCase();
                const target = users.find(u =>
                  u.phone === directLoginId.trim() ||
                  u.phone.endsWith(directLoginId.trim()) ||
                  u.email.toLowerCase() === searchKey ||
                  u.id.toString() === searchKey
                );
                if (target && onImpersonateUser) {
                  onImpersonateUser(target as User);
                } else {
                  alert(`No distributor found matching Mobile / Email / ID: "${directLoginId}"`);
                }
              }}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <input
                type="text"
                value={directLoginId}
                onChange={(e) => setDirectLoginId(e.target.value)}
                placeholder="Enter Mobile / Email / User ID..."
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 w-full md:w-60 font-mono font-bold"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In to ID</span>
              </button>
            </form>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Distributor Directory ({filteredUsers.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage registered accounts, pending activations, or distributor status</p>
            </div>

            {/* Status filters */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] self-start md:self-auto font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                All Distributors
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'inactive' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search distributors by name, mobile number, or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading directory...</div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-4">Distributor Mobile ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Sponsor Distributor</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 w-28 text-center">Status</th>
                  <th className="p-4 w-52 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((userItem) => {
                  let itemPhoto: string | null = null;
                  try {
                    if (userItem.additional_details) {
                      const d = typeof userItem.additional_details === 'string'
                        ? JSON.parse(userItem.additional_details)
                        : userItem.additional_details;
                      itemPhoto = d.photo || null;
                    }
                  } catch (e) {
                    // ignore
                  }

                  return (
                    <tr key={userItem.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-800">{userItem.phone}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          {itemPhoto ? (
                            <img 
                              src={itemPhoto} 
                              alt={userItem.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{userItem.name}</div>
                            <div className="mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                userItem.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {userItem.role === 'admin' ? 'Admin' : 'Distributor'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{userItem.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{userItem.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {userItem.referrer_id ? (
                        <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          Sponsor Distributor
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None (System Root)</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(userItem.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {userItem.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg font-bold">
                          Pending
                        </span>
                      )}
                     </td>
                     <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                       {/* Log into Member Account */}
                       {onImpersonateUser && (
                         <button
                           onClick={() => onImpersonateUser(userItem as User)}
                           title={`Log in to ${userItem.name}'s Account (ID: ${userItem.phone})`}
                           className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-extrabold transition-all cursor-pointer shadow-xs text-xs"
                         >
                           <LogIn className="w-3.5 h-3.5" />
                           <span>Log In</span>
                         </button>
                       )}

                       {/* View completed Success India Applicant Form */}
                       <button
                         onClick={() => {
                           setAuditingUser(userItem);
                           setInspectingUser(null);
                         }}
                         title="View Completed Applicant Form"
                         className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                       >
                         <FileText className="w-4 h-4" />
                       </button>
 
                       {/* View downline network map */}
                       <button
                         onClick={() => handleInspectTree(userItem)}
                         title="View Downline Tree Map"
                         className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                       >
                         <Network className="w-4 h-4" />
                       </button>

                       {/* Edit Member Profile Details */}
                       <button
                         onClick={() => setEditingUser(userItem as User)}
                         title="Edit Member Profile Details"
                         className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
 
                       {/* Approve / Suspend toggler and Reject / Delete buttons */}
                      {userItem.role !== 'admin' && (
                        userItem.status === 'inactive' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleApprove(userItem.id)}
                              disabled={actionLoading !== null}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer text-xs"
                            >
                              {actionLoading === userItem.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleDelete(userItem.id, userItem.name)}
                              disabled={actionLoading !== null}
                              title="Reject & Delete Registration"
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 disabled:opacity-50 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleSuspend(userItem.id)}
                              disabled={actionLoading !== null}
                              className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold px-3 py-2 rounded-xl transition-all cursor-pointer text-xs"
                            >
                              {actionLoading === userItem.id ? 'Processing...' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleDelete(userItem.id, userItem.name)}
                              disabled={actionLoading !== null}
                              title="Delete Member"
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 disabled:opacity-50 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
                            </button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-500 font-medium">
            No matching members found.
          </div>
        )}
      </div>

      {/* 4. SUCCESS INDIA Applicant Form Audit Inspector */}
      {auditingUser && (() => {
        let details: any = null;
        try {
          if (auditingUser.additional_details) {
            details = typeof auditingUser.additional_details === 'string' 
              ? JSON.parse(auditingUser.additional_details) 
              : auditingUser.additional_details;
          }
        } catch (e) {
          console.error("Error parsing additional details", e);
        }

        return (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h4 className="font-bold text-slate-900">
                  SUCCESS INDIA Form Audit: <span className="text-indigo-600 font-black">{auditingUser.name}</span> (ID #{auditingUser.id})
                </h4>
                <p className="text-xs text-slate-500">Review full applicant details, physical characteristics, addresses, and audit references.</p>
              </div>
              <button
                onClick={() => setAuditingUser(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-800 transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>

            {details ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
                {/* Personal Section */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <h5 className="font-bold text-indigo-700 text-xs border-b border-indigo-100 pb-1.5 uppercase tracking-wider">1. Personal & Family Info</h5>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {details.photo && (
                      <div className="shrink-0 w-24 h-32 bg-white border border-slate-300 rounded-lg overflow-hidden self-center sm:self-start p-1 shadow-sm">
                        <img src={details.photo} alt="Applicant Passport Photo" className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Father/Husband Name:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.fatherHusbandName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Mother's Name:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.motherName || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Date of Birth:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.dob || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Place of Birth:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.placeOfBirth || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Gender:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Religion:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.religion || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Blood Group:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.bloodGroup || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Alt Phone:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.phone2 || 'N/A'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">Height / Weight:</span>
                        <span className="font-bold text-slate-800 text-[11px]">{(details.height || 'N/A') + ' / ' + (details.weight || 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Government Documents */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <h5 className="font-bold text-indigo-700 text-xs border-b border-indigo-100 pb-1.5 uppercase tracking-wider">2. Government Documents & Co-Applicant</h5>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Aadhar Card No:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.aadharNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">PAN Card No:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.panNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Voter Card No:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.voterNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Ration Card No:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.rationNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Consumer Number:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.consumerNo || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Co-Applicant:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.coApplicantName || 'N/A'} {details.coApplicantRelation ? `(${details.coApplicantRelation})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Family Count:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.familyMembersNo || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-semibold block uppercase text-[9px]">Co-Applicant Address:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.coApplicantAddress || 'N/A'}</span>
                    </div>
                    {details.identityDocument && (
                      <div className="col-span-2 pt-2">
                        <span className="text-slate-400 font-semibold block uppercase text-[9px] mb-1">Uploaded ID Proof Scan:</span>
                        <div className="w-full max-w-sm h-48 bg-white border border-slate-200 rounded-xl overflow-hidden p-1.5 shadow-sm">
                          <img 
                            src={details.identityDocument} 
                            alt="Government ID Proof Scan" 
                            className="w-full h-full object-contain rounded-lg" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Present Address */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <h5 className="font-bold text-indigo-700 text-xs border-b border-indigo-100 pb-1.5 uppercase tracking-wider">3. Present Address</h5>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[9px] mr-1">Address:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.presentAddressText || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">P.O.</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.presentPO || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">P.S.</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.presentPS || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">District</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.presentDist || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Address */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <h5 className="font-bold text-indigo-700 text-xs border-b border-indigo-100 pb-1.5 uppercase tracking-wider">4. Permanent Address</h5>
                  <div className="space-y-1.5">
                    <div>
                      <span className="text-slate-400 font-semibold uppercase text-[9px] mr-1">Address:</span>
                      <span className="font-bold text-slate-800 text-[11px]">{details.permanentAddressText || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">P.O.</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.permanentPO || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">P.S.</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.permanentPS || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">District</span>
                        <span className="font-bold text-slate-800 text-[11px]">{details.permanentDist || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block uppercase text-[9px]">PIN / Landmark</span>
                        <span className="font-bold text-slate-800 text-[11px]">{(details.permanentPin || 'N/A') + ' / ' + (details.permanentLandmark || 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* References */}
                <div className="col-span-1 md:col-span-2 space-y-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                  <h5 className="font-bold text-indigo-700 text-xs border-b border-indigo-100 pb-1.5 uppercase tracking-wider">5. Audit References (Relative & Friend)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-indigo-100/30">
                      <span className="font-bold text-slate-800 block text-[10px] mb-1.5 uppercase">Relative Reference:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px]">NAME</span>
                          <span className="font-bold text-slate-700 text-[11px]">{details.relativeName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px]">PHONE</span>
                          <span className="font-bold text-slate-700 text-[11px]">{details.relativePhone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px]">ADDRESS</span>
                          <span className="font-bold text-slate-700 text-[11px]">{details.relativeAddress || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-indigo-100/30">
                      <span className="font-bold text-slate-800 block text-[10px] mb-1.5 uppercase">Friend Reference:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px]">NAME</span>
                          <span className="font-bold text-slate-700 text-[11px]">{details.friendName || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px]">PHONE</span>
                          <span className="font-bold text-slate-700 text-[11px]">{details.friendPhone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block text-[8px]">ADDRESS</span>
                          <span className="font-bold text-slate-700 text-[11px]">{details.friendAddress || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Action Controls inside details panel */}
                {auditingUser.role !== 'admin' && (
                  <div className="col-span-1 md:col-span-2 flex flex-wrap gap-3 items-center justify-end pt-5 border-t border-slate-200">
                    <span className="text-xs text-slate-500 font-bold mr-auto">Member Action Controls:</span>
                    {auditingUser.status === 'inactive' ? (
                      <>
                        <button
                          onClick={() => handleApprove(auditingUser.id)}
                          disabled={actionLoading !== null}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow text-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve Applicant
                        </button>
                        <button
                          onClick={() => handleDelete(auditingUser.id, auditingUser.name)}
                          disabled={actionLoading !== null}
                          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow text-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Reject & Delete Applicant
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSuspend(auditingUser.id)}
                          disabled={actionLoading !== null}
                          className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition-all text-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Suspend Member
                        </button>
                        <button
                          onClick={() => handleDelete(auditingUser.id, auditingUser.name)}
                          disabled={actionLoading !== null}
                          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow text-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Member
                        </button>
                      </>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-semibold">
                No additional registration details are logged for this user. This might be a legacy account or root admin.
              </div>
            )}
          </div>
        );
      })()}

      {/* 5. Sub-tree inspection modal/container */}
      {inspectingUser && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900">
                Network Audit: <span className="text-indigo-600 font-black">{inspectingUser.name}</span> (ID #{inspectingUser.id})
              </h4>
              <p className="text-xs text-slate-500">Inspect recursively the entire downline organization chart of this member.</p>
            </div>
            <button
              onClick={() => {
                setInspectingUser(null);
                setInspectedTree(null);
              }}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              Close Audit
            </button>
          </div>

          {treeLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs font-medium">Loading recursive organization chart...</div>
          ) : (
            <VisualTree treeData={inspectedTree} />
          )}
        </div>
      )}
        </>
      ) : (
        /* WEBSITE MANAGEMENT TAB (COMPACT ELEGANT UI) */
        <div className="space-y-5 animate-fade-in">
          {/* Compact Header Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Manage Website Content
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hidden sm:inline-block">
                    Live Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Upload photos, videos, and official notices directly to the live website homepage.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(!isAddModalOpen)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
            >
              {isAddModalOpen ? (
                <>
                  <X className="w-4 h-4" /> Close Form
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" /> Add New Content
                </>
              )}
            </button>
          </div>

          {/* Compact Publisher Form Card */}
          {isAddModalOpen && (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden p-4 sm:p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Publish New Content Item</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWebsiteContent} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1.5">1. Select Content Type *</label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewType('photo')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newType === 'photo' ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-indigo-500 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('video')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newType === 'video' ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-indigo-500 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 text-rose-600" /> Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('text')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        newType === 'text' ? 'bg-white text-indigo-950 shadow-xs ring-1 ring-indigo-500 font-extrabold' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-600" /> Notice
                    </button>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">2. Headline / Title *</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={newType === 'photo' ? 'e.g., 50kW Commercial Rooftop Solar Installation' : newType === 'video' ? 'e.g., Solar Pump Live Demonstration' : 'e.g., PM Surya Ghar Free Electricity Subsidy Announcement'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">Badge Tag (e.g. OFFICIAL, REAL WORK)</label>
                    <input
                      type="text"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value)}
                      placeholder="e.g., OFFICIAL NOTICE"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="e.g., Solar Rooftop / Subsidy"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Write brief details about this installation or announcement..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Media File Upload or URL (for photo or video) */}
                {newType !== 'text' && (
                  <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-800">3. Media Source (Upload or Link)</label>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Local File Upload Button */}
                      <label className="cursor-pointer px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border border-indigo-700 transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File from Device</span>
                        <input
                          type="file"
                          accept={newType === 'photo' ? 'image/*' : 'video/*'}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      <span className="text-[10px] font-black text-slate-400 text-center uppercase">or</span>

                      {/* URL input */}
                      <input
                        type="text"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder={newType === 'photo' ? 'Paste image URL (e.g. https://...)' : 'Paste YouTube or video link'}
                        className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Media Preview */}
                    {newMediaUrl && (
                      <div className="mt-2 p-2 bg-slate-900 border border-slate-700 rounded-xl">
                        <span className="text-[10px] font-extrabold text-amber-400 uppercase block mb-1">
                          Media Live Preview:
                        </span>
                        {newType === 'photo' ? (
                          <img
                            src={getDirectImageUrl(newMediaUrl)}
                            alt="Preview"
                            className="max-h-40 rounded-lg object-contain mx-auto shadow-md"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-44 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                            {newMediaUrl.startsWith('data:video') ? (
                              <video src={newMediaUrl} controls className="w-full h-full object-contain" />
                            ) : (
                              <iframe
                                src={getEmbedVideoUrl(newMediaUrl)}
                                title="Video Preview"
                                className="w-full h-full border-0"
                                allowFullScreen
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingContent}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {submittingContent ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Publish Live Now
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 pl-1">Filter:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setWebsiteFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    websiteFilter === 'all' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({websiteContents.length})
                </button>
                <button
                  onClick={() => setWebsiteFilter('photo')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    websiteFilter === 'photo' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  Photos ({websiteContents.filter(c => c.type === 'photo').length})
                </button>
                <button
                  onClick={() => setWebsiteFilter('video')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    websiteFilter === 'video' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5 text-rose-500" />
                  Videos ({websiteContents.filter(c => c.type === 'video').length})
                </button>
                <button
                  onClick={() => setWebsiteFilter('text')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    websiteFilter === 'text' ? 'bg-white text-indigo-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  Notices ({websiteContents.filter(c => c.type === 'text').length})
                </button>
              </div>
            </div>

            <button
              onClick={fetchWebsiteContents}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${websiteLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Website Contents Grid */}
          {websiteLoading ? (
            <div className="py-12 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading website contents...</p>
            </div>
          ) : websiteContents.filter(c => websiteFilter === 'all' || c.type === websiteFilter).length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">No content items found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Add New Content" above to publish photos, videos or announcements to the website.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
              >
                + Publish First Content Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {websiteContents
                .filter(c => websiteFilter === 'all' || c.type === websiteFilter)
                .map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all hover:shadow-md flex flex-col justify-between ${
                      item.is_active ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-300 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {/* Media Header Preview */}
                      {item.type === 'photo' && item.media_url && (
                        <div className="relative h-40 bg-slate-900 overflow-hidden group">
                          <img
                            src={getDirectImageUrl(item.media_url)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs z-10">
                            <ImageIcon className="w-3 h-3" /> Photo
                          </span>
                        </div>
                      )}

                      {item.type === 'video' && (
                        <div className="relative h-40 bg-slate-950 flex items-center justify-center overflow-hidden">
                          {item.media_url?.startsWith('data:video') ? (
                            <video src={item.media_url} className="w-full h-full object-cover" controls />
                          ) : (
                            <iframe
                              src={getEmbedVideoUrl(item.media_url)}
                              title={item.title}
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          )}
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs z-10">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        </div>
                      )}

                      {item.type === 'text' && (
                        <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Official Notice
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>
                      )}

                      {/* Content Info */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.badge && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {item.badge}
                            </span>
                          )}
                          {item.category && (
                            <span className="text-[10px] font-bold text-slate-500">
                              • {item.category}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleActiveContent(item)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {item.is_active ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteContent(item)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-rose-200"
                        title="Delete this item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* --- ACTIVE TAB: ORDERS & LEVEL INCENTIVE APPROVAL --- */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive Header Callout */}
          <div className="bg-gradient-to-r from-amber-900 via-amber-950 to-slate-950 text-white p-5 sm:p-6 rounded-3xl border border-amber-600/40 shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md shadow-xs">
                  Central Order Control
                </span>
                <span className="bg-white/10 text-amber-200 text-xs font-bold px-3 py-0.5 rounded-full border border-white/10">
                  15-Level Uplines Incentive Engine
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-amber-100 flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-amber-400" />
                <span>পণ্য অর্ডার অনুমোদন ও লেভেল ইনসেন্টিভ বণ্টন ব্যবস্থাপনা</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl font-medium">
                ডিজিটাল ক্যাটালগ থেকে যেকোনো অর্ডার সম্পন্ন হলে স্ট্যাটাস ডিফল্টভাবে <strong className="text-amber-300">Pending</strong> থাকবে। অ্যাডমিন অনুমোদন করলে: 
                <br />
                <span className="text-emerald-300 font-bold">১. ক্রেতা (Buyer) নিজস্ব ক্রয়ের ওপর ০% কমিশন পাবে।</span>
                <br />
                <span className="text-amber-300 font-bold">২. ক্রেতার উপরের ১ থেকে ১৫ লেভেল পর্যন্ত নিবন্ধিত আপলাইনরা নির্ধারিত % হারে লেভেল ইনসেন্টিভ পাবেন।</span>
                <br />
                <span className="text-rose-300 font-bold">৩. আপলাইন না থাকলে ওই লেভেলের আনক্লেমড ইনসেন্টিভ স্বয়ংক্রিয়ভাবে কোম্পানি ফান্ডে (Company Treasury Reverted Fund) ফেরত জমা হবে।</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Metric 1: Pending Orders */}
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">অপেক্ষমাণ অর্ডার</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {ordersList.filter(o => o.status === 'Pending').length} <span className="text-xs font-semibold text-slate-500">টি</span>
              </div>
              <p className="text-[10px] text-amber-700 font-bold">অ্যাডমিন অনুমোদনের অপেক্ষায়</p>
            </div>

            {/* Metric 2: Approved Orders */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">অনুমোদিত অর্ডার</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {ordersList.filter(o => o.status === 'Approved').length} <span className="text-xs font-semibold text-slate-500">টি</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-bold">লেভেল বোনাস বন্টিত</p>
            </div>

            {/* Metric 3: Total Allocated Incentive */}
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-indigo-600">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">মোট লেভেল ইনসেন্টিভ</span>
                <DollarSign className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{auditLogs.reduce((s, a) => s + a.uplinePaidTotal, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-indigo-700 font-bold">আপলাইনদের পেইড বোনাস</p>
            </div>

            {/* Metric 4: Company Reverted Unclaimed Fund */}
            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-rose-600">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">কোম্পানি ফেরত টাকা</span>
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-900">
                ₹{auditLogs.reduce((s, a) => s + a.companyRevertedAmount, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] text-rose-700 font-bold">অনুপস্থিত আপলাইন ফেরত টাকা</p>
            </div>
          </div>

          {/* Level Incentive Settings Control Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">লেভেল ইনসেন্টিভ ও কোম্পানি ফান্ড কনফিগারেশন</h3>
                  <p className="text-[11px] text-slate-500 font-medium">১ থেকে ১৫ লেভেল বোনাস বিতরণ এবং অনুপস্থিত লেভেল রিভার্শন সেটিংস</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-700">সর্বোচ্চ লেভেল গভীরতা:</span>
                  <select
                    value={maxIncentiveLevels}
                    onChange={(e) => setMaxIncentiveLevels(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg text-xs font-black px-2 py-1 text-indigo-950 focus:outline-none"
                  >
                    {[5, 10, 12, 15].map(lvl => (
                      <option key={lvl} value={lvl}>{lvl} লেভেল পর্যন্ত</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-extrabold text-slate-700">কমিশন পুল (BV %):</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={commissionPoolPercent}
                    onChange={(e) => setCommissionPoolPercent(Number(e.target.value))}
                    className="w-16 bg-white border border-slate-300 rounded-lg text-xs font-black px-2 py-1 text-indigo-950 focus:outline-none text-center"
                  />
                  <span className="text-xs font-extrabold text-slate-500">%</span>
                </div>
              </div>
            </div>

            {/* Level Rate Distribution Breakdown Pill Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 pt-1">
              {Array.from({ length: maxIncentiveLevels }, (_, i) => i + 1).map(lvl => (
                <div key={lvl} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">L-{lvl}</span>
                  <div className="text-xs font-black text-indigo-950">
                    {levelPercentages[lvl] || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Orders List & Filter Section */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Order Status Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                <button
                  onClick={() => setOrderStatusTab('Pending')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderStatusTab === 'Pending'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending ({ordersList.filter(o => o.status === 'Pending').length})</span>
                </button>

                <button
                  onClick={() => setOrderStatusTab('Approved')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderStatusTab === 'Approved'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved ({ordersList.filter(o => o.status === 'Approved').length})</span>
                </button>

                <button
                  onClick={() => setOrderStatusTab('Rejected')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderStatusTab === 'Rejected'
                      ? 'bg-rose-600 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rejected ({ordersList.filter(o => o.status === 'Rejected').length})</span>
                </button>

                <button
                  onClick={() => setOrderStatusTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    orderStatusTab === 'all'
                      ? 'bg-indigo-950 text-white font-black shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>All ({ordersList.length})</span>
                </button>
              </div>

              {/* Order Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Order ID / Product Search..."
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Orders Table */}
            {(() => {
              const filteredOrders = ordersList.filter(o => {
                const matchesTab = orderStatusTab === 'all' || o.status === orderStatusTab;
                const matchesSearch = !orderSearchTerm || 
                  o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                  o.productName.toLowerCase().includes(orderSearchTerm.toLowerCase());
                return matchesTab && matchesSearch;
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-700">কোনো অর্ডার পাওয়া যায়নি</h4>
                    <p className="text-xs text-slate-500">অন্য স্ট্যাটাস ফিল্টার সিলেক্ট করুন বা ডিজিটাল ক্যাটালগ থেকে নতুন অর্ডার দিন।</p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                        <th className="p-3">Order ID & Date</th>
                        <th className="p-3">Buyer & Product Name</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                        <th className="p-3 text-right">BV & PV</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredOrders.map(order => {
                        const buyerUser = users.find(u => u.id === order.userId);

                        return (
                          <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Order ID & Date */}
                            <td className="p-3 space-y-0.5">
                              <span className="font-black text-indigo-950 font-mono text-xs block">{order.id}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">{order.orderDate}</span>
                            </td>

                            {/* Buyer & Product */}
                            <td className="p-3 space-y-1">
                              <div className="font-black text-slate-900">{order.productName}</div>
                              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                <span>Buyer:</span>
                                <strong className="text-slate-950">{buyerUser ? buyerUser.name : (adminUser.name || 'Rayhan Sekh')}</strong>
                                <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100 text-[10px]">
                                  (Buyer Commission: ₹0)
                                </span>
                              </div>
                              {order.shippingAddress && (
                                <div className="text-[10px] text-slate-500 truncate max-w-xs">
                                  📍 {order.shippingAddress}
                                </div>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="p-3 text-right font-black text-slate-900 text-sm">
                              ₹{order.totalAmount.toLocaleString('en-IN')}
                            </td>

                            {/* BV & PV */}
                            <td className="p-3 text-right space-y-0.5">
                              <span className="font-extrabold text-indigo-700 block text-xs">{order.totalBV?.toLocaleString('en-IN')} BV</span>
                              <span className="text-[10px] font-bold text-amber-600 block">{order.totalPV} PV</span>
                            </td>

                            {/* Status Badge */}
                            <td className="p-3 text-center">
                              {order.status === 'Pending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>Pending Approval</span>
                                </span>
                              ) : order.status === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Approved</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300">
                                  <XCircle className="w-3 h-3 text-rose-700" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </td>

                            {/* Admin Action */}
                            <td className="p-3 text-right">
                              {order.status === 'Pending' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveOrder(order)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve & Bonus</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRejectOrder(order)}
                                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : order.status === 'Approved' ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                  ✓ Bonus Distributed
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-slate-400">
                                  Cancelled
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

          </div>

          {/* Level Commission & Company Reverted Funds Audit Ledger */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">লেভেল ইনসেন্টিভ ও কোম্পানি ফেরত ফান্ড অ্যাকাউন্টস লেজার</h3>
                  <p className="text-[11px] text-slate-500 font-medium">অনুমোদিত প্রতিটি অর্ডারের নিখুঁত অডিট ট্রেইল ও আনক্লেমড ট্র্যাজারি রিভার্শন</p>
                </div>
              </div>

              <span className="text-xs font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
                Audit Entries ({auditLogs.length})
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 font-semibold">কোনো অডিট হিসাব রেকর্ড নেই। অর্ডার অ্যাপ্রুভ করলে এখানে স্বয়ংক্রিয়ভাবে স্টেটমেন্ট জমা হবে।</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    
                    {/* Log Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs bg-indigo-950 text-white px-2.5 py-0.5 rounded-md">
                          {log.orderId}
                        </span>
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm">{log.productName}</h4>
                      </div>

                      <div className="text-[11px] font-bold text-slate-500">
                        Approval Date: <span className="text-slate-900 font-mono">{log.approvalDate}</span>
                      </div>
                    </div>

                    {/* Log Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                      
                      {/* Buyer */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Buyer Name</span>
                        <div className="font-black text-slate-900">{log.buyerName}</div>
                        <span className="text-[10px] text-rose-600 font-bold block">Buyer Bonus: ₹0 (0%)</span>
                      </div>

                      {/* Total Pool */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Comm. Pool ({commissionPoolPercent}% BV)</span>
                        <div className="font-black text-indigo-950 text-sm">₹{log.totalCommissionPool.toLocaleString('en-IN')}</div>
                        <span className="text-[10px] font-bold text-slate-500 block">{log.totalBV?.toLocaleString('en-IN')} BV</span>
                      </div>

                      {/* Paid to Uplines */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block">Paid to Uplines</span>
                        <div className="font-black text-emerald-950 text-sm">₹{log.uplinePaidTotal.toLocaleString('en-IN')}</div>
                        <span className="text-[10px] font-bold text-emerald-600 block">{log.uplineBreakdown.length} Uplines Paid</span>
                      </div>

                      {/* Company Reverted Fund */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-rose-700 uppercase block">Company Reverted Fund</span>
                        <div className="font-black text-rose-950 text-sm">₹{log.companyRevertedAmount.toLocaleString('en-IN')}</div>
                        <span className="text-[10px] font-bold text-rose-600 block">Auto-Returned to Treasury</span>
                      </div>

                      {/* Status */}
                      <div className="space-y-0.5 md:text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Reversion Reason</span>
                        <div className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 inline-block">
                          {log.revertedLevels}
                        </div>
                      </div>

                    </div>

                    {/* Upline Level Breakdown Sub-pills */}
                    {log.uplineBreakdown.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/50 text-[10px]">
                        <span className="font-bold text-slate-500">Distributed Uplines:</span>
                        {log.uplineBreakdown.map(ub => (
                          <span key={ub.level} className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md font-bold">
                            L{ub.level}: ₹{ub.amount.toLocaleString('en-IN')}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* 5. COMPANY FUND HISTORY (কোম্পানি ফান্ড হিস্ট্রি) TAB */}
      {(() => {
        if (activeTab !== 'company-fund') return null;

        const filteredCompanyFundLogs = companyFundLogs.filter(log => {
          // 1. Search Query
          const searchLower = fundSearchTerm.toLowerCase();
          const matchesSearch = !fundSearchTerm || 
            log.id.toLowerCase().includes(searchLower) ||
            log.orderId.toLowerCase().includes(searchLower) ||
            log.memberName.toLowerCase().includes(searchLower) ||
            String(log.memberId).includes(searchLower) ||
            log.productName.toLowerCase().includes(searchLower) ||
            log.reason.toLowerCase().includes(searchLower);

          // 2. Level Filter
          const matchesLevel = fundLevelFilter === 'all' || 
            (fundLevelFilter === '1' && log.level === 1) ||
            (fundLevelFilter === '2' && log.level === 2) ||
            (fundLevelFilter === '3' && log.level === 3) ||
            (fundLevelFilter === '4' && log.level === 4) ||
            (fundLevelFilter === '5' && log.level === 5) ||
            (fundLevelFilter === '6+' && log.level >= 6);

          // 3. Date Filter
          let matchesDate = true;
          const logDate = new Date(log.dateOnly);
          const now = new Date();
          if (fundDateFilter === 'today') {
            matchesDate = log.dateOnly === now.toISOString().split('T')[0];
          } else if (fundDateFilter === 'week') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= sevenDaysAgo;
          } else if (fundDateFilter === 'month') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = logDate >= thirtyDaysAgo;
          }

          return matchesSearch && matchesLevel && matchesDate;
        });

        const handlePrintCompanyFundReport = () => {
          const headers = ["Log ID", "Date & Time", "Member Name & ID", "Order ID & Product", "Unclaimed Level", "Amount (₹)", "Reason"];
          const rows = filteredCompanyFundLogs.map(l => [
            l.id,
            l.timestamp,
            `${l.memberName} (#${l.memberId})`,
            `${l.orderId} (${l.productName})`,
            `Level ${l.level} (${l.percentage}%)`,
            `₹${l.amount.toLocaleString('en-IN')}`,
            l.reason
          ]);
          const totalReverted = filteredCompanyFundLogs.reduce((s, l) => s + l.amount, 0);
          printPDFReport(
            "Company Fund Reversion Audit Report (কোম্পানি ফান্ড অডিট রিপোর্ট)",
            `Total Unclaimed Level Reversion Deposited: ₹${totalReverted.toLocaleString('en-IN')} across ${filteredCompanyFundLogs.length} Entries`,
            headers,
            rows,
            { name: adminUser.name, phone: adminUser.phone }
          );
        };

        const handleExportCompanyFundCSV = () => {
          const headers = ["Log ID", "Date Time", "Member ID", "Member Name", "Order ID", "Product Name", "Unclaimed Level", "Percentage", "Reverted Amount INR", "Reason"];
          const rows = filteredCompanyFundLogs.map(l => [
            l.id,
            l.timestamp,
            l.memberId,
            l.memberName,
            l.orderId,
            l.productName,
            `Level ${l.level}`,
            `${l.percentage}%`,
            l.amount,
            l.reason
          ]);
          exportToCSV("company_fund_reversion_history", headers, rows);
        };

        return (
          <div className="space-y-6">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 border border-slate-700/60 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-emerald-500/30">
                        কোম্পানি ফান্ড ট্র্যাজারি লেজার
                      </span>
                      <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                        Unlimited Levels Supported
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Company Fund History (কোম্পানি ফান্ড হিস্ট্রি)</h2>
                    <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                      অ্যাডমিন সেট করা লেভেল ডিসবার্সমেন্টে যোগ্য আপলাইন সদস্য না থাকলে সেই কমিশন স্বয়ংক্রিয়ভাবে কোম্পানি ফান্ডে জমা হয়। প্রতিটি জমার সম্পূর্ণ অডিট রেকর্ড নিচে সংরক্ষিত আছে।
                    </p>
                  </div>
                </div>

                {/* Quick Level Limit Config Box */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl flex items-center gap-3 shrink-0">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-slate-300 block uppercase">কমিশন লেভেল সীমা (Level Limit)</span>
                    <div className="text-xs font-bold text-amber-300">অ্যাডমিন কন্ট্রোল সেটআপ</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setMaxIncentiveLevels(prev => Math.max(1, prev - 1))}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-black text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-black text-sm px-2 text-emerald-400">{maxIncentiveLevels} Levels</span>
                    <button
                      type="button"
                      onClick={() => setMaxIncentiveLevels(prev => Math.min(100, prev + 1))}
                      className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-black text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 border border-emerald-100">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">কোম্পানি ফান্ড মোট জমা</span>
                  <div className="text-lg font-black font-mono text-emerald-700">
                    ₹{filteredCompanyFundLogs.reduce((s, l) => s + l.amount, 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block">Unclaimed Commission Pool</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 border border-indigo-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">মোট ফান্ড জমা এন্ট্রি</span>
                  <div className="text-lg font-black font-mono text-indigo-950">
                    {filteredCompanyFundLogs.length} টি
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block">Reversion Audit Records</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0 border border-amber-100">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">চলতি কমিশন লেভেল সীমা</span>
                  <div className="text-lg font-black font-mono text-amber-600">
                    Level 1 to {maxIncentiveLevels}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block">Unlimited Depth Allowed</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 border border-rose-100">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">সর্বশেষ ফান্ড জমা</span>
                  <div className="text-xs font-black text-slate-900 truncate max-w-[140px]">
                    {companyFundLogs[0]?.timestamp ? companyFundLogs[0].timestamp.split(',')[0] : 'No Record'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block">Real-time DB Sync</span>
                </div>
              </div>

            </div>

            {/* Search, Filter & Report Action Controls */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="খুঁজুন (সদস্যের নাম, আইডি, অর্ডার নম্বর, প্রোডাক্ট বা কারণ)..."
                    value={fundSearchTerm}
                    onChange={(e) => setFundSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  {fundSearchTerm && (
                    <button onClick={() => setFundSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs">
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns & Export Buttons */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                  
                  {/* Level Filter */}
                  <select
                    value={fundLevelFilter}
                    onChange={(e) => setFundLevelFilter(e.target.value)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">সকল লেভেল (All Levels)</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                    <option value="5">Level 5</option>
                    <option value="6+">Level 6+</option>
                  </select>

                  {/* Date Filter */}
                  <select
                    value={fundDateFilter}
                    onChange={(e) => setFundDateFilter(e.target.value as any)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">সকল তারিখ (All Time)</option>
                    <option value="today">আজ (Today)</option>
                    <option value="week">গত ৭ দিন (7 Days)</option>
                    <option value="month">এই মাস (This Month)</option>
                  </select>

                  {/* Report Print PDF */}
                  <button
                    type="button"
                    onClick={handlePrintCompanyFundReport}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    title="Print Printable PDF Audit Report"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>প্রিন্ট অডিট রিপোর্ট</span>
                  </button>

                  {/* CSV Export */}
                  <button
                    type="button"
                    onClick={handleExportCompanyFundCSV}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    title="Export Data to Excel CSV File"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>এক্সেল এক্সপোর্ট</span>
                  </button>

                </div>

              </div>
            </div>

            {/* Audit History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-xs">
                    📋
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">কোম্পানি ফান্ড জমাকৃত ট্র্যানজ্যাকশন অডিট লেজার</h3>
                    <p className="text-[11px] text-slate-500 font-medium">প্রতিটি অর্ডারের কারণে নির্দিষ্ট লেভেলে সদস্য না থাকায় যে অর্থ কোম্পানি ফান্ডে জমা হয়েছে</p>
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  {filteredCompanyFundLogs.length} Records Found
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-800">
                      <th className="p-3.5">Log ID & Date/Time</th>
                      <th className="p-3.5">Member Details (সদস্য)</th>
                      <th className="p-3.5">Order & Product (অর্ডার ও পণ্য)</th>
                      <th className="p-3.5 text-center">Unclaimed Level</th>
                      <th className="p-3.5 text-right">Reverted Amount (টাকা)</th>
                      <th className="p-3.5">Audit Reason (জমার কারণ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 font-medium">
                    {filteredCompanyFundLogs.length > 0 ? (
                      filteredCompanyFundLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-indigo-50/40 transition-colors">
                          
                          {/* Log ID & Timestamp */}
                          <td className="p-3.5 space-y-0.5">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] inline-block">
                              {log.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 block font-mono">
                              {log.timestamp}
                            </span>
                          </td>

                          {/* Member Details */}
                          <td className="p-3.5 space-y-0.5">
                            <div className="font-black text-slate-900">{log.memberName}</div>
                            <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block border border-indigo-100">
                              User ID: #{log.memberId}
                            </div>
                          </td>

                          {/* Order & Product */}
                          <td className="p-3.5 space-y-0.5">
                            <div className="font-bold text-slate-800">{log.productName}</div>
                            <div className="text-[10px] font-mono text-slate-500 font-semibold">
                              Order ID: <span className="font-bold text-amber-600">{log.orderId}</span> ({log.totalBV?.toLocaleString('en-IN')} BV)
                            </div>
                          </td>

                          {/* Unclaimed Level */}
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                              Level {log.level} ({log.percentage}%)
                            </span>
                          </td>

                          {/* Reverted Amount */}
                          <td className="p-3.5 text-right space-y-0.5">
                            <div className="font-black text-emerald-700 text-sm font-mono">
                              +₹{log.amount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-bold block">Fund Deposited</span>
                          </td>

                          {/* Audit Reason */}
                          <td className="p-3.5">
                            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg block leading-tight">
                              {log.reason}
                            </span>
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-semibold">
                          <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-bold text-slate-600">কোনো কোম্পানি ফান্ড হিস্ট্রি রেকর্ড পাওয়া যায়নি</p>
                          <p className="text-xs text-slate-400 mt-1">ফিল্টার পরিবর্তন করে চেষ্টা করুন অথবা নতুন অর্ডার অ্যাপ্রুভ করুন।</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        );
      })()}

      {/* 5. BUSINESS TARGET & 50:50 RATIO SETUP TAB */}
      {activeTab === 'business-targets' && (() => {
        // Calculate user business progress report list
        const userTargetProgressList = users.map(u => {
          // Downline users & direct referrals
          const directDownlines = users.filter(d => d.referrer_id === u.id);
          const directOrders = ordersList.filter(o => directDownlines.some(d => d.id === o.userId) && o.status === 'Approved');
          
          // Direct Business BV & PV
          const directBv = directOrders.reduce((sum, o) => sum + (o.totalBV || 0), 0);
          const directPv = directOrders.reduce((sum, o) => sum + (o.totalPV || 0), 0);

          // Team Business BV & PV (All orders from downline network)
          const teamBv = ordersList
            .filter(o => o.userId !== u.id && o.status === 'Approved')
            .reduce((sum, o) => sum + (o.totalBV || 0), 0);
          const teamPv = ordersList
            .filter(o => o.userId !== u.id && o.status === 'Approved')
            .reduce((sum, o) => sum + (o.totalPV || 0), 0);

          // Progress percentages
          const directBvPercent = targetConfig.directBvTarget > 0 ? Math.min(100, Math.round((directBv / targetConfig.directBvTarget) * 100)) : 100;
          const directPvPercent = targetConfig.directPvTarget > 0 ? Math.min(100, Math.round((directPv / targetConfig.directPvTarget) * 100)) : 100;
          const teamBvPercent = targetConfig.teamBvTarget > 0 ? Math.min(100, Math.round((teamBv / targetConfig.teamBvTarget) * 100)) : 100;
          const teamPvPercent = targetConfig.teamPvTarget > 0 ? Math.min(100, Math.round((teamPv / targetConfig.teamPvTarget) * 100)) : 100;

          // 50:50 Ratio Matching
          const maxLeg = Math.max(directBv, teamBv);
          const minLeg = Math.min(directBv, teamBv);
          const ratioPercent = maxLeg > 0 ? Math.min(100, Math.round((minLeg / maxLeg) * 100)) : 0;

          // Target Achieved Status Check
          const isDirectBvMet = directBv >= targetConfig.directBvTarget;
          const isDirectPvMet = directPv >= targetConfig.directPvTarget;
          const isTeamBvMet = teamBv >= targetConfig.teamBvTarget;
          const isTeamPvMet = teamPv >= targetConfig.teamPvTarget;
          const isRatioMet = !targetConfig.ratioRuleEnabled || ratioPercent >= 100 || (minLeg >= maxLeg * (targetConfig.otherLegsMinRatio / targetConfig.strongLegMaxRatio));

          const isAchieved = isDirectBvMet && isDirectPvMet && isTeamBvMet && isTeamPvMet && isRatioMet;

          const overallCompletion = Math.min(100, Math.round((directBvPercent + directPvPercent + teamBvPercent + teamPvPercent) / 4));

          return {
            user: u,
            directBv,
            directPv,
            teamBv,
            teamPv,
            directBvPercent,
            directPvPercent,
            teamBvPercent,
            teamPvPercent,
            ratioPercent,
            isAchieved,
            overallCompletion
          };
        });

        // Filter progress report
        const filteredTargetList = userTargetProgressList.filter(item => {
          const matchesSearch = targetSearchTerm === '' ||
            item.user.name.toLowerCase().includes(targetSearchTerm.toLowerCase()) ||
            item.user.phone.includes(targetSearchTerm) ||
            String(item.user.id).includes(targetSearchTerm);

          const matchesStatus = targetStatusFilter === 'all' ||
            (targetStatusFilter === 'achieved' && item.isAchieved) ||
            (targetStatusFilter === 'in_progress' && !item.isAchieved);

          return matchesSearch && matchesStatus;
        });

        const totalAchievedCount = userTargetProgressList.filter(i => i.isAchieved).length;

        const handlePrintTargetReport = () => {
          const rows = filteredTargetList.map(item => [
            `#${item.user.id} - ${item.user.name} (${item.user.phone})`,
            `${item.directBv.toLocaleString('en-IN')} BV / ${item.directPv} PV (${item.directBvPercent}%)`,
            `${item.teamBv.toLocaleString('en-IN')} BV / ${item.teamPv} PV (${item.teamBvPercent}%)`,
            `${item.ratioPercent}% Ratio Balance`,
            item.isAchieved ? "ACHIEVED (সম্পন্ন)" : `In Progress (${item.overallCompletion}%)`
          ]);

          printPDFReport(
            "Business Target & 50:50 Ratio Achievement Report (বিজনেস টার্গেট রিপোর্ট)",
            `Target: ${targetConfig.title} | Achieved Members: ${totalAchievedCount} / ${users.length}`,
            ["Member Details", "Direct Business (BV/PV)", "Team Business (BV/PV)", "50:50 Ratio", "Target Status"],
            rows
          );
        };

        const handleExportTargetCSV = () => {
          const headers = ["User ID", "Member Name", "Phone", "Direct BV", "Direct PV", "Team BV", "Team PV", "Ratio Balance %", "Overall Completion %", "Status"];
          const rows = filteredTargetList.map(item => [
            item.user.id,
            item.user.name,
            item.user.phone,
            item.directBv,
            item.directPv,
            item.teamBv,
            item.teamPv,
            `${item.ratioPercent}%`,
            `${item.overallCompletion}%`,
            item.isAchieved ? "ACHIEVED" : "IN_PROGRESS"
          ]);

          exportToCSV("business_target_50_50_achievements", headers, rows);
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-orange-950 text-white rounded-3xl p-6 border border-amber-800/40 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0">
                    <Sliders className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-500/30">
                        অ্যাডমিন রেশিও মডিউল
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        50:50 Business Target System Active
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">বিজনেস টার্গেট ও ৫০:৫০ রেশিও সেটআপ</h2>
                    <p className="text-xs text-amber-200/90 max-w-2xl mt-0.5">
                      অ্যাডমিন প্যানেল থেকে Direct Business & Team Business-এর জন্য BV এবং PV অনুযায়ী ৫০:৫০ রেশিও ভিত্তিক টার্গেট কনফিগার করুন।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-amber-200 block font-bold">Target Achievers</span>
                    <span className="text-lg font-black text-white">{totalAchievedCount} / {users.length} Members</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Setup Form Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl font-bold">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">টার্গেট ও ৫০:৫০ রেশিও কনফিগারেশন</h3>
                    <p className="text-xs text-slate-500">অ্যাডমিন নির্ধারিত মান অনুযায়ী সরাসরি সমস্ত সদস্যের ড্যাশবোর্ডে আপডেট হবে</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-black text-slate-700">ক্যাম্পেইন স্ট্যাটাস:</label>
                  <button
                    type="button"
                    onClick={() => setTargetConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                      targetConfig.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {targetConfig.isActive ? 'ACTIVE (সক্রিয়)' : 'INACTIVE (বন্ধ)'}
                  </button>
                </div>
              </div>

              {/* Target Type & Timeframe Selector Bar */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                    টার্গেট সময়কাল ও ধরণ (Target Timeframe)
                  </span>
                  <h4 className="font-black text-slate-900 text-sm">বার্ষিক, মাসিক বা নির্দিষ্ট সময়সীমার টার্গেট নির্বাচন করুন</h4>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                      setTargetConfig(prev => ({
                        ...prev,
                        targetPeriodType: 'monthly',
                        startDate: firstDay,
                        endDate: lastDay,
                        title: `Monthly Business Target (${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })})`
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      targetConfig.targetPeriodType === 'monthly'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-amber-100 border border-slate-200'
                    }`}
                  >
                    📅 মাসিক টার্গেট (Monthly)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const startYear = `${now.getFullYear()}-01-01`;
                      const endYear = `${now.getFullYear()}-12-31`;
                      setTargetConfig(prev => ({
                        ...prev,
                        targetPeriodType: 'yearly',
                        startDate: startYear,
                        endDate: endYear,
                        title: `Annual Business & Royalty Target ${now.getFullYear()}`
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      targetConfig.targetPeriodType === 'yearly'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-amber-100 border border-slate-200'
                    }`}
                  >
                    🏆 বার্ষিক টার্গেট (Yearly)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetConfig(prev => ({ ...prev, targetPeriodType: 'custom' }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      targetConfig.targetPeriodType === 'custom'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-amber-100 border border-slate-200'
                    }`}
                  >
                    ⏳ কাস্টম সময়সীমা (Custom)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Direct Business Target Box */}
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-amber-950 text-sm flex items-center gap-2">
                      <span className="p-1 bg-amber-200 text-amber-900 rounded-md text-xs">01</span>
                      <span>ডাইরেক্ট বিজনেস টার্গেট (Direct Target)</span>
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Direct Business Value (BV) Target *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={targetConfig.directBvTarget}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, directBvTarget: Number(e.target.value) }))}
                        className="w-full p-2.5 pl-3 bg-white border border-amber-300 rounded-xl font-mono text-sm font-bold text-amber-950 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-black text-amber-600">BV</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Direct Point Value (PV) Target *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={targetConfig.directPvTarget}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, directPvTarget: Number(e.target.value) }))}
                        className="w-full p-2.5 pl-3 bg-white border border-amber-300 rounded-xl font-mono text-sm font-bold text-amber-950 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-black text-amber-600">PV</span>
                    </div>
                  </div>
                </div>

                {/* Team Business Target Box */}
                <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-indigo-950 text-sm flex items-center gap-2">
                      <span className="p-1 bg-indigo-200 text-indigo-900 rounded-md text-xs">02</span>
                      <span>টিম বিজনেস টার্গেট (Team Target)</span>
                    </h4>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Business Value (BV) Target *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={targetConfig.teamBvTarget}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, teamBvTarget: Number(e.target.value) }))}
                        className="w-full p-2.5 pl-3 bg-white border border-indigo-300 rounded-xl font-mono text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-black text-indigo-600">BV</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Team Point Value (PV) Target *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={targetConfig.teamPvTarget}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, teamPvTarget: Number(e.target.value) }))}
                        className="w-full p-2.5 pl-3 bg-white border border-indigo-300 rounded-xl font-mono text-sm font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-black text-indigo-600">PV</span>
                    </div>
                  </div>
                </div>

                {/* 50:50 Business Ratio Configuration Box */}
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-emerald-950 text-sm flex items-center gap-2">
                      <span className="p-1 bg-emerald-200 text-emerald-900 rounded-md text-xs">03</span>
                      <span>৫০:৫০ বিজনেস রেশিও সেটিংস</span>
                    </h4>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-emerald-200">
                    <label htmlFor="ratioRuleCheck" className="text-xs font-black text-emerald-950 cursor-pointer">
                      ৫০:৫০ রেশিও নিয়ম প্রয়োগ করুন
                    </label>
                    <input
                      type="checkbox"
                      id="ratioRuleCheck"
                      checked={targetConfig.ratioRuleEnabled}
                      onChange={(e) => setTargetConfig(prev => ({ ...prev, ratioRuleEnabled: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Strong Leg Max %
                      </label>
                      <input
                        type="number"
                        value={targetConfig.strongLegMaxRatio}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, strongLegMaxRatio: Number(e.target.value) }))}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-mono text-xs font-bold text-emerald-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Other Legs Min %
                      </label>
                      <input
                        type="number"
                        value={targetConfig.otherLegsMinRatio}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, otherLegsMinRatio: Number(e.target.value) }))}
                        className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-mono text-xs font-bold text-emerald-950"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800 font-medium bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200 leading-snug">
                    💡 ৫০:৫০ বিজনেস রেশিও অনুযায়ী স্ট্রং লেগ থেকে সর্বোচ্চ ৫০% এবং আদার্স লেগ থেকে সর্বনিম্ন ৫০% সাপেক্ষে টার্গেট কাউন্ট হবে।
                  </p>
                </div>

              </div>

              {/* Gifts, Rewards, Incentives & Cash Bonus Section */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs">🎁</span>
                  <span>উপহার, রিওয়ার্ড, বোনাস ও ইনসেনটিভ কনফিগারেশন (Gifts & Rewards)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      উপহার / গিফটের নাম (Gift Item Name) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro / Smart TV / Gold Coin"
                      value={targetConfig.rewardGift || ''}
                      onChange={(e) => setTargetConfig(prev => ({ ...prev, rewardGift: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ইনসেনটিভ / বোনাস বিবরণ (Incentive & Bonus) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5% Monthly Royalty Pool Share"
                      value={targetConfig.rewardIncentive || ''}
                      onChange={(e) => setTargetConfig(prev => ({ ...prev, rewardIncentive: e.target.value }))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ক্যাশ বোনাস পরিমাণ (Cash Bonus Amount ₹/BDT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25000"
                      value={targetConfig.rewardBonusAmount || 0}
                      onChange={(e) => setTargetConfig(prev => ({ ...prev, rewardBonusAmount: Number(e.target.value) }))}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Title, Start/End Dates & Quick Date Extension (Date Extend) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টার্গেট ক্যাম্পেইন শিরোনাম (Campaign Title)
                  </label>
                  <input
                    type="text"
                    value={targetConfig.title}
                    onChange={(e) => setTargetConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    র‍্যাংক / পদের নাম (Rank Badge Title)
                  </label>
                  <input
                    type="text"
                    value={targetConfig.rewardTitle || ''}
                    onChange={(e) => setTargetConfig(prev => ({ ...prev, rewardTitle: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">শুরুর তারিখ (Start Date)</label>
                      <input
                        type="date"
                        value={targetConfig.startDate}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">শেষের তারিখ (End Date)</label>
                      <input
                        type="date"
                        value={targetConfig.endDate}
                        onChange={(e) => setTargetConfig(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Date Extend Quick Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-black text-amber-800 uppercase">মেয়াদ বাড়ান (Date Extend):</span>
                    <button
                      type="button"
                      onClick={() => {
                        const curr = new Date(targetConfig.endDate || new Date());
                        curr.setDate(curr.getDate() + 15);
                        setTargetConfig(prev => ({ ...prev, endDate: curr.toISOString().split('T')[0] }));
                      }}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-[10px] font-black cursor-pointer border border-amber-300"
                    >
                      +15 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curr = new Date(targetConfig.endDate || new Date());
                        curr.setDate(curr.getDate() + 30);
                        setTargetConfig(prev => ({ ...prev, endDate: curr.toISOString().split('T')[0] }));
                      }}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-[10px] font-black cursor-pointer border border-amber-300"
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curr = new Date(targetConfig.endDate || new Date());
                        curr.setDate(curr.getDate() + 90);
                        setTargetConfig(prev => ({ ...prev, endDate: curr.toISOString().split('T')[0] }));
                      }}
                      className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md text-[10px] font-black cursor-pointer border border-amber-300"
                    >
                      +90 Days
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>পরিবর্তন করার সাথে সাথে রিয়েল-টাইমে সিস্টেম ও ড্যাশবোর্ডে আপডেট সংরক্ষিত হয়</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('mlm_business_target_config', JSON.stringify(targetConfig));
                    window.dispatchEvent(new CustomEvent('business-target-updated', { detail: targetConfig }));
                    setSuccessMsg('বিজনেস টার্গেট ও ৫০:৫০ রেশিও সেটিংস সফলভাবে ব্যাকএন্ডে সংরক্ষিত হয়েছে!');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>টার্গেট সেটিংস আপডেট করুন (Save Settings)</span>
                </button>
              </div>
            </div>

            {/* Members Target Progress Audit Report Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <span>সদস্যদের বিজনেস টার্গেট ও ৫০:৫০ রেশিও অগ্রগতি রিপোর্ট</span>
                    <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {filteredTargetList.length} Records
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">প্রতিটি ইউজারের ডাইরেক্ট ও টিম বিজনেস BV/PV অগ্রগতি এবং ৫০:৫০ রেশিও ট্র্যাকিং</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handlePrintTargetReport}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-300" />
                    <span>প্রিন্ট/PDF রিপোর্ট</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportTargetCSV}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                    <span>CSV এক্সপোর্ট</span>
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="সদস্যের নাম, মোবাইল নম্বর বা ID লিখুন..."
                    value={targetSearchTerm}
                    onChange={(e) => setTargetSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={targetStatusFilter}
                    onChange={(e) => setTargetStatusFilter(e.target.value as any)}
                    className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="all">সব সদস্য (All Members)</option>
                    <option value="achieved">🎉 Achieved (টার্গেট সম্পন্ন)</option>
                    <option value="in_progress">⏳ In Progress (চলমান)</option>
                  </select>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Member Details (সদস্য বিবরণ)</th>
                      <th className="p-3.5">Direct Business (BV & PV)</th>
                      <th className="p-3.5">Team Business (BV & PV)</th>
                      <th className="p-3.5 text-center">50:50 Ratio Balance</th>
                      <th className="p-3.5 text-right">Target Status (অবস্থা)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 font-medium">
                    {filteredTargetList.length > 0 ? (
                      filteredTargetList.map((item) => (
                        <tr key={item.user.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-3.5 space-y-0.5">
                            <div className="font-black text-slate-900">{item.user.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                              <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                ID: #{item.user.id}
                              </span>
                              <span>📞 {item.user.phone}</span>
                            </div>
                          </td>

                          {/* Direct Business Progress */}
                          <td className="p-3.5 space-y-1">
                            <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                              <span>{item.directBv.toLocaleString('en-IN')} / {targetConfig.directBvTarget.toLocaleString('en-IN')} BV</span>
                              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">{item.directBvPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${item.directBvPercent}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Direct PV: <strong className="text-slate-800">{item.directPv}</strong> / {targetConfig.directPvTarget} PV ({item.directPvPercent}%)
                            </div>
                          </td>

                          {/* Team Business Progress */}
                          <td className="p-3.5 space-y-1">
                            <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                              <span>{item.teamBv.toLocaleString('en-IN')} / {targetConfig.teamBvTarget.toLocaleString('en-IN')} BV</span>
                              <span className="text-[10px] text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">{item.teamBvPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${item.teamBvPercent}%` }}
                              ></div>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500">
                              Team PV: <strong className="text-slate-800">{item.teamPv}</strong> / {targetConfig.teamPvTarget} PV ({item.teamPvPercent}%)
                            </div>
                          </td>

                          {/* 50:50 Ratio Balance */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ${
                              item.ratioPercent >= 100
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              ⚡ {item.ratioPercent}% Balanced
                            </span>
                          </td>

                          {/* Status */}
                          <td className="p-3.5 text-right space-y-1">
                            {item.isAchieved ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-full shadow-xs">
                                🎉 ACHIEVED (সম্পন্ন)
                              </span>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold text-[11px] rounded-full border border-amber-300">
                                  ⏳ In Progress ({item.overallCompletion}%)
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {100 - item.overallCompletion}% Remaining
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                          কোনো টার্গেট রেকর্ড পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        );
      })()}

      {/* 5. PRODUCT CATALOG & OFFERS MANAGEMENT TAB */}
      {activeTab === 'products' && (() => {
        const filteredProds = products.filter(prod => {
          const matchesSearch = prodSearchTerm === '' ||
            prod.name.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
            (prod.sku && prod.sku.toLowerCase().includes(prodSearchTerm.toLowerCase())) ||
            (prod.brand && prod.brand.toLowerCase().includes(prodSearchTerm.toLowerCase()));

          const matchesCategory = prodCategoryFilter === 'all' || prod.category === prodCategoryFilter;

          const matchesStock = prodStockFilter === 'all' ||
            (prodStockFilter === 'in_stock' && (!prod.stockStatus || prod.stockStatus === 'in_stock')) ||
            (prodStockFilter === 'out_of_stock' && prod.stockStatus === 'out_of_stock') ||
            (prodStockFilter === 'sold_out' && prod.stockStatus === 'sold_out');

          const matchesOffer = prodOfferFilter === 'all' || (prodOfferFilter === 'offer_only' && prod.isOfferActive);

          return matchesSearch && matchesCategory && matchesStock && matchesOffer;
        });

        const activeOffersCount = products.filter(p => p.isOfferActive).length;
        const inStockCount = products.filter(p => !p.stockStatus || p.stockStatus === 'in_stock').length;
        const soldOutCount = products.filter(p => p.stockStatus === 'sold_out' || p.stockStatus === 'out_of_stock').length;

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 border border-slate-700/60 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl shrink-0">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-amber-500/30">
                        অ্যাডমিন প্রোডাক্ট মডিউল
                      </span>
                      <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                        Unlimited Products & Level Commission
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">প্রোডাক্ট ক্যাটাগরি, মূল্য, স্টক ও কমিশন ম্যানেজমেন্ট</h2>
                    <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                      এখানে যেকোনো ক্যাটাগরি, প্রোডাক্ট তৈরি, MRP/Selling Price, BV/PV, কাস্টম লেভেল কমিশন, COD/অনলাইন পেমেন্ট নিয়ম এবং অফার নিয়ন্ত্রণ করতে পারবেন।
                    </p>
                  </div>
                </div>

                {/* Top Actions */}
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                  >
                    <FolderPlus className="w-4 h-4 text-indigo-300" />
                    <span>ক্যাটাগরি মডিউল ({categories.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenAddProductModal}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>নতুন প্রোডাক্ট যোগ করুন</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 font-bold">
                  📦
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">মোট প্রোডাক্ট</span>
                  <div className="text-base font-black font-mono text-slate-900">{products.length} টি</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 font-bold">
                  ✅
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">ইন স্টক (In Stock)</span>
                  <div className="text-base font-black font-mono text-emerald-600">{inStockCount} টি</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl shrink-0 font-bold">
                  🛑
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">স্টক আউট / সোল্ড আউট</span>
                  <div className="text-base font-black font-mono text-rose-600">{soldOutCount} টি</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0 font-bold">
                  🔥
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">অফার ও ডিসকাউন্ট</span>
                  <div className="text-base font-black font-mono text-amber-600">{activeOffersCount} টি</div>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="প্রোডাক্ট খুঁজুন (নাম, ব্র্যান্ড বা SKU দিয়ে)..."
                    value={prodSearchTerm}
                    onChange={(e) => setProdSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <select
                    value={prodCategoryFilter}
                    onChange={(e) => setProdCategoryFilter(e.target.value)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">সকল ক্যাটাগরি (All Categories)</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={prodStockFilter}
                    onChange={(e) => setProdStockFilter(e.target.value as any)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">সকল স্টক স্ট্যাটাস</option>
                    <option value="in_stock">In Stock (স্টকে আছে)</option>
                    <option value="sold_out">Sold Out / Out of Stock</option>
                  </select>

                  <select
                    value={prodOfferFilter}
                    onChange={(e) => setProdOfferFilter(e.target.value as any)}
                    className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">সকল প্রোডাক্ট</option>
                    <option value="offer_only">🔥 অফার প্রোডাক্টসমূহ (Active Offers)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProds.map((prod) => {
                const isSoldOut = prod.stockStatus === 'sold_out' || prod.stockStatus === 'out_of_stock' || (prod.stock !== undefined && prod.stock <= 0);

                return (
                  <div key={prod.id} className={`bg-white rounded-2xl border transition-all hover:shadow-lg overflow-hidden flex flex-col justify-between ${
                    isSoldOut ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
                  }`}>
                    <div>
                      {/* Image Thumbnail with Overlay Badges */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden group">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-900/90 backdrop-blur-md text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-400/30">
                            {prod.category}
                          </span>
                          {prod.subCategory && (
                            <span className="bg-indigo-900/90 text-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              {prod.subCategory}
                            </span>
                          )}
                        </div>

                        {/* Stock Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {isSoldOut ? (
                            <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-pulse">
                              🛑 Sold Out / স্টক আউট
                            </span>
                          ) : (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                              ⚡ In Stock ({prod.stock || 50} Units)
                            </span>
                          )}
                        </div>

                        {/* Bottom Overlay Title Info */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                          <div className="text-[10px] font-mono text-slate-300 flex items-center gap-2">
                            <span>SKU: {prod.sku || `SP-${prod.id}`}</span>
                            {prod.brand && <span>• {prod.brand}</span>}
                          </div>
                          <h3 className="text-sm font-black text-white line-clamp-1">{prod.name}</h3>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-3 text-xs">
                        {/* Price Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">MRP (বাজার মূল্য)</span>
                            <span className="text-xs line-through text-slate-400">₹{prod.mrp.toLocaleString('en-IN')}</span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase block">Selling Price (DP)</span>
                            <span className="text-sm font-black text-emerald-600">₹{prod.distributorPrice.toLocaleString('en-IN')}</span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-amber-600 uppercase block">Business Value (BV)</span>
                            <span className="text-xs font-black text-amber-600">{prod.businessValue.toLocaleString('en-IN')} BV</span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-blue-600 uppercase block">Point Value (PV)</span>
                            <span className="text-xs font-black text-blue-600">{prod.pointValue} PV</span>
                          </div>
                        </div>

                        {/* Payment Method Badge */}
                        <div className="flex items-center justify-between text-[10px] bg-slate-100/80 p-2 rounded-lg border border-slate-200/60 font-medium">
                          <span className="text-slate-500 font-bold">পেমেন্ট সুবিধা:</span>
                          {prod.paymentType === 'cod_only' ? (
                            <span className="text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded">Cash on Delivery Only</span>
                          ) : prod.paymentType === 'online_only' ? (
                            <span className="text-indigo-800 bg-indigo-100 font-bold px-2 py-0.5 rounded">Online / Advance Token Only</span>
                          ) : (
                            <span className="text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">COD & Online Both Available</span>
                          )}
                        </div>

                        {/* Level Commission Breakdown Badge */}
                        <div className="bg-indigo-50/70 border border-indigo-100 p-2 rounded-lg text-[10px]">
                          <div className="flex items-center justify-between font-bold text-indigo-950 mb-1">
                            <span>কমিশন স্ট্রাকচার:</span>
                            {prod.useCustomCommission ? (
                              <span className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black">Custom Product Levels</span>
                            ) : (
                              <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-bold">Global System Levels</span>
                            )}
                          </div>
                          {prod.useCustomCommission && prod.customCommissionLevels && prod.customCommissionLevels.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap text-slate-600 font-mono font-bold">
                              {prod.customCommissionLevels.map(c => (
                                <span key={c.level} className="bg-white border border-indigo-200 px-1.5 py-0.5 rounded">
                                  L{c.level}: {c.percentage ? `${c.percentage}%` : `₹${c.amount}`}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500">গ্লোবাল ডিসবার্সমেন্ট সেটিংস অনুসৃত হবে।</span>
                          )}
                        </div>

                        {/* Active Offer Banner */}
                        {prod.isOfferActive && (
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 p-2.5 rounded-xl font-bold shadow-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span>🔥 অফার প্রাইজ: ₹{prod.offerPrice?.toLocaleString('en-IN')}</span>
                              {prod.discountPercent && <span className="bg-slate-950 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-black">{prod.discountPercent}% OFF</span>}
                            </div>
                            {prod.couponOffer && (
                              <div className="text-[10px] font-mono bg-white/30 px-2 py-0.5 rounded text-slate-900 border border-slate-950/10">
                                Coupon Code: <strong className="font-extrabold">{prod.couponOffer}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleProductStock(prod.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                          isSoldOut
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                            : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                        }`}
                      >
                        {isSoldOut ? '⚡ Mark In Stock' : '🛑 Mark Sold Out'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProductModal(prod)}
                          className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-all cursor-pointer font-bold"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-all cursor-pointer font-bold"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {filteredProds.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-black text-slate-800">কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
                <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করুন অথবা নতুন প্রোডাক্ট তৈরি করুন।</p>
                <button
                  type="button"
                  onClick={handleOpenAddProductModal}
                  className="mt-4 px-4 py-2 bg-amber-400 text-slate-950 rounded-xl font-bold text-xs cursor-pointer"
                >
                  + Add Product
                </button>
              </div>
            )}

          </div>
        );
      })()}

      {/* Sweet Toast Notification Popup */}
      {sweetToast && (
        <div className="fixed top-5 right-5 z-[100] animate-bounce duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${
            sweetToast.type === 'success' ? 'bg-emerald-950 text-white border-emerald-600' :
            sweetToast.type === 'error' ? 'bg-rose-950 text-white border-rose-600' :
            'bg-slate-900 text-white border-slate-700'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              sweetToast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
              sweetToast.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
              'bg-indigo-500/20 text-indigo-400'
            }`}>
              {sweetToast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               sweetToast.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-extrabold text-xs text-amber-400">{sweetToast.type === 'success' ? 'Success!' : 'Notification'}</p>
              <p className="text-xs font-medium text-slate-100">{sweetToast.message}</p>
            </div>
            <button onClick={() => setSweetToast(null)} className="ml-2 text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sweet Alert Custom Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300 p-6 space-y-5">
            
            {/* Warning Icon Header */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 animate-pulse">
                <Trash2 className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
                {confirmModal.subtitle && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 inline-block">
                    {confirmModal.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Warning Message Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {confirmModal.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmModal.confirmBtnText}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-400 text-slate-950 font-black rounded-xl">
                  📦
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingProduct ? 'প্রোডাক্ট তথ্য সম্পাদনা করুন (Edit Product)' : 'নতুন প্রোডাক্ট যুক্ত করুন (Add Product)'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    MRP, Selling Price, BV/PV, Stock, COD/Online, Custom Level Commission and Offers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProductSubmit} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px] bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex items-center gap-2">
                  <span>1. মৌলিক তথ্য (Basic Info & Identifiers)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      প্রোডাক্টের নাম *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 535W Mono PERC High-Efficiency Solar Panel"
                      value={pName}
                      onChange={(e) => setPName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ক্যাটাগরি *
                    </label>
                    <select
                      value={pCategory}
                      onChange={(e) => {
                        const newCatName = e.target.value;
                        setPCategory(newCatName);
                        const matchedCat = categories.find(c => c.name === newCatName);
                        if (matchedCat && matchedCat.subCategories.length > 0) {
                          setPSubCategory(matchedCat.subCategories[0]);
                        } else {
                          setPSubCategory('');
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      সাব-ক্যাটাগরি
                    </label>
                    {(() => {
                      const activeCatObj = categories.find(c => c.name === pCategory);
                      if (activeCatObj && activeCatObj.subCategories.length > 0) {
                        return (
                          <select
                            value={pSubCategory}
                            onChange={(e) => setPSubCategory(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                          >
                            <option value="">-- নির্বাচন করুন --</option>
                            {activeCatObj.subCategories.map((sub, idx) => (
                              <option key={idx} value={sub}>{sub}</option>
                            ))}
                          </select>
                        );
                      }
                      return (
                        <input
                          type="text"
                          placeholder="e.g. Mono PERC Modules"
                          value={pSubCategory}
                          onChange={(e) => setPSubCategory(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ব্র্যান্ড / প্রস্তুতকারক (Brand Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Waaree, Adani, Luminous, Havells"
                      value={pBrand}
                      onChange={(e) => setPBrand(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      SKU কোড / আইডি
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SP-535W-PERC"
                      value={pSku}
                      onChange={(e) => setPSku(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ছবি URL (Product Image)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={pImage}
                      onChange={(e) => setPImage(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Preset Image Options */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">দ্রুত নমুনা ছবি বেছে নিন:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { name: 'Solar Panel', url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=80' },
                      { name: 'Inverter', url: 'https://images.unsplash.com/photo-1558441719-670b357021bc?w=600&auto=format&fit=crop&q=80' },
                      { name: 'Solar Pump', url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=600&auto=format&fit=crop&q=80' },
                      { name: 'Lithium Battery', url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80' },
                      { name: 'Street Light', url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80' },
                      { name: 'EV Charger', url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80' }
                    ].map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setPImage(preset.url)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        📷 {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    প্রোডাক্টের বিবরণ (Product Description)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide details on capacity, warranty, efficiency, specifications..."
                    value={pDescription}
                    onChange={(e) => setPDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="isUpcoming"
                    checked={pIsUpcoming}
                    onChange={(e) => setPIsUpcoming(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="isUpcoming" className="font-extrabold text-slate-800 cursor-pointer">
                    Upcoming Product হিসেবে চিহ্নিত করুন (আসন্ন প্রোডাক্ট)
                  </label>
                </div>
              </div>

              {/* SECTION 2: PRICING, BV & PV */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px] bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-2">
                  <span>2. মূল্য, বিজনেস ভ্যালু (BV) এবং পয়েন্ট ভ্যালু (PV)</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      MRP (বাজার মূল্য ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pMrp}
                      onChange={(e) => setPMrp(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Selling Price (DP ₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pDistributorPrice}
                      onChange={(e) => setPDistributorPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-emerald-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Business Value (BV) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pBusinessValue}
                      onChange={(e) => setPBusinessValue(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-amber-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Point Value (PV) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={pPointValue}
                      onChange={(e) => setPPointValue(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-blue-600 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: STOCK & PAYMENT METHODS */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px] bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center gap-2">
                  <span>3. ইনভেন্টরি, স্টক ও পেমেন্ট সুবিধা (COD/Advance Payment)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      স্টক সংখ্যা (Stock Count)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={pStock}
                      onChange={(e) => setPStock(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      স্টক স্ট্যাটাস (Stock Status)
                    </label>
                    <select
                      value={pStockStatus}
                      onChange={(e) => setPStockStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    >
                      <option value="in_stock">⚡ In Stock (স্টকে আছে)</option>
                      <option value="out_of_stock">⚠️ Out of Stock (স্টক সাময়িক শেষ)</option>
                      <option value="sold_out">🛑 Sold Out (সম্পূর্ণ সোল্ড আউট)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      পেমেন্ট টাইপ সুবিধা (Allowed Payment)
                    </label>
                    <select
                      value={pPaymentType}
                      onChange={(e) => setPPaymentType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                    >
                      <option value="both">✅ COD & Online Payment (উভয় প্রযোজ্য)</option>
                      <option value="cod_only">💵 Only Cash on Delivery (শুধুমাত্র সিওডি)</option>
                      <option value="online_only">💳 Online / Advance Payment Only (শুধুমাত্র অনলাইন/অগ্রিম)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="advancePayReq"
                      checked={pAdvancePaymentRequired}
                      onChange={(e) => setPAdvancePaymentRequired(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <label htmlFor="advancePayReq" className="font-black text-amber-950 cursor-pointer">
                      অগ্রিম টোকেন পেমেন্ট আবশ্যক (Advance Payment Required for High-Value Delivery)
                    </label>
                  </div>

                  {pAdvancePaymentRequired && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        অগ্রিম পেমেন্ট নির্দেশনা / নোট (e.g. "20% token payment required before dispatch")
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. requires 20% Advance Token Payment for High Value Inverter Freight"
                        value={pAdvancePaymentNote}
                        onChange={(e) => setPAdvancePaymentNote(e.target.value)}
                        className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: CUSTOM LEVEL COMMISSION PER PRODUCT */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-indigo-900 text-white p-3 rounded-2xl border border-indigo-800">
                  <div>
                    <h4 className="font-extrabold text-xs">4. কাস্টম লেভেল কমিশন সেটিংস (Custom Product Commission)</h4>
                    <p className="text-[10px] text-indigo-200">এই নির্দিষ্ট প্রোডাক্টের জন্য লেভেলভিত্তিক কাস্টম শতাংশ বা টাকা সেট করুন</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCustomComm"
                      checked={pUseCustomCommission}
                      onChange={(e) => setPUseCustomCommission(e.target.checked)}
                      className="w-5 h-5 text-amber-400 rounded cursor-pointer"
                    />
                    <label htmlFor="useCustomComm" className="font-black text-amber-300 text-xs cursor-pointer">
                      {pUseCustomCommission ? 'কাস্টম কমিশন সক্রিয় ✅' : 'গ্লোবাল সিস্টেম কমিশন ⚙️'}
                    </label>
                  </div>
                </div>

                {pUseCustomCommission && (
                  <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between text-indigo-950 font-extrabold text-xs">
                      <span>কাস্টম লেভেল কমিশন তালিকা:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextLevel = pCustomCommissionLevels.length + 1;
                          setPCustomCommissionLevels([...pCustomCommissionLevels, { level: nextLevel, percentage: 5 }]);
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        + লেভেল যোগ করুন
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
                      {pCustomCommissionLevels.map((lvlItem, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-indigo-200 shadow-xs space-y-1">
                          <span className="text-[10px] font-black text-indigo-900 block">Level {lvlItem.level}</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={lvlItem.percentage !== undefined ? lvlItem.percentage : 0}
                              onChange={(e) => {
                                const newPct = Number(e.target.value);
                                const newArr = [...pCustomCommissionLevels];
                                newArr[idx].percentage = newPct;
                                setPCustomCommissionLevels(newArr);
                              }}
                              className="w-full p-1 bg-slate-50 border border-slate-200 rounded font-bold text-xs"
                            />
                            <span className="font-black text-indigo-700">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: OFFERS & DISCOUNTS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-amber-500 text-slate-950 p-3 rounded-2xl border border-amber-600 shadow-sm">
                  <div>
                    <h4 className="font-extrabold text-xs">5. প্রমোশনাল অফার ও কুপন ডিসকাউন্ট (Offers & Coupons)</h4>
                    <p className="text-[10px] text-slate-900 font-medium">নির্দিষ্ট সময়সীমাভিত্তিক অফার ও স্পেশাল কুপন সেট করুন</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isOfferActive"
                      checked={pIsOfferActive}
                      onChange={(e) => setPIsOfferActive(e.target.checked)}
                      className="w-5 h-5 text-slate-950 rounded cursor-pointer"
                    />
                    <label htmlFor="isOfferActive" className="font-black text-slate-950 text-xs cursor-pointer">
                      {pIsOfferActive ? 'অফার চালুকৃত 🔥' : 'অফার বন্ধ ⚪'}
                    </label>
                  </div>
                </div>

                {pIsOfferActive && (
                  <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          অফার প্রাইস (Offer Price ₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={pOfferPrice}
                          onChange={(e) => setPOfferPrice(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-black text-amber-700 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ডিসকাউন্ট শতাংশ (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={pDiscountPercent}
                          onChange={(e) => setPDiscountPercent(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          কুপন কোড (Coupon Code)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SOLAR300"
                          value={pCouponOffer}
                          onChange={(e) => setPCouponOffer(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono font-black text-indigo-900 text-xs uppercase"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          ফ্ল্যাট ছাড় (Flat Discount ₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={pFlatDiscount}
                          onChange={(e) => setPFlatDiscount(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          শুরুর তারিখ (Start Date)
                        </label>
                        <input
                          type="date"
                          value={pOfferStartDate}
                          onChange={(e) => setPOfferStartDate(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          শেষের তারিখ (End Date)
                        </label>
                        <input
                          type="date"
                          value={pOfferEndDate}
                          onChange={(e) => setPOfferEndDate(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          শুরুর সময় (Start Time)
                        </label>
                        <input
                          type="time"
                          value={pOfferStartTime}
                          onChange={(e) => setPOfferStartTime(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          শেষের সময় (End Time)
                        </label>
                        <input
                          type="time"
                          value={pOfferEndTime}
                          onChange={(e) => setPOfferEndTime(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  বাতিল করুন (Cancel)
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'পরিবর্তন সংরক্ষণ করুন' : 'প্রোডাক্ট সংরক্ষণ করুন'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 7. CATEGORY MANAGEMENT MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-indigo-900">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white font-black rounded-xl">
                  📁
                </div>
                <div>
                  <h3 className="text-base font-black">প্রোডাক্ট ক্যাটাগরি ও সাব-ক্যাটাগরি ম্যানেজমেন্ট</h3>
                  <p className="text-xs text-indigo-200">Create, rename, or delete categories and subcategories</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Form to Add Category */}
              <form onSubmit={handleAddCategorySubmit} className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 space-y-3">
                <h4 className="font-extrabold text-indigo-950 text-xs">নতুন ক্যাটাগরি তৈরি করুন</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar Water Heaters"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-indigo-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shrink-0"
                  >
                    + ক্যাটাগরি যোগ করুন
                  </button>
                </div>
              </form>

              {/* List of Existing Categories */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-slate-900 text-xs">বর্তমান ক্যাটাগরি ও সাব-ক্যাটাগরি সমূহ ({categories.length}):</h4>

                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{cat.name}</span>
                          <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            {cat.subCategories.length} Subcategories
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* SubCategories Badge List */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat.subCategories.map((sub, sIdx) => (
                          <span key={sIdx} className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 text-[11px]">
                            <span>{sub}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubCategory(cat.id, sub)}
                              className="text-slate-400 hover:text-rose-600 font-black"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add SubCategory Inline Form */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="নতুন সাব-ক্যাটাগরি লিখুন..."
                          value={selectedCatIdForSub === cat.id ? newSubCatName : ''}
                          onChange={(e) => {
                            setSelectedCatIdForSub(cat.id);
                            setNewSubCatName(e.target.value);
                          }}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubCategorySubmit(cat.id)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                        >
                          + সাব-ক্যাটাগরি
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <ProfileEditModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          user={editingUser}
          onProfileUpdated={(updatedUser) => {
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
            setEditingUser(null);
            fetchAdminData();
            if (updatedUser.id === adminUser.id) {
              localStorage.setItem('mlm_user_session', JSON.stringify(updatedUser));
              window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: updatedUser }));
            }
          }}
          isAdminMode={true}
          loggedInUserId={adminUser.id}
        />
      )}
    </div>
  );
}
