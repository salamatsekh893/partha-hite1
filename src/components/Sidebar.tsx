import { X, LogOut, Shield, User as UserIcon, LayoutDashboard, Phone, Mail, Award, CheckCircle } from 'lucide-react';
import { User } from '../types.js';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  currentView: 'dashboard' | 'admin' | 'auth';
  setView: (view: 'dashboard' | 'admin') => void;
}

export default function Sidebar({ isOpen, onClose, user, onLogout, currentView, setView }: SidebarProps) {
  if (!user) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* Dark Overlay Backdrop */}
      <div 
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar Sheet Panel */}
      <aside 
        className={`absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-out border-r border-slate-100 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header Section */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
              R
            </div>
            <span className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
              Navigation Menu
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer focus:outline-none"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mid Content Section (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7">
          
          {/* User Profile Summary Card */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-left">
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate max-w-[150px]">
                  {user.name}
                </h4>
                <div className="flex flex-wrap items-center gap-1">
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {user.status === 'active' ? 'Active' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user.phone}</span>
              </div>
              {user.referrer_id && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Sponsor ID: {user.referrer_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">
              System Views
            </span>

            {/* Dashboard Navigation */}
            <button
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              User Dashboard
            </button>

            {/* Admin Panel Navigation */}
            {user.role === 'admin' && (
              <button
                onClick={() => setView('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0" />
                Admin Panel
              </button>
            )}
          </div>

        </div>

        {/* Bottom Footer Section */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-3 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            Logout Account
          </button>
        </div>
      </aside>
    </div>
  );
}
