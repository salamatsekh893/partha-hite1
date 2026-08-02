import { X, LogOut, Shield, User as UserIcon, LayoutDashboard, Phone, Mail, Award, Edit3, ChevronRight, Sparkles, Globe, Video, Image as ImageIcon } from 'lucide-react';
import { User } from '../types.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  currentView: 'dashboard' | 'admin' | 'auth';
  setView: (view: 'dashboard' | 'admin', adminTab?: 'members' | 'website') => void;
  onEditProfileClick: () => void;
}


export default function Sidebar({ isOpen, onClose, user, onLogout, currentView, setView, onEditProfileClick }: SidebarProps) {
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

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dark Overlay Backdrop with Smooth Fade */}
      <div 
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Sheet Panel */}
      <aside 
        className={`absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out border-r border-slate-100 rounded-r-3xl overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Section with Gradient Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-24 h-24 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/30 ring-2 ring-indigo-400/30">
                S
              </div>
              <div>
                <h3 className="font-black text-sm text-white uppercase tracking-wider leading-none">
                  SuccessIndia
                </h3>
                <span className="text-[10px] text-indigo-200/80 font-medium">Referral Portal Menu</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer focus:outline-none"
              title="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mid Content Section (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* User Profile Summary Card */}
          <div className="bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-2xl p-4 border border-slate-200/70 shadow-sm space-y-3.5 relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt={user.name} 
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shadow-md shadow-indigo-600/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 text-lg">
                      {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-6 h-6" />}
                    </div>
                  )}
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                    user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} title={user.status === 'active' ? 'Active Member' : 'Pending Activation'}>
                  </span>
                </div>
                
                <div className="space-y-1 text-left">
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate max-w-[140px]">
                    {user.name}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300/60' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}>
                      {user.role === 'admin' ? 'System Admin' : 'Distributor'}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      user.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60' : 'bg-rose-100 text-rose-800 border border-rose-300/60'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded-lg border border-indigo-200/50">
                <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-semibold">Distributor ID: {user.phone}</span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={() => {
                onClose();
                onEditProfileClick();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200/80 transition-all shadow-sm hover:shadow cursor-pointer active:scale-98"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile Info
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Main Views
              </span>
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </div>

            {/* Dashboard Navigation */}
            <button
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-white' : 'text-indigo-600'}`} />
                <span>User Dashboard</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${currentView === 'dashboard' ? 'text-indigo-200' : 'text-slate-400'}`} />
            </button>

            {/* Admin Panel Navigation */}
            {user.role === 'admin' && (
              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <button
                  onClick={() => {
                    setView('admin', 'members');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`w-4 h-4 shrink-0 ${currentView === 'admin' ? 'text-white' : 'text-amber-500'}`} />
                    <span>Admin Panel</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      currentView === 'admin' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Admin
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${currentView === 'admin' ? 'text-amber-100' : 'text-slate-400'}`} />
                  </div>
                </button>

                {/* Manage Website Option requested by user */}
                <button
                  onClick={() => {
                    setView('admin', 'website');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs text-indigo-950 bg-gradient-to-r from-indigo-50 to-indigo-100/80 hover:from-indigo-100 hover:to-indigo-200/80 border border-indigo-200/80 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-extrabold text-indigo-950">Manage Website</div>
                      <div className="text-[10px] text-indigo-600 font-semibold">Upload Photo, Video & Text</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                    LIVE
                  </span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Footer Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 border border-rose-200/80 hover:border-rose-300 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-100/60 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Logout Account
          </button>
          
          <div className="text-center text-[10px] text-slate-400 font-bold">
            SuccessIndia Referral Network © 2026
          </div>
        </div>
      </aside>
    </div>
  );
}

