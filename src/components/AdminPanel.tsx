import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, RefreshCw, 
  Calendar, Shield, ShieldCheck, UserCheck, AlertCircle, Phone, Mail, Network 
} from 'lucide-react';
import { User, SystemStats, ReferralTreeNode } from '../types.js';
import VisualTree from './VisualTree.js';

interface AdminPanelProps {
  adminUser: User;
}

export default function AdminPanel({ adminUser }: AdminPanelProps) {
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Inspect specific user's tree
  const [inspectingUser, setInspectingUser] = useState<Omit<User, 'password'> | null>(null);
  const [inspectedTree, setInspectedTree] = useState<ReferralTreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);

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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'এডমিন ডাটা লোড করতে ব্যর্থ হয়েছে।');
      }
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message || 'সার্ভার সংযোগে ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminUser.id]);

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
        throw new Error(data.error || 'এপ্রুভাল সম্পূর্ণ করা সম্ভব হয়নি।');
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
        throw new Error(data.error || 'ডিএক্টিভেশন সম্পূর্ণ করা সম্ভব হয়নি।');
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

  // Inspect any user's downline tree
  const handleInspectTree = async (userObj: Omit<User, 'password'>) => {
    setInspectingUser(userObj);
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
      {/* 1. Admin Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-200 border border-amber-400/20 px-3 py-1 rounded-full text-xs font-semibold">
              <Shield className="w-4 h-4 text-amber-400 animate-pulse" />
              সিস্টেম এডমিনিস্ট্রেটর মোড
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">এডমিন কন্ট্রোল প্যানেল</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              সদস্যদের নিবন্ধন অনুমোদন (Approval) করুন, ডাটা চেক করুন, এবং রিকোর্সিভ চেইনের মাধ্যমে সম্পূর্ণ নেটওয়ার্ক মনিটর করুন।
            </p>
          </div>
          
          <button
            onClick={fetchAdminData}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-700 hover:border-slate-600 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-all shadow-md self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ডাটা রিফ্রেশ করুন
          </button>
        </div>
      </div>

      {/* 2. Global Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center mb-3">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">মোট নিবন্ধিত</span>
            <span className="text-2xl font-black text-slate-950 mt-1 block">{stats.totalUsers} জন</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">সক্রিয় সদস্য (Active)</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{stats.activeUsers} জন</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">অপেক্ষমাণ (Pending)</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">{stats.inactiveUsers} জন</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Network className="w-4 h-4" />
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block uppercase">সিস্টেম গভীরতা</span>
            <span className="text-2xl font-black text-indigo-600 mt-1 block">{stats.maxLevelsDeep} লেভেল</span>
          </div>
        </div>
      )}

      {/* Action Notification banners */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-emerald-800 text-xs shadow-sm leading-relaxed">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <div>
            <span className="font-bold">সফল অ্যাকশন:</span> {successMsg}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-800 text-xs shadow-sm leading-relaxed">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <div>
            <span className="font-bold">ব্যর্থতা:</span> {error}
          </div>
        </div>
      )}

      {/* 3. Member Directory Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">সদস্য ডিরেক্টরি ({filteredUsers.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">নিবন্ধিত সকল সদস্যের তালিকা ও এপ্রুভাল পরিচালনা করুন</p>
            </div>

            {/* Status filters */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] self-start md:self-auto font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                সব সদস্য
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                সক্রিয় (Active)
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'inactive' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                অপেক্ষমাণ (Pending)
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
              placeholder="নাম, আইডি, ইমেইল বা মোবাইল দিয়ে মেম্বার খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">ডাটা লোড হচ্ছে...</div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="p-4 w-16">আইডি</th>
                  <th className="p-4">নাম</th>
                  <th className="p-4">যোগাযোগ তথ্য</th>
                  <th className="p-4">স্পন্সর করেছেন</th>
                  <th className="p-4">তারিখ</th>
                  <th className="p-4 w-28 text-center">স্টেটাস</th>
                  <th className="p-4 w-52 text-right">পদক্ষেপ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-600">#{userItem.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{userItem.name}</div>
                      <div className="mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          userItem.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {userItem.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{userItem.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{userItem.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {userItem.referrer_id ? (
                        <span className="bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          সদস্য #{userItem.referrer_id}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">কেউ না (সিস্টেম রুট)</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(userItem.created_at).toLocaleDateString('bn-BD')}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {userItem.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                          সক্রিয় (Active)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg font-bold">
                          অপেক্ষমাণ (Pending)
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View downline network map */}
                      <button
                        onClick={() => handleInspectTree(userItem)}
                        title="নেটওয়ার্ক ভিজ্যুয়ালাইজার ওপেন করুন"
                        className="inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                      >
                        <Network className="w-4 h-4" />
                      </button>

                      {/* Approve / Suspend toggler */}
                      {userItem.role !== 'admin' && (
                        userItem.status === 'inactive' ? (
                          <button
                            onClick={() => handleApprove(userItem.id)}
                            disabled={actionLoading === userItem.id}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
                          >
                            {actionLoading === userItem.id ? 'প্রসেসিং...' : 'এপ্রুভ করুন'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(userItem.id)}
                            disabled={actionLoading === userItem.id}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 text-rose-700 font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            {actionLoading === userItem.id ? 'প্রসেসিং...' : 'নিষ্ক্রিয় করুন'}
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-500">
            খুঁজে পাওয়া যায়নি।
          </div>
        )}
      </div>

      {/* 4. Sub-tree inspection modal/container */}
      {inspectingUser && (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900">
                নেটওয়ার্ক ম্যাপ অডিট: <span className="text-indigo-600 font-black">{inspectingUser.name}</span> (ID #{inspectingUser.id})
              </h4>
              <p className="text-xs text-slate-500">এই মেম্বারের সম্পূর্ণ অর্গানাইজেশন চার্ট চেক করুন</p>
            </div>
            <button
              onClick={() => {
                setInspectingUser(null);
                setInspectedTree(null);
              }}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-bold text-slate-800 transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>

          {treeLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">রিকোর্সিভ মেম্বার ট্রি লোড হচ্ছে...</div>
          ) : (
            <VisualTree treeData={inspectedTree} />
          )}
        </div>
      )}
    </div>
  );
}
