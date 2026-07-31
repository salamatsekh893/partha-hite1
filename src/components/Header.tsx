import { Menu, LogOut, Shield, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { User } from '../types.js';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  currentView: 'dashboard' | 'admin' | 'auth';
  setView: (view: 'dashboard' | 'admin') => void;
  onMenuClick: () => void;
}

export default function Header({ user, onLogout, currentView, setView, onMenuClick }: HeaderProps) {
  return (
    <header id="app-header" className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left Side: Hamburger Menu & Logo */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={onMenuClick}
                className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-all border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                R
              </div>
              <div className="text-left">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
                  Referral Plan
                </h1>
                <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase block -mt-0.5">
                  Unlimited Downline Network
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Quick Profile & Logout (Desktop Only / Optional but keeps header balanced) */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Quick Navigation - Only show if Admin to let them easily toggle */}
              {user.role === 'admin' && (
                <div className="hidden md:flex bg-slate-800/80 p-1 rounded-xl gap-1 text-xs border border-slate-700/50">
                  <button
                    onClick={() => setView('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      currentView === 'dashboard'
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setView('admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </button>
                </div>
              )}

              {/* Quick Profile Badge */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 border border-slate-700/60 px-3 py-1.5 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center">
                  <UserIcon className="w-3 text-slate-300" />
                </div>
                <span className="text-xs font-bold text-slate-200">{user.name}</span>
              </div>

              {/* Quick Logout */}
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700/80 transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Secure Access
              </span>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
