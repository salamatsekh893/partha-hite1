import { Menu, LogOut, Shield, User as UserIcon, LayoutDashboard } from 'lucide-react';
import { User } from '../types.js';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  currentView: 'dashboard' | 'admin' | 'auth';
  setView: (view: 'dashboard' | 'admin') => void;
  onMenuClick: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onEditProfileClick?: () => void;
}

export default function Header({ user, onLogout, currentView, setView, onMenuClick, onOpenAuthModal, onEditProfileClick }: HeaderProps) {
  // Parse user additional_details for profile photo
  let headerPhoto: string | null = null;
  try {
    if (user?.additional_details) {
      const details = typeof user.additional_details === 'string'
        ? JSON.parse(user.additional_details)
        : user.additional_details;
      headerPhoto = details.photo || null;
    }
  } catch (e) {
    console.error("Error parsing user photo in header", e);
  }

  return (
    <header id="app-header" className="bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-emerald-50/95 backdrop-blur-md border-b border-emerald-200/80 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Left Side: Logo & Brand */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={onMenuClick}
                className="p-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-amber-500/25"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-amber-500/30 ring-2 ring-amber-300">
                ☀️
              </div>
              <div className="text-left">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                  SuccessIndia <span className="text-slate-950 font-black text-xs bg-amber-400 border border-amber-300 px-2 py-0.5 rounded-md shadow-sm">SOLAR</span>
                </h1>
                <span className="text-[10px] text-emerald-700 font-extrabold tracking-wider uppercase block -mt-0.5">
                  Solar Energy & Complete Setup Solutions
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Navigation / Auth Modal trigger */}
          {user ? (
            <div className="flex items-center gap-3">
              {/* Quick Navigation - Only show if Admin to let them easily toggle */}
              {user.role === 'admin' && (
                <div className="hidden md:flex bg-slate-100 p-1 rounded-xl gap-1 text-xs border border-slate-200">
                  <button
                    onClick={() => setView('dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      currentView === 'dashboard'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setView('admin')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </button>
                </div>
              )}

              {/* Quick Profile Badge */}
              <button
                type="button"
                onClick={onEditProfileClick}
                className="hidden sm:flex items-center gap-2 bg-amber-50 hover:bg-amber-100/90 border border-amber-200/90 px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer group"
                title="Edit Profile Info"
              >
                {headerPhoto ? (
                  <img 
                    src={headerPhoto} 
                    alt={user.name} 
                    className="w-6 h-6 rounded-full object-cover ring-2 ring-amber-400 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 text-[10px] font-black shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3 text-slate-950" />}
                  </div>
                )}
                <span className="text-xs font-black text-slate-900 group-hover:text-amber-900 transition-colors">{user.name}</span>
                <span className="text-[10px] text-amber-700 bg-amber-200/60 font-extrabold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  Edit
                </span>
              </button>

              {/* Quick Logout */}
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all shadow-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuthModal && onOpenAuthModal('login')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-amber-300"
              >
                <UserIcon className="w-4 h-4 text-slate-950" />
                <span>Member Login / Register</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
