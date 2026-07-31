import { useState, FormEvent } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles, LogIn } from 'lucide-react';
import { User } from '../types.js';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onToggleRegister: () => void;
}

export default function LoginForm({ onLoginSuccess, onToggleRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your email/phone and password.');
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
        throw new Error(data.error || 'Login attempt failed.');
      }

      // Success
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-form-container" className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden backdrop-blur-sm transition-all">
        {/* Sleek Gradient Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 items-center justify-center mb-3 shadow-md shadow-indigo-600/20 text-indigo-300">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Member Login</h2>
          <p className="text-xs text-indigo-200/90 mt-1 font-medium">Access your referral dashboard & downline network</p>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <div>
                <span className="font-bold block text-rose-800">Authentication Error:</span>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address or Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                  placeholder="name@example.com or phone"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold py-3.5 px-5 rounded-2xl text-sm transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-3 cursor-pointer active:scale-98"
            >
              {loading ? 'Processing Sign In...' : 'Sign In To Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle register */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              Are you a new member?{' '}
              <button
                type="button"
                onClick={onToggleRegister}
                className="font-extrabold text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer ml-1"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

