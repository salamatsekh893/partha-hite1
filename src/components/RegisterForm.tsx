import { useState, useEffect, FormEvent } from 'react';
import { User, UserPlus, Phone, Mail, Lock, ShieldCheck, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onToggleLogin: () => void;
}

export default function RegisterForm({ onRegisterSuccess, onToggleLogin }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorLocked, setSponsorLocked] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-detect referral code from URL query parameters (e.g., ?ref=2)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('sponsor');
    if (ref) {
      setSponsorId(ref);
      setSponsorLocked(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !phone || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          password,
          sponsorId: sponsorId ? parseInt(sponsorId, 10) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not complete registration.');
      }

      // Success
      setSuccess(data.message || 'Registration successful!');
      // Clear fields
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
      if (!sponsorLocked) {
        setSponsorId('');
      }
      
      // Auto switch back to login after 5 seconds, or let them click
      setTimeout(() => {
        onRegisterSuccess();
      }, 5000);

    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-form-container" className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header decoration */}
        <div className="bg-indigo-600 px-6 py-8 text-white text-center">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-3">
            <UserPlus className="w-6 h-6 text-indigo-100" />
          </div>
          <h2 className="text-xl font-bold">Register Account</h2>
          <p className="text-xs text-indigo-200 mt-1 font-medium">Join our multi-level network plan</p>
        </div>

        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Registration Successful!</h3>
              <p className="text-sm text-slate-600 mt-2 px-2">
                {success}
              </p>
              <p className="text-xs text-indigo-600 mt-4 font-semibold animate-pulse">
                Redirecting to the login page in 5 seconds...
              </p>
              <button
                onClick={onRegisterSuccess}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Go to Login Page Now
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <div>
                    <span className="font-semibold block">Registration Failed:</span>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sponsor ID */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="reg-sponsor" className="block text-xs font-semibold text-slate-700">
                      Sponsor ID / Referrer ID <span className="text-indigo-600 font-normal">(Optional, leave empty for root/first user)</span>
                    </label>
                    {sponsorLocked && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        Locked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    </div>
                    <input
                      id="reg-sponsor"
                      type="text"
                      value={sponsorId}
                      onChange={(e) => setSponsorId(e.target.value)}
                      disabled={sponsorLocked}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-75 disabled:bg-indigo-50/50 disabled:text-indigo-900 disabled:border-indigo-200 font-semibold"
                      placeholder="Sponsor's ID (e.g. 1, 2)"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                    The referral code or user ID of the person who invited you to register.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      placeholder="+123456789"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      placeholder="john.doe@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      id="reg-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>
                </div>

                {/* Warning notice about Admin Approvals */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 leading-normal font-medium">
                  <span className="font-bold text-slate-800 block mb-1">⚠️ Account Activation:</span>
                  Upon submitting this form, your registration will be queued for administrator review. Your account status will remain <strong>Inactive (Pending)</strong> and you can log in as soon as an administrator approves and activates your account.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
                >
                  {loading ? 'Registering...' : 'Register Account'}
                  <UserPlus className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle Login */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600 font-medium">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onToggleLogin}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Sign In instead
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
