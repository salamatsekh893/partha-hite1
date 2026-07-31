import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Users, Network, TrendingUp } from 'lucide-react';
import { User } from './types.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import LoginForm from './components/LoginForm.js';
import RegisterForm from './components/RegisterForm.js';
import UserDashboard from './components/UserDashboard.js';
import AdminPanel from './components/AdminPanel.js';
import ProfileEditModal from './components/ProfileEditModal.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Restore session from localStorage on startup
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
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('mlm_user_session', JSON.stringify(loggedInUser));
    
    if (loggedInUser.role === 'admin') {
      setView('admin');
    } else {
      setView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mlm_user_session');
    setView('dashboard');
    setAuthView('login');
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500 font-medium tracking-wide">
        Initializing application, please wait...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Global Navigation & Overlay Sidebar */}
      <Header 
        user={user} 
        onLogout={handleLogout} 
        currentView={user ? currentView : 'auth'} 
        setView={setView} 
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        currentView={user ? currentView : 'auth'}
        setView={(view) => {
          setView(view);
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

      {/* 3. Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {user ? (
          /* LOGGED IN VIEWS */
          currentView === 'admin' && user.role === 'admin' ? (
            <AdminPanel adminUser={user} />
          ) : (
            <UserDashboard user={user} />
          )
        ) : (
          /* ANONYMOUS/AUTH VIEWS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 lg:items-center py-4">
            {/* Left Column: Visual Information & Promotion */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100/80 border border-indigo-200/60 text-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide shadow-sm">
                  🚀 Unlimited Depth Referral Platform
                </span>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Real-Time <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Level Plan</span> Network
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-medium">
                  Join our high-performance platform to build and scale your downline structure. Access unlimited depth tracking, automated referral paths, and instant graphical hierarchy rendering.
                </p>
              </div>

              {/* Informational Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 transition-all hover:shadow-md hover:border-indigo-200 group">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <Network className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Infinite Level Chain</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Direct referrals join Level 1. When they recruit, their signups cascade into Level 2, 3, and beyond to infinite depths.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 transition-all hover:shadow-md hover:border-amber-200 group">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Admin Verification Gate</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Security-focused account workflow. Newly registered users start in pending status and require admin approval for activation.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 transition-all hover:shadow-md hover:border-emerald-200 group">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Remote Database Sync</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Powered by robust database integration. Every sign-up, downline connection, and hierarchy update is logged securely in real time.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2 transition-all hover:shadow-md hover:border-indigo-200 group">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Interactive Visualizer</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Explore deep organizational pathways using our modern recursive tree widget. Expand and collapse node elements with live status.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Forms with smooth transition state */}
            <div className="lg:col-span-5 flex justify-center">
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
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 mt-16">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-700">© {new Date().getFullYear()} SuccessIndia. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Powered by SuccessIndia Multi-Level Referral Network Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
