import { useState, useEffect } from 'react';
import { 
  User as UserIcon, Share2, Copy, Check, Users, ShieldCheck, 
  ChevronRight, Calendar, Network, Search, Filter, Phone, Mail, 
  MessageCircle, ExternalLink, Award, Sparkles, UserPlus, Zap, Edit3, ArrowUpRight
} from 'lucide-react';
import { User, DownlineMember, ReferralTreeNode } from '../types.js';
import VisualTree from './VisualTree.js';
import ProfileEditModal from './ProfileEditModal.js';

interface UserDashboardProps {
  user: User;
  onUserUpdated?: (updatedUser: User) => void;
}

export default function UserDashboard({ user, onUserUpdated }: UserDashboardProps) {
  const [downlines, setDownlines] = useState<DownlineMember[]>([]);
  const [tree, setTree] = useState<ReferralTreeNode | null>(null);
  const [sponsor, setSponsor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'tree'>('list');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSponsorCode, setCopiedSponsorCode] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Parse additional_details for profile image display
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

  // Fetch downline & upline sponsor data
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
      setTree(dataDownline.tree || null);

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

  // Referral Link uses mobile number (or user.id fallback)
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

  // WhatsApp share link
  const cleanMobileDigits = user.phone.replace(/\D/g, '');
  const whatsappShareMessage = `Hello! Join Success India Solar Energy Network today. Register using my Sponsor Mobile Number: ${user.phone} (${user.name}). Join Link: ${refLink}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareMessage)}`;

  // Filter Downline members
  const filteredDownlines = downlines.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.id.toString().includes(searchTerm);

    const matchesLevel = 
      selectedLevelFilter === 'all' || 
      member.level === selectedLevelFilter;

    return matchesSearch && matchesLevel;
  });

  // Unique levels for filter options
  const availableLevels = Array.from(new Set(downlines.map((m) => m.level))).sort((a: number, b: number) => a - b);

  // User network stats
  const totalRefs = downlines.length;
  const activeRefs = downlines.filter(m => m.status === 'active').length;
  const inactiveRefs = downlines.filter(m => m.status === 'inactive').length;
  const directRefs = downlines.filter(m => m.level === 1).length;
  const maxLevel = downlines.length > 0 ? Math.max(...downlines.map(m => m.level)) : 0;

  return (
    <div id="user-dashboard-root" className="space-y-6 animate-fade-in">
      
      {/* 1. Ultra-Modern Welcome Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        {/* Subtle decorative solar rays glow */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/4 bottom-0 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Member Profile Overview */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {details?.photo ? (
              <div className="shrink-0 w-20 h-24 bg-white/10 border-2 border-amber-400/50 rounded-2xl p-1 shadow-xl overflow-hidden relative group">
                <img src={details.photo} alt={user.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-indigo-900/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ) : (
              <div className="shrink-0 w-20 h-24 bg-gradient-to-b from-indigo-800 to-slate-900 border-2 border-indigo-400/30 rounded-2xl p-2 flex flex-col items-center justify-center text-indigo-200 shadow-xl">
                <UserIcon className="w-8 h-8 opacity-90 mb-1 text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300 text-center">Passport</span>
              </div>
            )}

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide border shadow-sm ${
                  user.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {user.status === 'active' ? 'Account Active & Verified' : 'Pending Admin Review'}
                </span>
                
                <span className="text-xs font-bold text-indigo-200/90 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  {user.role === 'admin' ? 'System Administrator' : 'Network Member'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {user.name}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-indigo-200/80 font-medium pt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  {user.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1 text-indigo-300">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Joined: {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Edit My Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* Right: Prominent Sponsor ID (Mobile Number) Card */}
          <div className="bg-gradient-to-b from-indigo-900/80 to-slate-900/90 border border-indigo-400/30 rounded-2xl p-4 sm:p-5 shrink-0 backdrop-blur-md flex flex-col justify-between gap-3 min-w-[280px] shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-indigo-800/60 pb-2.5">
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> My Sponsor ID (Mobile)
              </span>
              <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                User ID #{user.id}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <span className="text-[9px] text-indigo-300 font-bold uppercase tracking-wider block">Sponsor Mobile Number</span>
                <span className="text-lg sm:text-xl font-black font-mono tracking-wide text-white block truncate select-all">
                  {sponsorCode}
                </span>
              </div>
              <button
                onClick={copySponsorCode}
                className={`p-2.5 rounded-xl font-bold transition-all shadow-md shrink-0 cursor-pointer ${
                  copiedSponsorCode 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title="Copy Sponsor Mobile Number"
              >
                {copiedSponsorCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-indigo-200/70 font-medium">
              Give your mobile number (<strong className="text-white">{sponsorCode}</strong>) to new members to sign up under your team!
            </p>
          </div>

        </div>
      </div>

      {/* 2. Referral Sharing & Viral Growth Hub */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              Share Your Sponsor Referral Link
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Send your personal referral link to invite team members. Your mobile number (<strong className="text-slate-800">{sponsorCode}</strong>) is automatically locked as their sponsor!
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Share on WhatsApp
            </a>
          </div>
        </div>

        {/* Link Input Bar */}
        <div className="flex flex-col sm:flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 gap-2 hover:border-indigo-300 transition-all">
          <div className="px-3 py-1 flex items-center gap-2 text-slate-400 w-full sm:w-auto truncate flex-1">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-mono font-semibold text-slate-800 truncate select-all">
              {refLink}
            </span>
          </div>

          <button
            onClick={copyReferralLink}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer shrink-0 ${
              copiedLink 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                Referral Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Referral Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. My Upline / Direct Sponsor Card (If exists) */}
      {sponsor && (
        <div className="bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">My Direct Sponsor (Upline)</span>
              <h3 className="text-sm font-black text-slate-900">{sponsor.name}</h3>
              <p className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-0.5">
                <span>Mobile: <strong className="text-slate-900 font-mono">{sponsor.phone}</strong></span>
                <span>•</span>
                <span>ID: #{sponsor.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`tel:${sponsor.phone}`}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              Call Sponsor
            </a>
            <a
              href={`https://api.whatsapp.com/send?phone=${sponsor.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* 4. Global Network Analytics Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm hover:border-indigo-300 transition-all">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Downline</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm hover:border-emerald-300 transition-all">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
            <Check className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Active Members</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm hover:border-amber-300 transition-all">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
            <UserIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Pending Approvals</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{inactiveRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm hover:border-blue-300 transition-all">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
            <UserPlus className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Direct (Level 1)</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{directRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm hover:border-violet-300 transition-all col-span-2 lg:col-span-1">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-2.5">
            <Network className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Network Depth</span>
          <span className="text-2xl font-black text-violet-600 mt-1 block">{maxLevel} Levels</span>
        </div>
      </div>

      {/* 5. Network Downline Explorer (Tabs + Controls + Tables) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-6 flex justify-between items-center flex-wrap gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'list' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Tiered Downline List
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'tree' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-4 h-4 text-violet-600" />
              Interactive Visual Tree
            </button>
          </div>

          <button
            onClick={fetchData}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3.5 py-2 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-indigo-200/60"
          >
            Refresh Downline Data
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium space-y-2">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Loading referral network members, please wait...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs bg-rose-50/50 border-t border-rose-100 font-semibold">
            {error}
          </div>
        ) : activeTab === 'list' ? (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search downline by name, mobile number, email, or ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Level Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                  Filter Level:
                </span>
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    selectedLevelFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All Tiers
                </button>
                {availableLevels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                      selectedLevelFilter === lvl
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Downline List Table */}
            {filteredDownlines.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-extrabold uppercase tracking-wider text-[11px]">
                        <th className="p-4 w-16">ID</th>
                        <th className="p-4">Member Details</th>
                        <th className="p-4">Network Tier</th>
                        <th className="p-4">Sponsor Mobile & Name</th>
                        <th className="p-4">Contact & Actions</th>
                        <th className="p-4">Joined Date</th>
                        <th className="p-4 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                      {filteredDownlines.map((member) => (
                        <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500">#{member.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-900 text-sm">{member.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{member.email}</div>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-3 py-1 rounded-full font-black text-[11px]">
                              Level {member.level}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700">
                            <div className="font-bold text-slate-900">{member.referrer_name || `ID #${member.referrer_id}`}</div>
                            {member.referrer_phone && (
                              <div className="text-[11px] font-mono text-indigo-600 font-semibold">{member.referrer_phone}</div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800">{member.phone}</span>
                              <a
                                href={`https://api.whatsapp.com/send?phone=${member.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`tel:${member.phone}`}
                                className="p-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                                title="Call Member"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {member.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-xl font-black text-[11px]">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-xl font-black text-[11px]">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl py-12 text-center text-slate-500 font-medium space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No downline members found matching your search.</p>
                <p className="text-[11px] text-slate-400">Share your mobile number sponsor code to build your team!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <VisualTree treeData={tree} />
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          if (onUserUpdated) onUserUpdated(updatedUser);
        }}
        isAdminMode={false}
        loggedInUserId={user.id}
      />

    </div>
  );
}
