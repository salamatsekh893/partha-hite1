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
      setError('দয়া করে সবকটি প্রয়োজনীয় তথ্য পূরণ করুন।');
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
        throw new Error(data.error || 'রেজিস্ট্রেশন সম্পূর্ণ করা সম্ভব হয়নি।');
      }

      // Success
      setSuccess(data.message || 'নিবন্ধন সফল হয়েছে!');
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
      setError(err.message || 'সার্ভার সংযোগে ত্রুটি ঘটেছে।');
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
          <h2 className="text-xl font-bold">নতুন একাউন্ট নিবন্ধন</h2>
          <p className="text-xs text-indigo-200 mt-1">রেফারেল নেটওয়ার্ক ও লেভেল প্ল্যানে জয়েন করুন</p>
        </div>

        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">নিবন্ধন সম্পন্ন হয়েছে!</h3>
              <p className="text-sm text-slate-600 mt-2 px-2">
                {success}
              </p>
              <p className="text-xs text-indigo-600 mt-4 font-semibold animate-pulse">
                ৫ সেকেন্ড পর আপনাকে লগইন পেজে নিয়ে যাওয়া হচ্ছে...
              </p>
              <button
                onClick={onRegisterSuccess}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer"
              >
                সরাসরি লগইন পেজে যান
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <div>
                    <span className="font-semibold block">নিবন্ধন ব্যর্থ হয়েছে:</span>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sponsor ID */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="reg-sponsor" className="block text-xs font-semibold text-slate-700">
                      স্পন্সর আইডি / রেফারার আইডি <span className="text-indigo-600 font-normal">(ঐচ্ছিক, প্রথম জনের জন্য)</span>
                    </label>
                    {sponsorLocked && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        অটো-ফিল্ড লক
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
                      placeholder="স্পন্সরের ইউজার আইডি (যেমন: 1, 2)"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    যার রেফারেল কোড বা লিংক ব্যবহার করে জয়েন করছেন তার ইউজার আইডি।
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    আপনার সম্পূর্ণ নাম <span className="text-rose-500">*</span>
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
                      placeholder="মোঃ আসিফ রহমান"
                      required
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
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
                      placeholder="017XXXXXXXX"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ইমেইল এড্রেস <span className="text-rose-500">*</span>
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
                      placeholder="example@gmail.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    পাসওয়ার্ড <span className="text-rose-500">*</span>
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
                      placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                      required
                    />
                  </div>
                </div>

                {/* Warning notice about Admin Approvals */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 leading-normal">
                  <span className="font-bold text-slate-800 block mb-0.5">⚠️ লক্ষ্য করুন:</span>
                  ফর্মটি সাবমিট করার পর আপনার তথ্যসমূহ এডমিন প্যানেলে জমা হবে। এডমিন আপনার একাউন্টটি <strong>এপ্রুভ বা সক্রিয় (Active)</strong> করার পরই কেবল আপনি ড্যাশবোর্ডে লগইন করতে পারবেন।
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none mt-4 cursor-pointer"
                >
                  {loading ? 'প্রসেসিং হচ্ছে...' : 'রেজিস্ট্রেশন করুন'}
                  <UserPlus className="w-4 h-4" />
                </button>
              </form>

              {/* Toggle Login */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  ইতিমধ্যেই একাউন্ট রয়েছে?{' '}
                  <button
                    type="button"
                    onClick={onToggleLogin}
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    সরাসরি লগইন করুন
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
