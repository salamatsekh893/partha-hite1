import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Users, Network, TrendingUp } from 'lucide-react';
import { User } from './types.js';
import Header from './components/Header.js';
import Sidebar from './components/Sidebar.js';
import LoginForm from './components/LoginForm.js';
import RegisterForm from './components/RegisterForm.js';
import UserDashboard from './components/UserDashboard.js';
import AdminPanel from './components/AdminPanel.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-center py-4">
            {/* Left Column: Visual Information & Promotion */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100/50 text-indigo-700 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  🚀 Unlimited Depth Referral Program
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Real-Time <span className="text-indigo-600">Level Plan</span> Network
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Join our high-performance platform to build and scale your downline structure. Access unlimited depth tracking, automated referral paths, and instant graphical hierarchy rendering.
                </p>
              </div>

              {/* Informational Cards (No Nesting, Clean Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md hover:border-slate-300">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Network className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Infinite Level Chain</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Direct referrals join your Level 1 downline. When they recruit, their signups cascade into Level 2, Level 3, and so on, building an organic branch to infinite depths.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md hover:border-slate-300">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Admin Verification Gate</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Security-focused account workflow. Newly registered users start in pending status and require admin approval before they can activate and share their sponsor link.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md hover:border-slate-300">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Remote Database Sync</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Powered by a robust remote MySQL integration. Every sign-up, downline connection, and hierarchy update is logged securely and rendered in real time.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:shadow-md hover:border-slate-300">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Interactive Visualizer</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Explore deep organizational pathways using our modern recursive tree widget. Expand and collapse node elements smoothly with live status checks.
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
          <p>© {new Date().getFullYear()} Unlimited Level Referral Plan. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Engineered with React 19 + Vite + Express + pure MySQL driver for high portability and auto-provisioning.
          </p>
        </div>
      </footer>
    </div>
  );
}
