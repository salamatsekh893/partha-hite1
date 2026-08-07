import { 
  X, LogOut, Shield, User as UserIcon, LayoutDashboard, Phone, Mail, Award, Edit3, 
  ChevronRight, Sparkles, Globe, Network, TrendingUp, ShoppingBag, Gift, DollarSign, 
  FileText, Copy, Check, MessageCircle, Share2, Sun, Zap
} from 'lucide-react';
import { useState } from 'react';
import { User } from '../types.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  isImpersonating?: boolean;
  currentView: 'dashboard' | 'admin' | 'auth';
  currentTab?: 'dashboard' | 'downline' | 'business' | 'products' | 'offers' | 'bonuses' | 'reports';
  setView: (view: 'dashboard' | 'admin', userTab?: 'dashboard' | 'downline' | 'business' | 'products' | 'offers' | 'bonuses' | 'reports', adminTab?: 'members' | 'website' | 'orders' | 'company-fund' | 'products' | 'business-targets') => void;
  onEditProfileClick: () => void;
}

export default function Sidebar({ isOpen, onClose, user, onLogout, isImpersonating, currentView, currentTab = 'dashboard', setView, onEditProfileClick }: SidebarProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!user) return null;

  // Parse user additional_details for profile photo
  let userPhoto: string | null = null;
  try {
    if (user.additional_details) {
      const details = typeof user.additional_details === 'string'
        ? JSON.parse(user.additional_details)
        : user.additional_details;
      userPhoto = details.photo || null;
    }
  } catch (e) {
    console.error("Error parsing user photo in sidebar", e);
  }

  // Referral Link
  const sponsorCode = user.phone;
  const refLink = `${window.location.origin}?ref=${encodeURIComponent(user.phone || user.id)}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappMessage = `HELLO! JOIN SUCCESS INDIA SOLAR ENERGY NETWORK TODAY. REGISTER USING MY DISTRIBUTOR ID (MOBILE NO): ${user.phone} (${user.name}). JOIN LINK: ${refLink}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  // Navigation Items for User (All Labels Bold Capital)
  const userModules = [
    { id: 'dashboard', label: 'DASHBOARD & 12 CARDS', icon: LayoutDashboard, badge: 'OVERVIEW' },
    { id: 'downline', label: 'DOWNLINE NETWORK', icon: Network, badge: 'TEAM TREE' },
    { id: 'business', label: 'BUSINESS & BV GROWTH', icon: TrendingUp, badge: 'BV VOLUME' },
    { id: 'products', label: 'SOLAR PRODUCTS & ORDERS', icon: ShoppingBag, badge: 'CATALOG' },
    { id: 'offers', label: 'OFFERS & REWARDS', icon: Gift, badge: 'ACTIVE' },
    { id: 'bonuses', label: 'BONUS & COMMISSIONS', icon: DollarSign, badge: 'PAYOUTS' },
    { id: 'reports', label: 'REPORTS & STATEMENTS', icon: FileText, badge: 'CSV/PDF' },
  ] as const;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dark Overlay Backdrop */}
      <div 
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <aside 
        className={`absolute top-0 bottom-0 left-0 w-84 max-w-[88vw] bg-white shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out border-r border-indigo-100 rounded-r-3xl overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Banner - Rich Midnight Gradient with Amber Sun */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 relative overflow-hidden shrink-0 border-b border-amber-500/30">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 rounded-full bg-amber-500/15 blur-2xl pointer-events-none"></div>
          <div className="absolute left-10 bottom-0 w-20 h-20 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30 ring-2 ring-amber-300/50 shrink-0">
                <Sun className="w-6 h-6 text-slate-950 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-black text-xs text-white uppercase tracking-wider leading-tight flex items-center gap-1">
                  SUCCESSINDIA SOLAR
                </h3>
                <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                  DISTRIBUTOR MENU
                </span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          
          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 border border-indigo-700/50 shadow-md space-y-3 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-amber-400/10 blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-3 relative z-10">
              <div className="relative shrink-0">
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt={user.name} 
                    className="w-12 h-14 rounded-xl object-cover border-2 border-amber-400 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-14 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex flex-col items-center justify-center font-black shadow-md">
                    <UserIcon className="w-6 h-6 text-slate-950" />
                  </div>
                )}
                <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  user.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
              </div>
              
              <div className="space-y-1 text-left min-w-0 flex-1">
                <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
                  {user.name}
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                    user.role === 'admin' ? 'bg-amber-400 text-slate-950' : 'bg-indigo-500/80 text-white border border-indigo-400/40'
                  }`}>
                    {user.role === 'admin' ? 'ADMIN' : 'DISTRIBUTOR'}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                    user.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {user.status === 'active' ? 'ACTIVE' : 'PENDING'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-amber-300 font-extrabold tracking-wide">
                  ID: {user.phone}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onEditProfileClick();
              }}
              className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-amber-300 font-black text-[11px] uppercase tracking-wider rounded-xl border border-amber-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              EDIT PROFILE INFO
            </button>
          </div>

          {/* User Dashboard Navigation Modules */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1">
                DISTRIBUTOR PORTAL MODULES
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            {userModules.map((mod) => {
              const Icon = mod.icon;
              const isActive = currentView === 'dashboard' && currentTab === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setView('dashboard', mod.id as any);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white shadow-md shadow-indigo-600/25 border-l-4 border-amber-400'
                      : 'text-slate-800 bg-slate-50/80 hover:bg-indigo-50 hover:text-indigo-950 border border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-indigo-600'}`} />
                    <span className="truncate uppercase tracking-wide text-[11px] font-black">{mod.label}</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {mod.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Share Link Section */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-amber-50/60 border border-indigo-200/80 shadow-xs space-y-2.5">
            <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              SPONSOR REFERRAL LINK
            </span>
            <div className="flex gap-2">
              <button
                onClick={copyReferralLink}
                className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  copiedLink 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-98'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'COPIED' : 'COPY LINK'}
              </button>
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                SHARE
              </a>
            </div>
          </div>

          {/* Admin Section (If Admin Role) */}
          {user.role === 'admin' && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block px-1">
                ADMIN PRIVILEGE OPTIONS
              </span>

              <button
                onClick={() => {
                  setView('admin', undefined, 'members');
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ADMIN CONTROL PANEL</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
              </button>

              <button
                onClick={() => {
                  setView('admin', undefined, 'website');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-indigo-950 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>MANAGE WEBSITE (CMS)</span>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-600 text-white">
                  LIVE
                </span>
              </button>
            </div>
          )}

        </div>

        {/* Footer Section */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 shrink-0 space-y-2">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className={`w-full py-2.5 border rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
              isImpersonating 
                ? 'border-amber-400 text-slate-950 bg-amber-400 hover:bg-amber-300' 
                : 'border-rose-200 hover:border-rose-300 text-rose-700 bg-rose-50/80 hover:bg-rose-100/80'
            }`}
          >
            <LogOut className={`w-4 h-4 ${isImpersonating ? 'text-slate-950' : 'text-rose-600'}`} />
            {isImpersonating ? 'RETURN TO ADMIN ID' : 'LOGOUT ACCOUNT'}
          </button>
          
          <div className="text-center text-[10px] text-slate-500 font-black uppercase tracking-wider">
            SUCCESSINDIA SOLAR NETWORK © 2026
          </div>
        </div>
      </aside>
    </div>
  );
}


