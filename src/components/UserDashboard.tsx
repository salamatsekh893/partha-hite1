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
      {/* 1. Welcoming Hero Panel */}
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 -translate-y-10 w-32 h-32 rounded-full bg-indigo-500/10 pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-200 border border-indigo-400/20 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              আপনার আইডি সক্রিয় (Active) রয়েছে
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">স্বাগতম, {user.name}!</h2>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl leading-relaxed">
              এটি আপনার লেভেল রেফারেল ড্যাশবোর্ড। এখান থেকে আপনি আপনার স্পন্সরশিপের অধীনে থাকা সকল মেম্বারদের স্তরভিত্তিক তালিকা এবং ভিজ্যুয়াল নেটওয়ার্ক দেখতে পাবেন।
            </p>
          </div>

          {/* User ID block */}
          <div className="bg-white/10 border border-white/10 rounded-2xl p-4 shrink-0 backdrop-blur-sm">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">আপনার স্পন্সর কোড / ইউজার আইডি</span>
            <span className="text-2xl font-extrabold tracking-wider font-mono mt-0.5 block">{user.id}</span>
          </div>
        </div>
      </div>

      {/* 2. Referral Sharing Component */}
      <div className="bg-white border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row items-center gap-5 justify-between">
        <div className="space-y-1 text-center lg:text-left">
          <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center lg:justify-start gap-1.5">
            <Share2 className="w-4 h-4 text-indigo-600" />
            আপনার রেফারেল লিংকটি শেয়ার করুন:
          </h3>
          <p className="text-xs text-slate-500">
            নতুন কাওকে একাউন্ট রেজিস্ট্রেশন করার সময় আপনার কোড দিন, অথবা নিচের লিংকটি ব্যবহার করে সরাসরি জয়েন করান।
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
                কপি হয়েছে
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                লিংক কপি করুন
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
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">মোট ডাউনলাইন</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalRefs} জন</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">সক্রিয় মেম্বার (Active)</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeRefs} জন</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">নিষ্ক্রিয় মেম্বার (Pending)</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{inactiveRefs} জন</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-slate-500 font-semibold block uppercase">নেটওয়ার্কের গভীরতা</span>
          <span className="text-2xl font-black text-violet-600 mt-1 block">{maxLevel} লেভেল</span>
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
              স্তরভিত্তিক তালিকা ভিউ
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
              ভিজুয়াল ট্রি ম্যাপ
            </button>
          </div>

          <button
            onClick={fetchDownline}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-bold px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
          >
            ডাটা রিফ্রেশ করুন
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            রেফারেল ডাটা লোড হচ্ছে, দয়া করে অপেক্ষা করুন...
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
                  placeholder="নাম, আইডি, ইমেইল বা মোবাইল দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Level Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3" />
                  লেভেল ফিল্টার:
                </span>
                <button
                  onClick={() => setSelectedLevelFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedLevelFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  সব লেভেল
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
                    লেভেল {lvl}
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
                        <th className="p-4 w-16">আইডি</th>
                        <th className="p-4">মেম্বার নাম</th>
                        <th className="p-4">লেভেল</th>
                        <th className="p-4">স্পন্সর করেছেন</th>
                        <th className="p-4">যোগাযোগ</th>
                        <th className="p-4">যোগদানের তারিখ</th>
                        <th className="p-4 w-28 text-center">স্টেটাস</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredDownlines.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-600">#{member.id}</td>
                          <td className="p-4 font-bold text-slate-900">{member.name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                              লেভেল {member.level}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
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
                          <td className="p-4 text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{new Date(member.created_at).toLocaleDateString('bn-BD')}</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {member.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                                সক্রিয় (Active)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg font-bold">
                                নিষ্ক্রিয় (Pending)
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
              <div className="bg-slate-50 border border-slate-100 rounded-2xl py-12 text-center text-slate-500">
                কোন রেফারেল মেম্বার খুঁজে পাওয়া যায়নি।
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
