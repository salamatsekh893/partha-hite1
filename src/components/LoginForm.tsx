import { useState, FormEvent, useRef, useEffect } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, LogIn, Phone, ChevronDown, Check, Search, Send, ShieldCheck, MessageSquare } from 'lucide-react';
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
  const [phoneAuthMode, setPhoneAuthMode] = useState<'password' | 'otp'>('password');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // default +91
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP States
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  const getFullPhone = () => {
    const cleanNum = phoneNumber.trim();
    if (cleanNum.startsWith('+')) return cleanNum;
    return `${selectedCountry.code}${cleanNum}`;
  };

  const safeParseJson = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Authentication endpoint not found on server (404).');
      }
      throw new Error(`Server returned unexpected response status ${res.status}.`);
    }
    try {
      return await res.json();
    } catch {
      throw new Error('Invalid JSON response received from server.');
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setOtpNotice(null);

    if (!phoneNumber.trim()) {
      setError('Please enter your mobile phone number first.');
      return;
    }

    setSendingOtp(true);
    try {
      const fullMobile = getFullPhone();
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: fullMobile,
          channel: otpChannel,
          country: selectedCountry.code.replace('+', ''),
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setOtpSent(true);
      if (data.isDemo && data.otp) {
        setOtpNotice(`OTP Sent! (Demo Mode Code: ${data.otp})`);
        setOtpCode(data.otp); // pre-fill demo OTP for convenience
      } else {
        setOtpNotice(`OTP code sent via ${otpChannel.toUpperCase()} to ${fullMobile}!`);
      }
    } catch (err: any) {
      setError(err.message || 'Error sending OTP via apitxt.com.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // If logging in via OTP
    if (loginMethod === 'phone' && phoneAuthMode === 'otp') {
      if (!phoneNumber.trim()) {
        setError('Please enter your mobile phone number.');
        return;
      }
      if (!otpCode.trim()) {
        setError('Please enter the OTP code received.');
        return;
      }

      setLoading(true);
      try {
        const fullMobile = getFullPhone();
        const res = await fetch('/api/auth/login-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: fullMobile, otp: otpCode }),
        });

        const data = await safeParseJson(res);
        if (!res.ok) {
          throw new Error(data.error || 'OTP verification failed.');
        }

        onLoginSuccess(data.user);
      } catch (err: any) {
        setError(err.message || 'Server connection error.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Standard password login
    let identifier = '';
    if (loginMethod === 'phone') {
      if (!phoneNumber.trim()) {
        setError('Please enter your mobile phone number.');
        return;
      }
      identifier = getFullPhone();
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

      const data = await safeParseJson(res);

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
    <div id="login-form-container" className="w-full max-w-[390px] mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden backdrop-blur-sm transition-all">
        {/* Sleek Compact Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-5 text-white text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="inline-flex w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-400/30 items-center justify-center mb-2 shadow-md shadow-indigo-600/20 text-indigo-300">
            <LogIn className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">Member Login</h2>
          <p className="text-[11px] text-indigo-200/90 mt-0.5 font-medium">Access your referral dashboard</p>
        </div>

        {/* Login Mode Toggle Tabs (Phone / Email) */}
        <div className="bg-slate-100/90 p-1 border-b border-slate-200/80 flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setLoginMethod('phone'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              loginMethod === 'phone'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Phone Number
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              loginMethod === 'email'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Email Address
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex gap-2.5 text-rose-700 text-xs leading-relaxed shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-800">Authentication Error:</span>
                {error}
              </div>
            </div>
          )}

          {otpNotice && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex gap-2 text-emerald-800 text-xs font-bold leading-relaxed shadow-sm">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>{otpNotice}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {loginMethod === 'phone' ? (
              /* Phone Input Section */
              <div className="space-y-3">
                {/* Phone Sub Auth Mode Toggle: Password vs OTP */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-slate-50 p-1 rounded-full border border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setPhoneAuthMode('password'); setError(null); }}
                    className={`flex-1 py-1 px-2 rounded-full transition-all cursor-pointer text-center ${
                      phoneAuthMode === 'password'
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    With Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhoneAuthMode('otp'); setError(null); }}
                    className={`flex-1 py-1 px-2 rounded-full transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                      phoneAuthMode === 'otp'
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    With OTP
                  </button>
                </div>

                <div>
                  <label htmlFor="login-phone" className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    {/* Country Code Button */}
                    <div className="relative shrink-0" ref={countryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
                        className="h-11 px-3 bg-slate-100 hover:bg-slate-200/80 active:scale-95 border border-slate-300/80 rounded-full flex items-center gap-1.5 text-xs font-extrabold text-slate-800 shadow-sm transition-all cursor-pointer"
                        title="Select Country Code"
                      >
                        <span className="text-base leading-none">{selectedCountry.flag}</span>
                        <span>{selectedCountry.code}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCountryMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown Popup */}
                      {isCountryMenuOpen && (
                        <div className="absolute left-0 top-12 z-50 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-slate-100/60 pr-1">
                            {filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setIsCountryMenuOpen(false);
                                  setCountrySearch('');
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between hover:bg-indigo-50 transition-colors cursor-pointer ${
                                  selectedCountry.code === c.code ? 'bg-indigo-50/80 text-indigo-700' : 'text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{c.flag}</span>
                                  <span className="font-semibold text-slate-800">{c.country}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-slate-600">{c.code}</span>
                                  {selectedCountry.code === c.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                </div>
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <div className="p-3 text-center text-xs text-slate-400 font-medium">No countries found</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <input
                        id="login-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border border-slate-200/90 rounded-full text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                        placeholder="e.g. 9814522052"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* If OTP Mode, show channel selector + Send OTP button */}
                {phoneAuthMode === 'otp' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Select OTP Channel:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setOtpChannel('sms')}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border transition-all ${
                            otpChannel === 'sms'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          💬 SMS OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpChannel('whatsapp')}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer border transition-all ${
                            otpChannel === 'whatsapp'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3 inline mr-1 text-emerald-600" />
                          WhatsApp
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !phoneNumber.trim()}
                      className="w-full h-10 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sendingOtp ? (
                        'Sending OTP Code...'
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-indigo-400" />
                          {otpSent ? 'Resend OTP Code' : `Send OTP via ${otpChannel.toUpperCase()}`}
                        </>
                      )}
                    </button>

                    <div>
                      <label htmlFor="otp-input" className="block text-xs font-bold text-slate-700 mb-1">
                        Enter OTP Code <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <input
                          id="otp-input"
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-black text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="e.g. 278247"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Email Input */
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border border-slate-200/90 rounded-full text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password input only if not logging in via OTP */}
            {(loginMethod === 'email' || (loginMethod === 'phone' && phoneAuthMode === 'password')) && (
              <div>
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-9 pr-9 bg-slate-50 border border-slate-200/90 rounded-full text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-transparent transition-all font-semibold"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold px-4 rounded-full text-xs transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                'Processing...'
              ) : loginMethod === 'phone' && phoneAuthMode === 'otp' ? (
                'Verify OTP & Sign In'
              ) : (
                'Sign In To Portal'
              )}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle register */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600 font-medium">
              Are you a new member?{' '}
              <button
                type="button"
                onClick={onToggleRegister}
                className="font-extrabold text-indigo-600 hover:text-indigo-800 underline transition-colors cursor-pointer ml-0.5"
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



