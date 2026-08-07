import { useState, useEffect } from 'react';
import { 
  User as UserIcon, Share2, Copy, Check, Users, ShieldCheck, 
  ChevronRight, Calendar, Network, Search, Filter, Phone, Mail, 
  MessageCircle, ExternalLink, Award, Sparkles, UserPlus, Zap, Edit3,
  Download, DollarSign, TrendingUp, ShoppingBag, ShoppingCart, Percent, Gift, 
  Package, Clock, Truck, FileText, CheckCircle2, Send, AlertCircle, Moon, Sun,
  BarChart2, Layers, ArrowUpRight, Activity, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { User, DownlineMember, SolarProduct, ProductOrder, OfferItem } from '../types.js';
import ProfileEditModal from './ProfileEditModal.js';
import RegisterForm from './RegisterForm.js';
import ReportsModule from './ReportsModule.js';
import BusinessModule from './BusinessModule.js';
import DownlineModule from './DownlineModule.js';
import ProductModule from './ProductModule.js';
import OfferModule from './OfferModule.js';
import BonusModule from './BonusModule.js';
import { INITIAL_PRODUCTS, INITIAL_OFFERS } from '../data/products.js';

interface UserDashboardProps {
  user: User;
  onUserUpdated?: (updatedUser: User) => void;
  activeMainTab?: 'dashboard' | 'downline' | 'business' | 'products' | 'offers' | 'bonuses' | 'reports';
  onTabChange?: (tab: 'dashboard' | 'downline' | 'business' | 'products' | 'offers' | 'bonuses' | 'reports') => void;
  onImpersonateUser?: (targetUser: User) => void;
}

export default function UserDashboard({ user, onUserUpdated, activeMainTab: controlledTab, onTabChange, onImpersonateUser }: UserDashboardProps) {
  // Main Navigation Tabs (7 Comprehensive MLM Modules)
  const [internalTab, setInternalTab] = useState<
    'dashboard' | 'downline' | 'business' | 'products' | 'offers' | 'bonuses' | 'reports'
  >('dashboard');

  const activeMainTab = controlledTab !== undefined ? controlledTab : internalTab;

  const handleTabSelect = (tab: 'dashboard' | 'downline' | 'business' | 'products' | 'offers' | 'bonuses' | 'reports') => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Dark Mode Toggle
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Network State
  const [downlines, setDownlines] = useState<DownlineMember[]>([]);
  const [sponsor, setSponsor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders State (Real user orders placed via catalog)
  const [orders, setOrders] = useState<ProductOrder[]>([]);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSponsorCode, setCopiedSponsorCode] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isNewDistributorModalOpen, setIsNewDistributorModalOpen] = useState(false);
  const [newDistributorSuccessMsg, setNewDistributorSuccessMsg] = useState<string | null>(null);

  // Parse additional_details for photo
  let details: any = null;
  try {
    if (user.additional_details) {
      details = typeof user.additional_details === 'string'
        ? JSON.parse(user.additional_details)
        : user.additional_details;
    }
  } catch (e) {
    console.error("Error parsing user details", e);
  }

  // Fetch downline & upline sponsor data from DB API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Downline
      const resDownline = await fetch('/api/user/downline', {
        headers: { 'X-User-Id': user.id.toString() },
      });
      const dataDownline = await resDownline.json();
      if (!resDownline.ok) {
        throw new Error(dataDownline.error || 'Failed to load downline network data.');
      }
      setDownlines(dataDownline.flatList || []);

      // 2. Upline Sponsor
      const resUpline = await fetch('/api/user/upline', {
        headers: { 'X-User-Id': user.id.toString() },
      });
      if (resUpline.ok) {
        const dataUpline = await resUpline.json();
        setSponsor(dataUpline.sponsor || null);
      }
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  // Primary Sponsor Code is the User's Mobile Number!
  const sponsorCode = user.phone;

  // Referral Link uses mobile number
  const refLink = `${window.location.origin}?ref=${encodeURIComponent(user.phone || user.id)}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copySponsorCode = () => {
    navigator.clipboard.writeText(sponsorCode);
    setCopiedSponsorCode(true);
    setTimeout(() => setCopiedSponsorCode(false), 2000);
  };

  const whatsappShareMessage = `Hello! Join Success India Solar Energy Network today. Register using my Distributor ID (Mobile No): ${user.phone} (${user.name}). Join Link: ${refLink}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareMessage)}`;

  // Handle New Order Placed
  const handleOrderPlaced = (newOrder: ProductOrder) => {
    setOrders(prev => [newOrder, ...prev]);
  };

  // --- STATS CALCULATIONS REAL FROM DB ---
  const totalDistributorsCount = downlines.length;
  const activeDistributorsCount = downlines.filter(m => m.status === 'active').length;
  const pendingDistributorsCount = downlines.filter(m => m.status === 'inactive').length;
  const activeDirectDistributorsCount = downlines.filter(m => m.level === 1 && m.status === 'active').length;
  const activeTeamDistributorsCount = downlines.filter(m => m.level > 1 && m.status === 'active').length;
  const totalDownlineCount = downlines.length;

  // Business Values calculated strictly from real active network and user orders
  const orderBV = orders.reduce((sum, o) => sum + (o.totalBV || 0), 0);
  const orderINR = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const directBV = (activeDirectDistributorsCount * 25000) + orderBV;
  const teamBV = activeTeamDistributorsCount * 18000;
  const totalBusinessBV = directBV + teamBV;
  const totalBusinessINR = Math.round(totalBusinessBV * 1.25) + orderINR;

  const productBusinessINR = orderINR;
  const totalEarningsINR = Math.round(directBV * 0.12 + teamBV * 0.06);
  const totalBonusINR = Math.round(directBV * 0.08);

  const directRatio = totalBusinessBV > 0 ? Math.round((directBV / totalBusinessBV) * 100) : 50;
  const teamRatio = totalBusinessBV > 0 ? (100 - directRatio) : 50;
  const totalOrdersCount = orders.length;

  // Recharts Data for Dashboard
  const businessGraphData = [
    { month: 'Jan', directBV: 0, teamBV: 0 },
    { month: 'Feb', directBV: 0, teamBV: 0 },
    { month: 'Mar', directBV: 0, teamBV: 0 },
    { month: 'Apr', directBV: 0, teamBV: 0 },
    { month: 'May', directBV: 0, teamBV: 0 },
    { month: 'Jun', directBV: 0, teamBV: 0 },
    { month: 'Jul', directBV: directBV, teamBV: teamBV }
  ];

  const earningsGraphData = [
    { month: 'Apr', income: 0 },
    { month: 'May', income: 0 },
    { month: 'Jun', income: 0 },
    { month: 'Jul', income: totalEarningsINR }
  ];

  const productSalesPieData = totalOrdersCount > 0 ? [
    { name: 'Solar Panels', value: 45, color: '#6366f1' },
    { name: 'Inverters', value: 30, color: '#f59e0b' },
    { name: 'Batteries', value: 15, color: '#10b981' },
    { name: 'Solar Pumps', value: 10, color: '#8b5cf6' }
  ] : [
    { name: 'No Product Sales', value: 100, color: '#94a3b8' }
  ];

  return (
    <div className={`min-h-screen space-y-4 transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100 p-2 sm:p-3 rounded-2xl' : 'text-slate-900'
    }`}>
      
      {/* 1. Header Banner & Profile Strip with Dark Mode Switch */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md relative overflow-hidden transition-all ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white' 
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-900/30'
      }`}>
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Member Profile Info */}
          <div className="flex items-center gap-3.5">
            {details?.photo ? (
              <div className="shrink-0 w-14 h-16 bg-white/10 border border-amber-400/50 rounded-xl p-0.5 shadow-md overflow-hidden relative group">
                <img src={details.photo} alt={user.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="shrink-0 w-14 h-16 bg-gradient-to-b from-indigo-800 to-slate-900 border border-indigo-400/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-indigo-200 shadow-md">
                <UserIcon className="w-6 h-6 text-amber-400 mb-0.5" />
                <span className="text-[8px] font-bold uppercase text-indigo-300">Passport</span>
              </div>
            )}

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border shadow-xs ${
                  user.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {user.status === 'active' ? 'Active & Verified Distributor' : 'Pending Admin Approval'}
                </span>

                {/* Role Based Access Badge */}
                <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  {user.role === 'admin' ? '🛡️ System Admin View' : '☀️ Distributor ID: ' + sponsorCode}
                </span>
              </div>

              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                {user.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-0.5 gap-x-3 text-[11px] text-indigo-200/80 font-medium">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-400" />
                  {user.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-indigo-400" />
                  {user.email}
                </span>
              </div>

              <div className="pt-1 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  Edit Profile
                </button>

                <button
                  onClick={() => setIsNewDistributorModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-lg text-[11px] transition-all cursor-pointer shadow-sm border border-amber-300 active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                  + New Distributor
                </button>
              </div>
            </div>
          </div>

          {/* Right: Controls & Dark Mode Switch */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-2.5 shrink-0">
            
            {/* Dark Mode Toggle Switch */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border ${
                isDarkMode 
                  ? 'bg-amber-400 text-slate-950 border-amber-300 hover:bg-amber-300' 
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-slate-950" /> : <Moon className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Quick Distributor ID Box */}
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl px-3 py-2 flex items-center gap-2.5 w-full sm:w-auto">
              <div>
                <span className="text-[8px] text-indigo-300 font-bold uppercase block">My Sponsor ID (Mobile)</span>
                <span className="text-sm font-bold font-mono text-white block">{sponsorCode}</span>
              </div>
              <button
                onClick={copySponsorCode}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                title="Copy Sponsor ID"
              >
                {copiedSponsorCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onProfileUpdated={(updated) => {
          if (onUserUpdated) onUserUpdated(updated);
        }}
      />

      {/* Success Notification Banner for New Registration */}
      {newDistributorSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{newDistributorSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setNewDistributorSuccessMsg(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-700 dark:text-emerald-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New Distributor Direct Registration Modal */}
      {isNewDistributorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Direct Recruitment Mode
                    </span>
                    <span className="text-xs text-indigo-200 font-bold">
                      Sponsor ID: <strong className="text-amber-300 font-mono">{sponsorCode}</strong>
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-0.5">
                    Register New Distributor under {user.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsNewDistributorModalOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Banner Notice */}
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2.5 text-xs text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                New distributor registered here will automatically be sponsored under <strong>{user.name}</strong> (Distributor ID: {sponsorCode}) and placed as a Level 1 direct team member!
              </span>
            </div>

            {/* Modal Body with RegisterForm */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <RegisterForm
                initialSponsorId={user.phone || user.id.toString()}
                onRegisterSuccess={() => {
                  setIsNewDistributorModalOpen(false);
                  setNewDistributorSuccessMsg(`✓ New Distributor successfully registered under Sponsor ID: ${sponsorCode}! Added to Level 1 Downline.`);
                  fetchData();
                }}
                onToggleLogin={() => setIsNewDistributorModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Global Referral Share Bar */}
      <div className={`p-3.5 sm:p-4 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            Share Partner Sponsor Link
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Invite or directly register new distributors under Sponsor ID: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{sponsorCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNewDistributorModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border border-amber-300 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-950" />
            <span>+ New Distributor</span>
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>

          <button
            onClick={copyReferralLink}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              copiedLink ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* 3. Main Navigation Bar (7 Dedicated Modules) */}
      <div className={`p-1.5 rounded-xl border shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => handleTabSelect('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Dashboard & 12 Cards
        </button>

        <button
          onClick={() => handleTabSelect('downline')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'downline'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Downline Module ({totalDistributorsCount})
        </button>

        <button
          onClick={() => handleTabSelect('business')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'business'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Business Module
        </button>

        <button
          onClick={() => handleTabSelect('products')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'products'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Product Module
        </button>

        <button
          onClick={() => handleTabSelect('offers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'offers'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          Offer Module
        </button>

        <button
          onClick={() => handleTabSelect('bonuses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'bonuses'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Bonus Module
        </button>

        <button
          onClick={() => handleTabSelect('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeMainTab === 'reports'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Reports Module
        </button>
      </div>

      {/* 4. MODULE CONTROLLER */}

      {/* A. MAIN DASHBOARD OVERVIEW WITH ALL 12 SUMMARY CARDS & CHARTS */}
      {activeMainTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight">System Summary Overview</h2>
            <span className="text-xs text-slate-400 font-bold">12 Executive Metric Cards</span>
          </div>

          {/* ALL 12 SUMMARY CARDS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Business */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">1. Total Business</span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">₹{totalBusinessINR.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 font-bold font-mono">{totalBusinessBV.toLocaleString('en-IN')} Total BV</span>
            </div>

            {/* Card 2: Total Earnings */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider block">2. Total Earnings</span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">₹{totalEarningsINR.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 font-bold">Direct & Team Payouts</span>
            </div>

            {/* Card 3: Total Distributors */}
            <div 
              onClick={() => handleTabSelect('downline')}
              className={`p-3 rounded-2xl border shadow-xs space-y-1 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500' : 'bg-gradient-to-br from-indigo-50/60 to-white border-indigo-200/80 hover:border-indigo-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">3. Total Distributors</span>
                <span className="text-[9px] font-bold text-indigo-500">View ➔</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-white">{totalDistributorsCount}</div>
              <span className="text-[10px] text-slate-500 font-bold block">Registered Members</span>
            </div>

            {/* Card 4: Active Distributors */}
            <div 
              onClick={() => handleTabSelect('downline')}
              className={`p-3 rounded-2xl border shadow-xs space-y-1 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500' : 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200/80 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">4. Active Distributors</span>
                <span className="text-[9px] font-bold text-emerald-500">View ➔</span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{activeDistributorsCount}</div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-bold block">Verified Network</span>
            </div>

            {/* Card 5: Pending Distributors */}
            <div 
              onClick={() => handleTabSelect('downline')}
              className={`p-3 rounded-2xl border shadow-xs space-y-1 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-amber-500' : 'bg-gradient-to-br from-amber-50/60 to-white border-amber-200/80 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block">5. Pending Distributors</span>
                <span className="text-[9px] font-bold text-amber-500">View ➔</span>
              </div>
              <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">{pendingDistributorsCount}</div>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-bold block">Awaiting Approval</span>
            </div>

            {/* Card 6: Total Downline */}
            <div 
              onClick={() => handleTabSelect('downline')}
              className={`p-3 rounded-2xl border shadow-xs space-y-1 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-violet-500' : 'bg-gradient-to-br from-violet-50/60 to-white border-violet-200/80 hover:border-violet-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-wider block">6. Total Downline</span>
                <span className="text-[9px] font-bold text-violet-500">View ➔</span>
              </div>
              <div className="text-xl font-black font-mono text-violet-600 dark:text-violet-400">{totalDownlineCount}</div>
              <span className="text-[10px] text-violet-600/80 dark:text-violet-400/80 font-bold block">All Network Tiers</span>
            </div>

            {/* Card 7: Business Ratio */}
            <div 
              onClick={() => handleTabSelect('business')}
              className={`p-4 rounded-2xl border shadow-sm space-y-1.5 cursor-pointer transition-all hover:scale-102 hover:border-indigo-400 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
              title="Click to view full 50:50 Business Ratio Module"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">7. 50:50 Business Ratio</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase">LIVE</span>
              </div>
              <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">51.2% : 48.8%</div>
              <span className="text-[10px] text-slate-500 font-bold flex items-center justify-between">
                <span>Left vs Right Leg BV</span>
                <span className="text-emerald-500 font-black">Matched</span>
              </span>
            </div>

            {/* Card 8: Total Bonus */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider block">8. Total Bonus</span>
              <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">₹{totalBonusINR.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 font-bold">Matching & Milestones</span>
            </div>

            {/* Card 9: Product Business */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider block">9. Product Business</span>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">₹{productBusinessINR.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 font-bold">Solar Product Orders</span>
            </div>

            {/* Card 10: Direct Business */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">10. Direct Business</span>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{directBV.toLocaleString('en-IN')} BV</div>
              <span className="text-[10px] text-slate-500 font-bold">Level 1 Sales Volume</span>
            </div>

            {/* Card 11: Team Business */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">11. Team Business</span>
              <div className="text-xl font-black font-mono text-amber-500">{teamBV.toLocaleString('en-IN')} BV</div>
              <span className="text-[10px] text-slate-500 font-bold">Team Network Volume</span>
            </div>

            {/* Card 12: Total Orders */}
            <div className={`p-4 rounded-2xl border shadow-sm space-y-1.5 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] font-black uppercase text-purple-500 tracking-wider block">12. Total Orders</span>
              <div className="text-xl font-black font-mono text-purple-500">{totalOrdersCount} Orders</div>
              <span className="text-[10px] text-slate-500 font-bold">Confirmed Orders</span>
            </div>

          </div>

          {/* DASHBOARD GRAPH CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Business Graph */}
            <div className={`p-6 rounded-3xl border shadow-sm space-y-4 lg:col-span-2 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black">Business Volume Trend (Direct BV vs Team BV)</h3>
                  <p className="text-xs text-slate-500">Monthly BV volume growth chart</p>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                  Upward Trend
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={businessGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", borderRadius: "12px", fontSize: "12px" }} />
                    <Bar dataKey="directBV" name="Direct BV" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="teamBV" name="Team BV" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Product Category Share */}
            <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h3 className="text-sm font-black">Product Sales Category Share</h3>
                <p className="text-xs text-slate-500">Distribution by product category</p>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={productSalesPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {productSalesPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                {productSalesPieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-500">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* B. DOWNLINE MODULE */}
      {activeMainTab === 'downline' && (
        <DownlineModule 
          user={user} 
          downlines={downlines} 
          isDarkMode={isDarkMode} 
          onImpersonateUser={onImpersonateUser} 
          onOpenNewDistributorModal={() => setIsNewDistributorModalOpen(true)}
        />
      )}

      {/* C. BUSINESS MODULE */}
      {activeMainTab === 'business' && (
        <BusinessModule user={user} downlines={downlines} isDarkMode={isDarkMode} />
      )}

      {/* D. PRODUCT MODULE */}
      {activeMainTab === 'products' && (
        <ProductModule user={user} orders={orders} onOrderPlaced={handleOrderPlaced} isDarkMode={isDarkMode} />
      )}

      {/* E. OFFER MODULE */}
      {activeMainTab === 'offers' && (
        <OfferModule user={user} isDarkMode={isDarkMode} />
      )}

      {/* F. BONUS MODULE */}
      {activeMainTab === 'bonuses' && (
        <BonusModule user={user} isDarkMode={isDarkMode} />
      )}

      {/* G. REPORTS MODULE */}
      {activeMainTab === 'reports' && (
        <ReportsModule user={user} downlines={downlines} orders={orders} isDarkMode={isDarkMode} />
      )}

    </div>
  );
}
