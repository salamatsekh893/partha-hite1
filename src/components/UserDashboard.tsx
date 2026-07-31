import { useState, useEffect } from 'react';
import { 
  User as UserIcon, Share2, Copy, Check, Users, ShieldCheck, 
  ChevronRight, Calendar, Network, Search, Filter, Phone, Mail 
} from 'lucide-react';
import { User, DownlineMember, ReferralTreeNode } from '../types.js';
import VisualTree from './VisualTree.js';

interface UserDashboardProps {
  user: User;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [downlines, setDownlines] = useState<DownlineMember[]>([]);
  const [tree, setTree] = useState<ReferralTreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'tree'>('list');
  const [copied, setCopied] = useState(false);

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

  // Fetch downline data
  const fetchDownline = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/downline', {
        headers: {
          'X-User-Id': user.id.toString(),
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ডাউনলাইন ডাটা লোড করতে সমস্যা হয়েছে।');
      }
      setDownlines(data.flatList || []);
      setTree(data.tree || null);
    } catch (err: any) {
      setError(err.message || 'সার্ভার সংযোগে ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownline();
  }, [user.id]);

  // Generate Referral Link
  const refLink = `${window.location.origin}?ref=${user.id}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // Calculate unique levels present for filter options
  const availableLevels = Array.from(new Set(downlines.map((m) => m.level))).sort((a: number, b: number) => a - b);

  // Calculate user stats
  const totalRefs = downlines.length;
  const activeRefs = downlines.filter(m => m.status === 'active').length;
  const inactiveRefs = downlines.filter(m => m.status === 'inactive').length;
  const maxLevel = downlines.length > 0 ? Math.max(...downlines.map(m => m.level)) : 0;

  return (
    <div id="user-dashboard-root" className="space-y-6">
      {/* 1. Compact & Beautiful Welcoming Hero Panel */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-4 shadow-lg shadow-indigo-950/20 border border-indigo-700/30 relative overflow-hidden">
        {/* Subtle decorative glow elements */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-500/15 blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            {details?.photo ? (
              <div className="shrink-0 w-14 h-16 bg-white/10 border border-white/20 rounded-xl p-0.5 shadow-md overflow-hidden">
                <img src={details.photo} alt="Your Passport Photo" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="shrink-0 w-14 h-16 bg-indigo-700/60 border border-indigo-400/30 rounded-xl p-1 flex flex-col items-center justify-center text-indigo-200 shadow-inner">
                <UserIcon className="w-6 h-6 opacity-80 mb-0.5" />
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-indigo-300 text-center leading-none">Photo</span>
              </div>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide border shadow-sm ${
                  user.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {user.status === 'active' ? 'Account Active' : 'Pending Activation'}
                </span>
                <span className="text-[11px] font-semibold text-indigo-200/80 bg-white/10 px-2 py-0.5 rounded-md">
                  {user.role === 'admin' ? 'System Administrator' : 'Referral Member'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Welcome, {user.name}!</h2>
              <p className="text-xs text-indigo-100/80 max-w-xl leading-normal font-medium hidden sm:block">
                Level-based referral dashboard. Monitor downline tiers and track network growth.
              </p>
            </div>
          </div>

          {/* User ID block */}
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 shrink-0 backdrop-blur-sm self-start sm:self-auto flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:gap-0 min-w-[130px]">
            <span className="text-[10px] text-indigo-200/90 font-bold uppercase tracking-wider block">Sponsor ID</span>
            <span className="text-xl font-black tracking-wider font-mono text-white block">#{user.id}</span>
          </div>
        </div>
      </div>

      {/* 2. Referral Sharing Component */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row items-center gap-5 justify-between">
        <div className="space-y-1 text-center lg:text-left">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center lg:justify-start gap-1.5">
            <Share2 className="w-4 h-4 text-indigo-600" />
            Share your referral link:
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Distribute your unique sponsor link or give your User ID to new sign-ups to automatically attach them to your network.
          </p>
        </div>

        <div className="flex w-full lg:max-w-xl items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 pl-3.5 gap-2 group hover:bg-slate-100/50 hover:border-slate-300 transition-all">
          <span className="text-xs font-mono text-indigo-950 truncate select-all flex-1">{refLink}</span>
          <button
            onClick={copyReferralLink}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm shrink-0 cursor-pointer ${
              copied 
                ? 'bg-emerald-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Global Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Total Downline</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Active Members</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Pending Members</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{inactiveRefs} members</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">Network Depth</span>
          <span className="text-2xl font-black text-violet-600 mt-1 block">{maxLevel} Levels</span>
        </div>
      </div>

      {/* 4. Tab Navigation and Content */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center flex-wrap gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Tiered Downline List
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tree' 
                  ? 'bg-white text-slate-950 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Interactive Network Tree
            </button>
          </div>

          <button
            onClick={fetchDownline}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
          >
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading referral network data, please wait...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs bg-rose-50/50 border-t border-rose-100">
            {error}
          </div>
        ) : activeTab === 'list' ? (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, ID, email, or phone..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                />
              </div>

              {/* Level Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3" />
                  Level Filter:
                </span>
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedLevelFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  All Levels
                </button>
                {availableLevels.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelFilter(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedLevelFilter === lvl
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table */}
            {filteredDownlines.length > 0 ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                        <th className="p-4 w-16">ID</th>
                        <th className="p-4">Member Name</th>
                        <th className="p-4">Level</th>
                        <th className="p-4">Sponsor</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">Date Joined</th>
                        <th className="p-4 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-medium">
                      {filteredDownlines.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-600">#{member.id}</td>
                          <td className="p-4 font-bold text-slate-900">{member.name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                              Level {member.level}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold">
                            {member.referrer_name || `ID: ${member.referrer_id}`}
                          </td>
                          <td className="p-4 space-y-1">
                            <div className="flex items-center gap-1 text-slate-700">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="font-semibold">{member.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{member.email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-semibold">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {member.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg font-bold">
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
              <div className="bg-slate-50 border border-slate-100 rounded-2xl py-12 text-center text-slate-500 font-medium">
                No downline members found matching your filters.
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <VisualTree treeData={tree} />
          </div>
        )}
      </div>
    </div>
  );
}
