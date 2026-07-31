import { LogOut, Shield, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { User } from '../types.js';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  currentView: 'dashboard' | 'admin' | 'auth';
  setView: (view: 'dashboard' | 'admin') => void;
}

export default function Navbar({ user, onLogout, currentView, setView }: NavbarProps) {
  return (
    <header id="app-navbar" className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
              L
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                লেভেল রেফারেল প্ল্যান
              </h1>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Unlimited Level Downline Network
              </span>
            </div>
          </div>

          {/* User Section & Navigation */}
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Navigation Options for Admin */}
              {user.role === 'admin' && (
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1 text-xs">
                  <button
                    onClick={() => setView('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      currentView === 'dashboard'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    ড্যাশবোর্ড
                  </button>
                  <button
                    onClick={() => setView('admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      currentView === 'admin'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    এডমিন প্যানেল
                  </button>
                </div>
              )}

              {/* User Profile Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-none">{user.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Log Out Button */}
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">লগআউট</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">নিরাপদ ড্যাশবোর্ড অ্যাক্সেস</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
