import { useState, FormEvent } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, LogIn, Phone, Globe } from 'lucide-react';
import { User } from '../types.js';

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
  onToggleRegister: () => void;
}

// Popular country codes list
const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
];

export default function LoginForm({ onLoginSuccess, onToggleRegister }: LoginFormProps) {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    let identifier = '';
    if (loginMethod === 'phone') {
      if (!phoneNumber.trim()) {
        setError('Please enter your mobile phone number.');
        return;
      }
      // If user typed phone with '+' already, use as is; otherwise combine country code + phone
      const cleanNum = phoneNumber.trim();
      if (cleanNum.startsWith('+')) {
        identifier = cleanNum;
      } else {
        identifier = `${countryCode}${cleanNum}`;
      }
    } else {
      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      identifier = email.trim();
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: identifier, password }),
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
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-7 text-white text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 items-center justify-center mb-3 shadow-md shadow-indigo-600/20 text-indigo-300">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Member Login</h2>
          <p className="text-xs text-indigo-200/90 mt-1 font-medium">Access your referral dashboard & downline network</p>
        </div>

        {/* Login Mode Toggle Tabs (Phone / Email) */}
        <div className="bg-slate-100/80 p-1.5 border-b border-slate-200/80 flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setLoginMethod('phone'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              loginMethod === 'phone'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Phone Number
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              loginMethod === 'email'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Email Address
          </button>
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
            {loginMethod === 'phone' ? (
              /* Phone Input with Country Code Selector */
              <div>
                <label htmlFor="login-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative w-36 shrink-0">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full pl-8 pr-2 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Input */}
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="login-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                      placeholder="e.g. 9814522052"
                      required
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Select your country code and enter mobile number without spaces.
                </span>
              </div>
            ) : (
              /* Email Input */
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
            )}

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


