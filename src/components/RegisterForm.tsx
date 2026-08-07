import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { 
  User, UserPlus, Phone, Mail, Lock, ShieldCheck, ArrowLeft, ArrowRight, 
  CheckCircle, AlertCircle, MapPin, Landmark, Award, Users, FileText, Camera, Upload,
  Send, MessageSquare, ChevronDown, Search, Check, Eye, EyeOff, HelpCircle, Sparkles
} from 'lucide-react';

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onToggleLogin: () => void;
  initialSponsorId?: string;
  isPublicRegister?: boolean;
}

// Country codes list with flags
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

export default function RegisterForm({ onRegisterSuccess, onToggleLogin, initialSponsorId, isPublicRegister = false }: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Account Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [sponsorId, setSponsorId] = useState('');
  const [sponsorLocked, setSponsorLocked] = useState(false);

  // Country code selector state
  const [selectedRegCountry, setSelectedRegCountry] = useState(COUNTRY_CODES[0]); // default +91 India
  const [isRegCountryMenuOpen, setIsRegCountryMenuOpen] = useState(false);
  const [regCountrySearch, setRegCountrySearch] = useState('');
  const regCountryDropdownRef = useRef<HTMLDivElement>(null);

  // Close country dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regCountryDropdownRef.current && !regCountryDropdownRef.current.contains(event.target as Node)) {
        setIsRegCountryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRegCountries = COUNTRY_CODES.filter(
    (c) =>
      c.country.toLowerCase().includes(regCountrySearch.toLowerCase()) ||
      c.code.includes(regCountrySearch)
  );

  const getFullRegPhone = () => {
    const cleanNum = phone.trim();
    if (cleanNum.startsWith('+')) return cleanNum;
    return `${selectedRegCountry.code}${cleanNum}`;
  };

  const safeParseJson = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Registration API endpoint not found on server (404).');
      }
      throw new Error(`Server returned unexpected error status ${res.status}.`);
    }
    try {
      return await res.json();
    } catch {
      throw new Error('Invalid server JSON response.');
    }
  };

  // OTP Verification States for Phone
  const [regOtpChannel, setRegOtpChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [regOtpCode, setRegOtpCode] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regOtpVerified, setRegOtpVerified] = useState(false);
  const [regSendingOtp, setRegSendingOtp] = useState(false);
  const [regVerifyingOtp, setRegVerifyingOtp] = useState(false);
  const [regOtpNotice, setRegOtpNotice] = useState<string | null>(null);

  // Photo state with auto-compressor variables
  const [photo, setPhoto] = useState<string>('');
  const [photoOriginalSize, setPhotoOriginalSize] = useState<string>('');
  const [photoCompressedSize, setPhotoCompressedSize] = useState<string>('');
  const [compressing, setCompressing] = useState<boolean>(false);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setError(null);

    // Track original size
    const origSizeKB = (file.size / 1024).toFixed(1);
    const origSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setPhotoOriginalSize(file.size > 1024 * 1024 ? `${origSizeMB} MB` : `${origSizeKB} KB`);

    try {
      // Auto-compress image to standard size and quality using Canvas
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Maintain passport size profile/portrait or square orientation. 
            // Constrain max dimensions to 500px to ensure tiny data footprint well under 800KB.
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Compress to standard JPG format (efficient compression)
            let quality = 0.75;
            let base64 = canvas.toDataURL('image/jpeg', quality);

            // Dynamically scale down quality if somehow the base64 exceeds the 800KB budget
            // (800KB in base64 format is ~1.1 million characters)
            while (base64.length > 1000000 && quality > 0.1) {
              quality -= 0.1;
              base64 = canvas.toDataURL('image/jpeg', quality);
            }

            resolve(base64);
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });

      setPhoto(compressedBase64);
      
      // Compute compressed size in KB
      const approxBytes = Math.round((compressedBase64.length * 3) / 4);
      const compSizeKB = (approxBytes / 1024).toFixed(1);
      setPhotoCompressedSize(`${compSizeKB} KB`);

    } catch (err) {
      console.error(err);
      setError('Failed to compress and upload photo. Please try a different image.');
    } finally {
      setCompressing(false);
    }
  };

  // Step 2: Personal & Family Details
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [phone2, setPhone2] = useState('');
  const [gender, setGender] = useState('');
  const [religion, setReligion] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // Step 3: Present & Permanent Addresses
  const [presentAddressText, setPresentAddressText] = useState('');
  const [presentPO, setPresentPO] = useState('');
  const [presentPS, setPresentPS] = useState('');
  const [presentDist, setPresentDist] = useState('');

  const [permanentAddressText, setPermanentAddressText] = useState('');
  const [permanentPO, setPermanentPO] = useState('');
  const [permanentPS, setPermanentPS] = useState('');
  const [permanentDist, setPermanentDist] = useState('');
  const [permanentPin, setPermanentPin] = useState('');
  const [permanentLandmark, setPermanentLandmark] = useState('');

  // Step 4: Documents & References
  const [aadharNo, setAadharNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [voterNo, setVoterNo] = useState('');
  const [rationNo, setRationNo] = useState('');
  const [consumerNo, setConsumerNo] = useState('');
  
  const [coApplicantName, setCoApplicantName] = useState('');
  const [coApplicantRelation, setCoApplicantRelation] = useState('');
  const [coApplicantAddress, setCoApplicantAddress] = useState('');
  const [familyMembersNo, setFamilyMembersNo] = useState('');

  const [relativeName, setRelativeName] = useState('');
  const [relativeAddress, setRelativeAddress] = useState('');
  const [relativePhone, setRelativePhone] = useState('');

  const [friendName, setFriendName] = useState('');
  const [friendAddress, setFriendAddress] = useState('');
  const [friendPhone, setFriendPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Send OTP for Register phone verification
  const handleRegSendOtp = async () => {
    setError(null);
    setRegOtpNotice(null);

    if (!phone.trim()) {
      setError('Please enter your primary contact mobile number first.');
      return;
    }

    setRegSendingOtp(true);
    try {
      const fullMobile = getFullRegPhone();
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: fullMobile,
          channel: regOtpChannel,
          country: selectedRegCountry.code.replace('+', ''),
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP code.');
      }

      setRegOtpSent(true);
      if (data.isDemo && data.otp) {
        setRegOtpNotice(`OTP Sent! (Demo Mode Code: ${data.otp})`);
        setRegOtpCode(data.otp); // pre-fill demo OTP
      } else {
        setRegOtpNotice(`OTP verification code sent via ${regOtpChannel.toUpperCase()} to ${fullMobile}!`);
      }
    } catch (err: any) {
      setError(err.message || 'Error sending OTP via apitxt.com API.');
    } finally {
      setRegSendingOtp(false);
    }
  };

  // Verify OTP for Register phone verification
  const handleRegVerifyOtp = async () => {
    setError(null);
    setRegOtpNotice(null);

    if (!regOtpCode.trim()) {
      setError('Please enter the 4-digit OTP code received.');
      return;
    }

    setRegVerifyingOtp(true);
    try {
      const fullMobile = getFullRegPhone();
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: fullMobile,
          otp: regOtpCode.trim(),
        }),
      });

      const data = await safeParseJson(res);
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed.');
      }

      setRegOtpVerified(true);
      setRegOtpNotice('✓ Mobile number verified successfully with OTP!');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setRegVerifyingOtp(false);
    }
  };

  // Auto-detect referral code from prop or URL query parameters (e.g., ?ref=2)
  useEffect(() => {
    if (initialSponsorId) {
      setSponsorId(initialSponsorId);
      setSponsorLocked(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('sponsor');
    if (ref) {
      setSponsorId(ref);
      setSponsorLocked(true);
    }
  }, [initialSponsorId]);

  // Helper to calculate age in years from YYYY-MM-DD
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep = (step: number) => {
    setError(null);
    if (step === 1) {
      if (!name || !phone || !email || !password) {
        setError('Please fill in all required fields (Name, Phone, Email, Password).');
        return false;
      }
      // Simple email validation
      if (!email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
    }
    if (step === 2) {
      if (!dob) {
        setError('Date of Birth is required. Applicant must be at least 18 years old.');
        return false;
      }
      const age = calculateAge(dob);
      if (age < 18) {
        setError(`Applicant is ${age} years old. Minimum required age for distributor registration is 18 years (১৮ বছর বয়স হতে হবে).`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateStep(1)) return;
    if (dob && calculateAge(dob) < 18) {
      setError(`Applicant must be at least 18 years old to register as distributor. Current age is ${calculateAge(dob)} years.`);
      return;
    }

    setLoading(true);
    try {
      const fullMobile = getFullRegPhone();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone: fullMobile,
          email,
          password,
          sponsorId: sponsorId.trim() || null,
          additionalDetails: {
            fatherHusbandName,
            motherName,
            dob,
            placeOfBirth,
            height,
            weight,
            phone2,
            gender,
            religion,
            bloodGroup,
            presentAddressText,
            presentPO,
            presentPS,
            presentDist,
            permanentAddressText,
            permanentPO,
            permanentPS,
            permanentDist,
            permanentPin,
            permanentLandmark,
            aadharNo,
            panNo,
            voterNo,
            rationNo,
            consumerNo,
            coApplicantName,
            coApplicantRelation,
            coApplicantAddress,
            familyMembersNo,
            relativeName,
            relativeAddress,
            relativePhone,
            friendName,
            friendAddress,
            friendPhone,
            photo
          }
        }),
      });

      const data = await safeParseJson(res);

      if (!res.ok) {
        throw new Error(data.error || 'Could not complete registration.');
      }

      // Success
      setSuccess(data.message || 'Registration successful!');
      
      // Auto switch back to login after 6 seconds, or let them click
      setTimeout(() => {
        onRegisterSuccess();
      }, 6000);

    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to copy present address to permanent address
  const handleCopyAddress = () => {
    setPermanentAddressText(presentAddressText);
    setPermanentPO(presentPO);
    setPermanentPS(presentPS);
    setPermanentDist(presentDist);
  };

  return (
    <div id="register-form-container" className="w-full mx-auto p-1 sm:p-2">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Success India Form Header */}
        <div className="bg-indigo-600 px-6 py-6 text-white text-center relative">
          <div className="absolute top-4 left-4 text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
            Form No: <span className="text-white">SI-{Math.floor(100000 + Math.random() * 900000)}</span>
          </div>
          <div className="absolute top-4 right-4 text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
            Date: <span className="text-white">{new Date().toLocaleDateString('en-US')}</span>
          </div>
          
          <div className="inline-flex w-12 h-12 rounded-xl bg-white/10 items-center justify-center mb-2 mt-4">
            <UserPlus className="w-6 h-6 text-indigo-100" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">SUCCESS INDIA</h2>
          <p className="text-xs text-indigo-200 uppercase font-bold tracking-widest mt-0.5">Applicant Admission Form</p>
          <div className="h-0.5 w-16 bg-white/30 mx-auto my-3 rounded-full"></div>
          <p className="text-xs text-indigo-100 font-medium max-w-md mx-auto leading-relaxed">
            Please fill out this official multi-level network joining application with precise details.
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between overflow-x-auto gap-4">
          <button 
            type="button"
            onClick={() => validateStep(1) && setCurrentStep(1)}
            className={`flex items-center gap-2 text-xs font-bold transition-all ${
              currentStep === 1 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              currentStep === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
            }`}>1</span>
            Account Info
          </button>
          
          <div className="h-px bg-slate-200 flex-1 hidden sm:block"></div>

          <button 
            type="button"
            onClick={() => validateStep(1) && setCurrentStep(2)}
            disabled={!name || !phone || !email}
            className={`flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 ${
              currentStep === 2 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              currentStep === 2 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
            }`}>2</span>
            Personal & Family
          </button>

          <div className="h-px bg-slate-200 flex-1 hidden sm:block"></div>

          <button 
            type="button"
            onClick={() => validateStep(1) && setCurrentStep(3)}
            disabled={!name || !phone || !email}
            className={`flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 ${
              currentStep === 3 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              currentStep === 3 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
            }`}>3</span>
            Addresses
          </button>

          <div className="h-px bg-slate-200 flex-1 hidden sm:block"></div>

          <button 
            type="button"
            onClick={() => validateStep(1) && setCurrentStep(4)}
            disabled={!name || !phone || !email}
            className={`flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50 ${
              currentStep === 4 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              currentStep === 4 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'
            }`}>4</span>
            Docs & References
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Form Submitted Successfully!</h3>
              <p className="text-sm text-slate-600 mt-3 max-w-md mx-auto">
                {success}
              </p>
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl inline-block text-left text-xs text-slate-500 max-w-sm">
                <span className="font-bold text-slate-800 block mb-1">What happens next?</span>
                An administrator will audit your references, government documents, and referrer status. You will receive activation approval, and you can log in immediately after that.
              </div>
              <p className="text-xs text-indigo-600 mt-6 font-semibold animate-pulse">
                Redirecting to login portal shortly...
              </p>
              <button
                onClick={onRegisterSuccess}
                className="mt-6 w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer"
              >
                Go to Login Page
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-700 text-xs leading-relaxed animate-fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <div>
                    <span className="font-bold block">Please Correct the Following:</span>
                    {error}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* STEP 1: ACCOUNT & SPONSOR INFO */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> 1. Referral & Core Account
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Passport Size Photo Box with Auto Compression */}
                      <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5">
                        <div className="w-32 h-40 bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center overflow-hidden shrink-0 relative group">
                          {photo ? (
                            <>
                              <img src={photo} alt="Applicant Passport Photo" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => { setPhoto(''); setPhotoOriginalSize(''); setPhotoCompressedSize(''); }}
                                className="absolute top-1.5 right-1.5 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md text-[10px] uppercase font-bold tracking-wider transition-all"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center">
                              {compressing ? (
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                              ) : (
                                <Camera className="w-8 h-8 text-slate-400 mb-1" />
                              )}
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Photo Box</span>
                              <span className="text-[9px] text-slate-400 mt-0.5">Passport Size</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2 text-center md:text-left w-full">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
                            <Upload className="w-4 h-4 text-indigo-500" /> Applicant Passport Size Photo
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Upload a portrait photo of the applicant. If you upload a large photo from your mobile phone, the system will automatically compress it to keep the size well under 800 KB.
                          </p>
                          
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1.5">
                            <label className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5" /> Choose Photo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handlePhotoChange} 
                                className="hidden" 
                              />
                            </label>
                            
                            {compressing && (
                              <span className="text-xs text-slate-500 font-medium animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                                Compressing image...
                              </span>
                            )}

                            {photo && !compressing && (
                              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Compressed: {photoCompressedSize} (Original: {photoOriginalSize})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sponsor Mobile Number / Distributor ID */}
                      {!isPublicRegister && (
                        <div className="md:col-span-2">
                          <div className="flex justify-between items-center mb-1.5">
                            <label htmlFor="reg-sponsor" className="block text-xs font-semibold text-slate-700">
                              Sponsor Distributor ID (Mobile No.) <span className="text-indigo-600 font-normal">(Leave empty for direct admin join)</span>
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
                              placeholder="Enter Sponsor Distributor ID (Mobile No. e.g. 9876543210)"
                            />
                          </div>
                        </div>
                      )}

                      {/* Name */}
                      <div>
                        <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Applicant Full Name <span className="text-rose-500">*</span>
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Applicant Name"
                            required
                          />
                        </div>
                      </div>

                      {/* Primary Contact Number with Country Code Selector and optional OTP Verification */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                            Primary Mobile Number (Login Identifier) <span className="text-rose-500">*</span>
                          </label>
                          {regOtpVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              OTP Verified
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                              <HelpCircle className="w-3 h-3 text-indigo-500" />
                              Select Country Code & Enter Mobile
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 items-stretch">
                          {/* Country Code Dropdown Button */}
                          <div className="relative shrink-0" ref={regCountryDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setIsRegCountryMenuOpen(!isRegCountryMenuOpen)}
                              className="h-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center gap-1.5 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-xs"
                            >
                              <span className="text-base leading-none">{selectedRegCountry.flag}</span>
                              <span>{selectedRegCountry.code}</span>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </button>

                            {/* Dropdown Menu */}
                            {isRegCountryMenuOpen && (
                              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                {/* Search input */}
                                <div className="relative mb-1">
                                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                                  <input
                                    type="text"
                                    value={regCountrySearch}
                                    onChange={(e) => setRegCountrySearch(e.target.value)}
                                    placeholder="Search country or code..."
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    autoFocus
                                  />
                                </div>

                                <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
                                  {filteredRegCountries.length > 0 ? (
                                    filteredRegCountries.map((c) => (
                                      <button
                                        key={c.code + c.country}
                                        type="button"
                                        onClick={() => {
                                          setSelectedRegCountry(c);
                                          setIsRegCountryMenuOpen(false);
                                          setRegCountrySearch('');
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                          selectedRegCountry.code === c.code && selectedRegCountry.country === c.country
                                            ? 'bg-indigo-50 text-indigo-700 font-bold'
                                            : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">{c.flag}</span>
                                          <span>{c.country}</span>
                                        </div>
                                        <span className="font-mono text-slate-600 font-semibold">{c.code}</span>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="p-3 text-center text-xs text-slate-400">
                                      No country matches search
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Primary Phone Input Field */}
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Phone className="w-4 h-4 text-slate-400" />
                            </div>
                            <input
                              id="reg-phone"
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                setRegOtpVerified(false);
                              }}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                              placeholder="Phone number without country code"
                              required
                            />
                          </div>

                          {!regOtpVerified && (
                            <button
                              type="button"
                              onClick={handleRegSendOtp}
                              disabled={regSendingOtp || !phone.trim()}
                              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {regSendingOtp ? 'Sending...' : regOtpSent ? 'Resend' : 'Send OTP'}
                            </button>
                          )}
                        </div>

                        {/* Channel selector & OTP code input */}
                        {!regOtpVerified && (
                          <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> OTP Method:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setRegOtpChannel('sms')}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                    regOtpChannel === 'sms'
                                      ? 'bg-indigo-600 text-white shadow-xs'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  SMS
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRegOtpChannel('whatsapp')}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                                    regOtpChannel === 'whatsapp'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  WhatsApp
                                </button>
                              </div>
                            </div>

                            {regOtpNotice && (
                              <p className="text-xs text-indigo-700 font-bold bg-white p-2 rounded-lg border border-indigo-100 shadow-xs">
                                {regOtpNotice}
                              </p>
                            )}

                            {regOtpSent && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={regOtpCode}
                                  onChange={(e) => setRegOtpCode(e.target.value)}
                                  placeholder="Enter 4 or 6-digit OTP"
                                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-wider"
                                />
                                <button
                                  type="button"
                                  onClick={handleRegVerifyOtp}
                                  disabled={regVerifyingOtp || !regOtpCode.trim()}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer disabled:opacity-50"
                                >
                                  {regVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          E-mail Address (Login Field) <span className="text-rose-500">*</span>
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Email address"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div>
                        <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Portal Access Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-slate-400" />
                          </div>
                          <input
                            id="reg-password"
                            type={showRegPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Set a strong password for portal login"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showRegPassword ? (
                              <EyeOff className="w-4 h-4 text-slate-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PERSONAL & FAMILY DETAILS */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="border-b border-slate-100 pb-2 mb-4">
                      <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> 2. Personal & Family Details
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Father's Name / Husband Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Father's Name / Husband's Name
                        </label>
                        <input
                          type="text"
                          value={fatherHusbandName}
                          onChange={(e) => setFatherHusbandName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Father's or Husband's Name"
                        />
                      </div>

                      {/* Mother's Name */}
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Mother's Name
                        </label>
                        <input
                          type="text"
                          value={motherName}
                          onChange={(e) => setMotherName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Mother's Name"
                        />
                      </div>

                      {/* Date of Birth with 18+ Age Requirement Notice */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-semibold text-slate-700">
                            Date of Birth <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60">
                            Min 18 Years (১৮ বছর)
                          </span>
                        </div>
                        <input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          required
                        />
                        {dob && (
                          <p className={`text-[11px] font-bold mt-1 ${calculateAge(dob) >= 18 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {calculateAge(dob) >= 18 
                              ? `✓ Age: ${calculateAge(dob)} years (Eligible)` 
                              : `✕ Age: ${calculateAge(dob)} years (Ineligible: Must be 18+)`
                            }
                          </p>
                        )}
                      </div>

                      {/* Place of Birth */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Place of Birth
                        </label>
                        <input
                          type="text"
                          value={placeOfBirth}
                          onChange={(e) => setPlaceOfBirth(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Place of Birth"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Gender
                        </label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Height */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Height (e.g. 5'6")
                        </label>
                        <input
                          type="text"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Height"
                        />
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Weight (e.g. 65 kg)
                        </label>
                        <input
                          type="text"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Weight"
                        />
                      </div>

                      {/* Religion */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Religion
                        </label>
                        <input
                          type="text"
                          value={religion}
                          onChange={(e) => setReligion(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Religion"
                        />
                      </div>

                      {/* Contact Number 2 */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Alternative Contact (Contact 2)
                        </label>
                        <input
                          type="tel"
                          value={phone2}
                          onChange={(e) => setPhone2(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                          placeholder="Alternative Contact Number"
                        />
                      </div>

                      {/* Blood Group */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Blood Group
                        </label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: ADDRESSES */}
                {currentStep === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Present Address */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" /> 3A. Present Address
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Street Address / Village
                          </label>
                          <input
                            type="text"
                            value={presentAddressText}
                            onChange={(e) => setPresentAddressText(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Vill, Street, House No"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Post Office (P.O)
                          </label>
                          <input
                            type="text"
                            value={presentPO}
                            onChange={(e) => setPresentPO(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="P.O."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Police Station (P.S)
                          </label>
                          <input
                            type="text"
                            value={presentPS}
                            onChange={(e) => setPresentPS(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="P.S."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            District (Dist)
                          </label>
                          <input
                            type="text"
                            value={presentDist}
                            onChange={(e) => setPresentDist(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="District"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Landmark className="w-4 h-4" /> 3B. Permanent Address
                        </h3>
                        <button
                          type="button"
                          onClick={handleCopyAddress}
                          className="text-[10px] bg-slate-100 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                        >
                          Copy Present Address
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Street Address / Village
                          </label>
                          <input
                            type="text"
                            value={permanentAddressText}
                            onChange={(e) => setPermanentAddressText(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Vill, Street, House No"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Post Office (P.O)
                          </label>
                          <input
                            type="text"
                            value={permanentPO}
                            onChange={(e) => setPermanentPO(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="P.O."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Police Station (P.S)
                          </label>
                          <input
                            type="text"
                            value={permanentPS}
                            onChange={(e) => setPermanentPS(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="P.S."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            District (Dist)
                          </label>
                          <input
                            type="text"
                            value={permanentDist}
                            onChange={(e) => setPermanentDist(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="District"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            PIN Code
                          </label>
                          <input
                            type="text"
                            value={permanentPin}
                            onChange={(e) => setPermanentPin(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="PIN Code"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Land Mark
                          </label>
                          <input
                            type="text"
                            value={permanentLandmark}
                            onChange={(e) => setPermanentLandmark(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Nearby landmarks, buildings"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 4: DOCUMENTS & REFERENCES */}
                {currentStep === 4 && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Government Documents */}
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="w-4 h-4" /> 4A. Government Documents & IDs
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Aadhar Card Number
                          </label>
                          <input
                            type="text"
                            value={aadharNo}
                            onChange={(e) => setAadharNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Aadhar Card No."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            PAN Number
                          </label>
                          <input
                            type="text"
                            value={panNo}
                            onChange={(e) => setPanNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="PAN Number"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Voter Card Number
                          </label>
                          <input
                            type="text"
                            value={voterNo}
                            onChange={(e) => setVoterNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Voter Card No."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Ration Card Number
                          </label>
                          <input
                            type="text"
                            value={rationNo}
                            onChange={(e) => setRationNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Ration Card No."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Consumer Number
                          </label>
                          <input
                            type="text"
                            value={consumerNo}
                            onChange={(e) => setConsumerNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Consumer No."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Co-Applicant Nominee */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                          4B. Co-Applicant / Nominee Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Co-Applicant Name
                          </label>
                          <input
                            type="text"
                            value={coApplicantName}
                            onChange={(e) => setCoApplicantName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Co-Applicant Name"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Relation
                          </label>
                          <input
                            type="text"
                            value={coApplicantRelation}
                            onChange={(e) => setCoApplicantRelation(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Relation"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Family Member's Count
                          </label>
                          <input
                            type="number"
                            value={familyMembersNo}
                            onChange={(e) => setFamilyMembersNo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Number of members"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Co-Applicant Address
                          </label>
                          <input
                            type="text"
                            value={coApplicantAddress}
                            onChange={(e) => setCoApplicantAddress(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                            placeholder="Address of co-applicant"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Relative & Friend References */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                          4C. Relative & Friend Contact Audit Audit References
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Relative */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700">Relative Reference:</h4>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Relative Name</label>
                            <input
                              type="text"
                              value={relativeName}
                              onChange={(e) => setRelativeName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Relative Full Name"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Contact No</label>
                            <input
                              type="tel"
                              value={relativePhone}
                              onChange={(e) => setRelativePhone(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Contact Number"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Address</label>
                            <input
                              type="text"
                              value={relativeAddress}
                              onChange={(e) => setRelativeAddress(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Address"
                            />
                          </div>
                        </div>

                        {/* Friend */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="text-xs font-bold text-slate-700">Friend Reference:</h4>
                          
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Friend's Name</label>
                            <input
                              type="text"
                              value={friendName}
                              onChange={(e) => setFriendName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Friend Full Name"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Contact No</label>
                            <input
                              type="tel"
                              value={friendPhone}
                              onChange={(e) => setFriendPhone(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Contact Number"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Address</label>
                            <input
                              type="text"
                              value={friendAddress}
                              onChange={(e) => setFriendAddress(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Address"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Terms notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[11px] text-slate-600 leading-normal font-medium">
                      <span className="font-bold text-amber-800 block mb-1">⚠️ Applicant Declarations:</span>
                      I hereby declare that all information filled in this "Success India" admission applicant form is correct, true, and complete. I understand that any false declaration will lead to immediate cancellation of my network membership.
                    </div>

                  </div>
                )}

                {/* Form Navigation Actions - Sticky Bottom for high user-friendliness */}
                <div className="sticky bottom-2 sm:static z-20 mt-6 bg-white/95 backdrop-blur-md p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-200/80 shadow-lg sm:shadow-none flex justify-between items-center transition-all">
                  <div className="text-[11px] font-semibold text-slate-500">
                    Step <span className="font-bold text-indigo-600">{currentStep}</span> of 4
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-slate-300 hover:border-slate-400 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                    )}

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                      >
                        Next Step <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                      >
                        {loading ? 'Submitting Form...' : 'Submit Application'}
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </form>

              {/* Back to sign in */}
              <div className="mt-8 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600 font-medium animate-pulse">
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
