import { useState, useEffect } from 'react';
import { User as UserIcon, Shield, Users, Network, TrendingUp } from 'lucide-react';
import { User } from './types.js';
import DbStatusBanner from './components/DbStatusBanner.js';
import Navbar from './components/Navbar.js';
import LoginForm from './components/LoginForm.js';
import RegisterForm from './components/RegisterForm.js';
import UserDashboard from './components/UserDashboard.js';
import AdminPanel from './components/AdminPanel.js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [initializing, setInitializing] = useState(true);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-500">
        লোডিং হচ্ছে, দয়া করে অপেক্ষা করুন...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. Header Database Status */}
      <DbStatusBanner />

      {/* 2. Global Navigation */}
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        currentView={user ? currentView : 'auth'} 
        setView={setView} 
      />

      {/* 3. Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          /* LOGGED IN VIEWS */
          currentView === 'admin' && user.role === 'admin' ? (
            <AdminPanel adminUser={user} />
          ) : (
            <UserDashboard user={user} />
          )
        ) : (
          /* ANONYMOUS/AUTH VIEWS */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-center py-4">
            {/* Left Column: Visual Information & Promotion */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  🚀 আনলিমিটেড ডেপথ্ রেফারেল প্রোগ্রাম
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  রিয়েল-টাইম <span className="text-indigo-600">লেভেল প্ল্যান</span> নেটওয়ার্ক
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  আমাদের প্লাটফর্মে যুক্ত হন এবং রেফারেল চেইনের মাধ্যমে আনলিমিটেড লেভেল পর্যন্ত আয়ের টিম তৈরি করুন। প্রত্যেকে যে কাউকে সরাসরি যুক্ত করলে তা আপনার চেইনের পরবর্তী স্তরে জমা হবে।
                </p>
              </div>

              {/* Informational Cards (No Nesting, Clean Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    <Network className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">unlimited লেভেল চেইন</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    ১ম স্তর যাকে যুক্ত করবেন সে হবে লেভেল ২ তে, এবং সে আবার অন্য কাউকে যুক্ত করলে সে চলে যাবে লেভেল ৩ তে। এভাবে ক্রমান্বয়ে স্তরটি নিচের দিকে আনলিমিটেড গভীরতায় বিস্তৃত হবে।
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">এডমিন এপ্রুভাল গেট</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    নতুন অ্যাকাউন্ট খোলার পর তা নিষ্ক্রিয় (Inactive) থাকে। এডমিন প্যানেল থেকে তথ্য যাচাই করে সক্রিয় (Active) করলেই সদস্য রেফারেল কোড বা ড্যাশবোর্ড ব্যবহারের অনুমতি পায়।
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">রিয়েল-টাইম ডাটাবেজ</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    সম্পূর্ণ ডিরেক্টরি এবং রেফারেল ডাটা সরাসরি রিমোট MySQL এ সেভ হচ্ছে। হোস্ট করার সময় গিটহাব ইন্টিগ্রেশন এবং আপনার রিমোট MySQL একদম রিয়েল ডাটা ব্যবহার করে রান করবে।
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">রিকোর্সিভ ভিজ্যুয়ালাইজার</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    যেকোনো সদস্যের সম্পূর্ণ ডাউনলাইন কাঠামোটি দেখতে একটি আধুনিক গ্রাফিক্যাল ট্রি চার্ট ব্যবহার করা হয়েছে, যা দিয়ে আপনি যেকোনো গভীরতায় শাখা গুটিয়ে বা মেলে দেখতে পারবেন।
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
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} লেভেল প্ল্যান নেটওয়ার্ক। সর্বস্বত্ব সংরক্ষিত।</p>
          <p>
            Developed with React 19 + Vite + Express + pure MySQL driver for automated table bootstrap and high portability.
          </p>
        </div>
      </footer>
    </div>
  );
}
