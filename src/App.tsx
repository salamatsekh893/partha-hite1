import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Users, Sun, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { User } from './types.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import LoginForm from './components/LoginForm.js';
import RegisterForm from './components/RegisterForm.js';
import UserDashboard from './components/UserDashboard.js';
import AdminPanel from './components/AdminPanel.js';
import ProfileEditModal from './components/ProfileEditModal.js';
import SolarLanding from './components/SolarLanding.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<'dashboard' | 'admin' | 'solar' | 'auth'>('solar');
  const [adminTab, setAdminTab] = useState<'members' | 'website'>('members');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSetView = (view: 'dashboard' | 'admin' | 'solar' | 'auth', tab?: 'members' | 'website') => {
    setView(view);
    if (tab) {
      setAdminTab(tab);
    }
  };


  // Restore session from localStorage on startup & detect referral link
  useEffect(() => {
    const savedUser = localStorage.getItem('mlm_user_session');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        // Default to Admin panel if they are admin
        if (parsedUser.role === 'admin') {
          setView('admin');
        } else {
          setView('dashboard');
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        localStorage.removeItem('mlm_user_session');
      }
    } else {
      // Check if user arrived via referral parameter
      const params = new URLSearchParams(window.location.search);
      if (params.get('ref')) {
        setAuthView('register');
        setView('auth');
      }
    }
    setInitializing(false);

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setUser(e.detail);
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('mlm_user_session', JSON.stringify(loggedInUser));
    setIsAuthModalOpen(false);
    
    if (loggedInUser.role === 'admin') {
      setView('admin');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mlm_user_session');
    setView('solar');
    setAuthView('login');
    setIsAuthModalOpen(false);
  };

  const handleOpenAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthView(mode);
    // Switch to standalone full-page view for clean unclipped registration/login experience
    setView('auth');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-amber-400 font-bold tracking-wide">
        Loading SuccessIndia Solar Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Global Navigation & Header */}
      <Header 
        user={user} 
        onLogout={handleLogout} 
        currentView={user ? (currentView === 'admin' ? 'admin' : 'dashboard') : 'auth'} 
        setView={(v) => setView(v)} 
        onMenuClick={() => setIsSidebarOpen(true)}
        onOpenAuthModal={handleOpenAuthModal}
        onEditProfileClick={() => setIsProfileModalOpen(true)}
      />

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        currentView={user ? (currentView === 'admin' ? 'admin' : 'dashboard') : 'auth'}
        setView={(v, tab) => {
          handleSetView(v, tab);
          setIsSidebarOpen(false);
        }}
        onEditProfileClick={() => setIsProfileModalOpen(true)}
      />

      <ProfileEditModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
          localStorage.setItem('mlm_user_session', JSON.stringify(updatedUser));
        }}
        loggedInUserId={user?.id}
      />

      {/* 2. Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          /* LOGGED IN VIEWS */
          currentView === 'admin' && user.role === 'admin' ? (
            <AdminPanel adminUser={user} initialTab={adminTab} />
          ) : (
            <UserDashboard 
              user={user} 
              onUserUpdated={(updatedUser) => {
                setUser(updatedUser);
                localStorage.setItem('mlm_user_session', JSON.stringify(updatedUser));
              }} 
            />
          )
        ) : (
          /* PUBLIC VIEWS: Standalone Auth Page or Solar Landing Page */
          currentView === 'auth' ? (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Back to Home Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setView('solar')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-600" />
                  <span>Back to SuccessIndia Solar Home</span>
                </button>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAuthView('login')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      authView === 'login'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Member Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthView('register')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      authView === 'register'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    New Partner Registration
                  </button>
                </div>
              </div>

              {/* Dedicated Full Page Auth Screen */}
              <div className="w-full">
                {authView === 'login' ? (
                  <LoginForm 
                    onLoginSuccess={handleLoginSuccess} 
                    onToggleRegister={() => setAuthView('register')} 
                  />
                ) : (
                  <RegisterForm 
                    onRegisterSuccess={() => setAuthView('login')} 
                    onToggleLogin={() => setAuthView('login')} 
                  />
                )}
              </div>
            </div>
          ) : (
            <SolarLanding onOpenAuthModal={handleOpenAuthModal} />
          )
        )}
      </main>

      {/* 3. Footer with Company Info & Address (Only on Public Home Page) */}
      {currentView === 'solar' && (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-10 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
                    ☀️
                  </div>
                  <span className="font-black text-white text-sm">SuccessIndia Solar</span>
                </div>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Complete Solar Setup Solutions & Solar Products supply across India. Premium quality rooftop power, solar water pumps, fencing, street lighting & EV chargers.
                </p>
              </div>

              <div>
                <strong className="block text-white font-extrabold mb-2 uppercase tracking-wider text-[11px] text-amber-400">
                  Head Office & Showroom
                </strong>
                <p className="text-slate-300 leading-relaxed font-medium">
                  Marathahalli Main Rd, near HAL, HAL Quarters, Sector 3, HAL, Bengaluru, Karnataka 560037
                </p>
              </div>

              <div>
                <strong className="block text-white font-extrabold mb-2 uppercase tracking-wider text-[11px] text-amber-400">
                  Quick Member Access
                </strong>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('login')}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Member Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAuthModal('register')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Partner Sign Up
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
              <p className="font-bold text-slate-400">
                © {new Date().getFullYear()} SuccessIndia Solar & Setup Solutions. All rights reserved.
              </p>
              <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-md">
                <span className="text-slate-400 font-medium">Developed with ❤️ by</span>
                <span className="font-black text-amber-400 tracking-wider uppercase text-xs bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30">
                  SALAMAT SEKH
                </span>
              </div>
              <p className="text-slate-400 font-bold">
                SuccessIndia Solar Network
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

