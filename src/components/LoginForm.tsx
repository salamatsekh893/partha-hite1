import { useState, FormEvent } from 'react';
import { Mail, Lock, Shield, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { User } from '../types.js';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onToggleRegister: () => void;
}

export default function LoginForm({ onLoginSuccess, onToggleRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('ইমেইল এবং পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'লগইন করতে সমস্যা হয়েছে।');
      }

      // Success
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'সার্ভার সংযোগে ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  // Helper to autofill admin credentials for testing
  const handleAutofillAdmin = () => {
    setEmail('admin@gmail.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div id="login-form-container" className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header decoration */}
        <div className="bg-indigo-600 px-6 py-8 text-white text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-indigo-100" />
          </div>
          <h2 className="text-xl font-bold">লগইন করুন</h2>
          <p className="text-xs text-indigo-200 mt-1">আপনার লেভেল রেফারেল একাউন্ট অ্যাক্সেস করুন</p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <div>
                <span className="font-semibold block">লগইন ব্যর্থ হয়েছে:</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                ইমেইল এড্রেস <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="name@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                  পাসওয়ার্ড <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              {loading ? 'প্রসেসিং হচ্ছে...' : 'লগইন করুন'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle register */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              আপনি কি একজন নতুন মেম্বার?{' '}
              <button
                type="button"
                onClick={onToggleRegister}
                className="font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
              >
                নতুন একাউন্ট জয়েন করুন
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Admin Quick Login box */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-800 flex items-center gap-1.5">
              এডমিন ডেমো লগইন ও টেস্টিং ক্রেডেনশিয়াল:
            </h4>
            <p className="text-amber-700 mt-1 leading-relaxed">
              লেভেল প্ল্যান এপ্রুভাল টেস্টিং এবং রিমোট MySQL টেবিল চেক করতে নিচে ক্লিক করে এডমিন হিসেবে দ্রুত লগইন করতে পারেন:
            </p>
            <div className="mt-3 flex items-center justify-between bg-white border border-amber-200 rounded-lg p-2.5">
              <div className="font-mono text-[11px] text-slate-700">
                <div>Email: <strong className="text-slate-900">admin@gmail.com</strong></div>
                <div>Pass: <strong className="text-slate-900">admin123</strong></div>
              </div>
              <button
                type="button"
                onClick={handleAutofillAdmin}
                className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-3 py-1.5 rounded-md text-[10px] transition-colors cursor-pointer"
              >
                অটো ফিল করুন
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
