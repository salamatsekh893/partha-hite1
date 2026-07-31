import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Search, RefreshCw, 
  Calendar, Shield, ShieldCheck, UserCheck, AlertCircle, Phone, Mail, Network, FileText, Trash2, Edit
} from 'lucide-react';
import { User, SystemStats, ReferralTreeNode } from '../types.js';
import VisualTree from './VisualTree.js';
import ProfileEditModal from './ProfileEditModal.js';

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

  useEffect(() => {
    fetchAdminData();
  }, [adminUser.id]);

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

  // Custom sweet confirmation state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: number, name: string } | null>(null);

  // Trigger modal confirmation popup
  const handleDelete = (userId: number, userName: string) => {
    setDeleteConfirmUser({ id: userId, name: userName });
  };

  // Actual execution of Delete / Reject
  const executeDelete = async () => {
    if (!deleteConfirmUser) return;
    const { id: userId, name: userName } = deleteConfirmUser;

    setActionLoading(userId);
    setError(null);
    setSuccessMsg(null);
    setDeleteConfirmUser(null); // Close modal
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
      setSuccessMsg(data.message || `${userName} has been deleted successfully.`);
      
      // If currently auditing or inspecting this user, clear it
      if (auditingUser?.id === userId) {
        setAuditingUser(null);
      }
      if (inspectingUser?.id === userId) {
        setInspectingUser(null);
        setInspectedTree(null);
      }

      // Update local state by removing user completely
      setUsers(prev => prev.filter(u => u.id !== userId));
      fetchAdminData(); // Refetch to accurately update stats and recursive tree paths
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
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
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-4 shadow-lg shadow-indigo-950/20 border border-indigo-700/30 relative overflow-hidden">
        {/* Subtle decorative glow elements */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-purple-500/15 blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-indigo-400/10 blur-xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide backdrop-blur-sm shadow-sm">
                <Shield className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                SYSTEM ADMIN
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Admin Control Panel</h2>
            </div>
            <p className="text-xs text-indigo-100/80 max-w-2xl leading-normal font-medium">
              Approve registrations, inspect active member counts, and monitor the multi-level referral network depth.
            </p>
          </div>
          
          <button
            onClick={fetchAdminData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-white/20 hover:border-white/40 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer backdrop-blur-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 2. Global Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white border border-slate-200/80 hover:border-indigo-300/80 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-2.5">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Registered</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">{stats.totalUsers} <span className="text-xs font-semibold text-slate-500">members</span></span>
          </div>

          <div className="bg-white border border-slate-200/80 hover:border-emerald-300/80 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Members</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5 block">{stats.activeUsers} <span className="text-xs font-semibold text-emerald-600/70">members</span></span>
          </div>

          <div className="bg-white border border-slate-200/80 hover:border-amber-300/80 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pending Approval</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5 block">{stats.inactiveUsers} <span className="text-xs font-semibold text-amber-600/70">members</span></span>
          </div>

          <div className="bg-white border border-slate-200/80 hover:border-indigo-300/80 rounded-2xl p-4 text-left shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
              <Network className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">System Depth</span>
            <span className="text-xl sm:text-2xl font-black text-indigo-600 mt-0.5 block">{stats.maxLevelsDeep} <span className="text-xs font-semibold text-indigo-600/70">Levels</span></span>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Member Directory ({filteredUsers.length})</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage registered accounts, pending activations, or membership status</p>
            </div>

            {/* Status filters */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-[11px] self-start md:self-auto font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                All Members
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
              placeholder="Search members by name, ID, email, or phone..."
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
                  <th className="p-4 w-16">ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Sponsor</th>
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
                      <td className="p-4 font-mono font-bold text-slate-600">#{userItem.id}</td>
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
                                userItem.role === 'admin' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {userItem.role === 'admin' ? 'Admin' : 'Member'}
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
                          Member #{userItem.referrer_id}
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

      {/* Sweet Alert / Custom Delete Confirmation Popup */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300 p-6 space-y-6">
            
            {/* Warning Icon Container */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 border-4 border-rose-100 flex items-center justify-center text-rose-500 animate-pulse">
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-slate-800">Are you sure?</h3>
                <p className="text-sm font-semibold text-rose-600">This action cannot be undone</p>
              </div>
            </div>

            {/* Warning Description */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to permanently delete <span className="font-extrabold text-slate-900">"{deleteConfirmUser.name}"</span> from the system. If you delete this account, their downline connection and data cannot be recovered.
              </p>
              <p className="text-[11px] text-slate-400 italic">
                All registration details, history, and referral associations for this member will be permanently erased.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30"
              >
                <Trash2 className="w-4 h-4" /> Yes, Delete
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
          }}
          isAdminMode={true}
          loggedInUserId={adminUser.id}
        />
      )}
    </div>
  );
}
