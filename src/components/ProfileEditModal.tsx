import { useState, FormEvent, useEffect, useRef, ChangeEvent } from 'react';
import { 
  X, User as UserIcon, Mail, Phone, Lock, Save, AlertCircle, CheckCircle, 
  MapPin, FileText, Camera, UploadCloud, ChevronRight, ChevronLeft, Eye, RefreshCw
} from 'lucide-react';
import { User } from '../types.js';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onProfileUpdated: (updatedUser: User) => void;
  isAdminMode?: boolean; // If true, uses admin-specific endpoint
  loggedInUserId?: number; // The user ID performing the action (for authentication headers)
}

type TabType = 'account' | 'personal' | 'address' | 'documents';

export default function ProfileEditModal({ isOpen, onClose, user, onProfileUpdated, isAdminMode = false, loggedInUserId }: ProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  
  // Credentials / Core info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+880');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Personal & Family
  const [fatherHusbandName, setFatherHusbandName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [phone2, setPhone2] = useState('');
  const [gender, setGender] = useState('Male');
  const [religion, setReligion] = useState('Islam');
  const [bloodGroup, setBloodGroup] = useState('');
  const [coApplicantName, setCoApplicantName] = useState('');
  const [coApplicantRelation, setCoApplicantRelation] = useState('');
  const [coApplicantAddress, setCoApplicantAddress] = useState('');
  const [familyMembersNo, setFamilyMembersNo] = useState('');

  // Addresses
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

  // ID & Files
  const [aadharNo, setAadharNo] = useState('');
  const [panNo, setPanNo] = useState('');
  const [voterNo, setVoterNo] = useState('');
  const [rationNo, setRationNo] = useState('');
  const [consumerNo, setConsumerNo] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [identityDocument, setIdentityDocument] = useState<string | null>(null); // New scan document field

  // Status indicators
  const [compressing, setCompressing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Initialize fields on open/user load
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      
      // Smartly parse country code and phone number
      let phoneVal = user.phone || '';
      let matchedCode = '+880'; // Default BD
      const codes = ['+880', '+91', '+966', '+971', '+965', '+968', '+974', '+973', '+1', '+44'];
      let found = false;
      for (const code of codes) {
        if (phoneVal.startsWith(code)) {
          matchedCode = code;
          phoneVal = phoneVal.substring(code.length);
          found = true;
          break;
        }
      }
      if (!found) {
        if (phoneVal.length === 10) {
          matchedCode = '+91';
        } else if (phoneVal.length === 11 && phoneVal.startsWith('01')) {
          matchedCode = '+880';
          phoneVal = phoneVal.substring(1);
        } else if (phoneVal.startsWith('880')) {
          matchedCode = '+880';
          phoneVal = phoneVal.substring(3);
        } else if (phoneVal.startsWith('91')) {
          matchedCode = '+91';
          phoneVal = phoneVal.substring(2);
        }
      }
      setCountryCode(matchedCode);
      setPhone(phoneVal);

      setPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(null);
      setActiveTab('account');

      // Parse additional details
      let details: any = {};
      try {
        if (user.additional_details) {
          details = typeof user.additional_details === 'string' 
            ? JSON.parse(user.additional_details) 
            : user.additional_details;
        }
      } catch (e) {
        console.error('Failed to parse additional details', e);
      }

      setFatherHusbandName(details.fatherHusbandName || '');
      setMotherName(details.motherName || '');
      setDob(details.dob || '');
      setPlaceOfBirth(details.placeOfBirth || '');
      setHeight(details.height || '');
      setWeight(details.weight || '');
      setPhone2(details.phone2 || '');
      setGender(details.gender || 'Male');
      setReligion(details.religion || 'Islam');
      setBloodGroup(details.bloodGroup || '');
      setCoApplicantName(details.coApplicantName || '');
      setCoApplicantRelation(details.coApplicantRelation || '');
      setCoApplicantAddress(details.coApplicantAddress || '');
      setFamilyMembersNo(details.familyMembersNo || '');

      setPresentAddressText(details.presentAddressText || '');
      setPresentPO(details.presentPO || '');
      setPresentPS(details.presentPS || '');
      setPresentDist(details.presentDist || '');
      setPermanentAddressText(details.permanentAddressText || '');
      setPermanentPO(details.permanentPO || '');
      setPermanentPS(details.permanentPS || '');
      setPermanentDist(details.permanentDist || '');
      setPermanentPin(details.permanentPin || '');
      setPermanentLandmark(details.permanentLandmark || '');

      setAadharNo(details.aadharNo || '');
      setPanNo(details.panNo || '');
      setVoterNo(details.voterNo || '');
      setRationNo(details.rationNo || '');
      setConsumerNo(details.consumerNo || '');
      setPhoto(details.photo || null);
      setIdentityDocument(details.identityDocument || null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Image Compressor Utility
  const compressAndSetFile = async (file: File, type: 'photo' | 'document') => {
    setCompressing(true);
    setError(null);

    try {
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

            // Constrain Max Dimensions to 1000px
            const maxDimension = 1000;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Canvas 2D Context failed'));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to efficient JPG
            let quality = 0.70;
            let base64 = canvas.toDataURL('image/jpeg', quality);

            // Dynamically scale down quality if exceeds ~800KB
            while (base64.length > 950000 && quality > 0.1) {
              quality -= 0.1;
              base64 = canvas.toDataURL('image/jpeg', quality);
            }

            resolve(base64);
          };
          img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
      });

      if (type === 'photo') {
        setPhoto(compressedBase64);
      } else {
        setIdentityDocument(compressedBase64);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to compress and upload file. Please try a smaller image.');
    } finally {
      setCompressing(false);
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetFile(file, 'photo');
    }
  };

  const handleDocChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetFile(file, 'document');
    }
  };

  const handleCopyPresentAddress = () => {
    setPermanentAddressText(presentAddressText);
    setPermanentPO(presentPO);
    setPermanentPS(presentPS);
    setPermanentDist(presentDist);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Full Name, Email, and Phone/Mobile number are strictly required.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    const mergedDetails = {
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
      photo,
      identityDocument
    };

    try {
      const endpoint = isAdminMode ? '/api/admin/update-profile' : '/api/user/update-profile';
      const bodyPayload = {
        userId: isAdminMode ? user.id : undefined,
        name: name.trim(),
        email: email.trim(),
        phone: (countryCode + phone.trim()),
        password: password ? password : undefined,
        additionalDetails: mergedDetails
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': (loggedInUserId || user?.id || '').toString(),
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile details.');
      }

      setSuccess(isAdminMode ? 'Member profile updated successfully!' : 'Your profile has been updated successfully!');
      
      onProfileUpdated(data.user);

      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'A network error occurred while updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full relative z-10 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">
                {isAdminMode ? `Edit Member: ${user.name}` : 'Edit My Profile'}
              </h3>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                {isAdminMode ? `ADMINISTRATIVE CONTROL • MEMBER ID #${user.id}` : 'ACCOUNT PROFILE CONTROL'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close edit modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons bar */}
        <div className="bg-slate-50 border-b border-slate-150 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'account' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            Account Credentials
          </button>
          <button
            type="button"
            disabled={user.status !== 'active' && !isAdminMode}
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'personal' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : (user.status !== 'active' && !isAdminMode)
                  ? 'text-slate-400 bg-slate-100/50 cursor-not-allowed opacity-60'
                  : 'text-slate-600 hover:bg-slate-200/60 cursor-pointer'
            }`}
            title={user.status !== 'active' && !isAdminMode ? "Locked until Distributor ID is approved by Administrator" : "Personal & Nominee details"}
          >
            {user.status !== 'active' && !isAdminMode && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
            Personal & Nominee
          </button>
          <button
            type="button"
            disabled={user.status !== 'active' && !isAdminMode}
            onClick={() => setActiveTab('address')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'address' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : (user.status !== 'active' && !isAdminMode)
                  ? 'text-slate-400 bg-slate-100/50 cursor-not-allowed opacity-60'
                  : 'text-slate-600 hover:bg-slate-200/60 cursor-pointer'
            }`}
            title={user.status !== 'active' && !isAdminMode ? "Locked until Distributor ID is approved by Administrator" : "Address details"}
          >
            {user.status !== 'active' && !isAdminMode && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
            Addresses
          </button>
          <button
            type="button"
            disabled={user.status !== 'active' && !isAdminMode}
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'documents' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : (user.status !== 'active' && !isAdminMode)
                  ? 'text-slate-400 bg-slate-100/50 cursor-not-allowed opacity-60'
                  : 'text-slate-600 hover:bg-slate-200/60 cursor-pointer'
            }`}
            title={user.status !== 'active' && !isAdminMode ? "Locked until Distributor ID is approved by Administrator" : "ID Scan and photos"}
          >
            {user.status !== 'active' && !isAdminMode && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
            ID & Document Scans
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {user.status !== 'active' && !isAdminMode && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex gap-2.5 text-amber-900 text-xs leading-relaxed font-semibold">
              <span className="text-sm">🔒</span>
              <div>
                Your Distributor ID is currently <span className="text-amber-700 font-bold">Pending Admin Approval</span>. You can edit your basic Account Credentials now. Once approved and activated by the administrator, you can update your Personal, Nominee, Address, and Document details.
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <span className="font-bold block">Error saving changes:</span>
                {error}
              </div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <div>
                <span className="font-bold block">Update Successful!</span>
                {success}
              </div>
            </div>
          )}

          {/* TAB 1: ACCOUNT CREDENTIALS */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile / Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-1/3 min-w-[120px] shrink-0">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold appearance-none text-slate-700 cursor-pointer pr-7"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1em', backgroundRepeat: 'no-repeat' }}
                      >
                        <option value="+880">🇧🇩 BD (+880)</option>
                        <option value="+91">🇮🇳 IN (+91)</option>
                        <option value="+966">🇸🇦 SA (+966)</option>
                        <option value="+971">🇦🇪 AE (+971)</option>
                        <option value="+965">🇰🇼 KW (+965)</option>
                        <option value="+968">🇴🇲 OM (+968)</option>
                        <option value="+974">🇶🇦 QA (+974)</option>
                        <option value="+973">🇧🇭 BH (+973)</option>
                        <option value="+1">🇺🇸 US (+1)</option>
                        <option value="+44">🇬🇧 UK (+44)</option>
                      </select>
                    </div>
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Phone number"
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 mt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Change Password (Leave empty to keep existing)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & NOMINEE */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father's / Husband's Name</label>
                  <input
                    type="text"
                    value={fatherHusbandName}
                    onChange={(e) => setFatherHusbandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Place of Birth</label>
                  <input
                    type="text"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Religion</label>
                  <input
                    type="text"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternative Phone / Phone 2</label>
                  <input
                    type="text"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    placeholder="e.g. O+, A-, B+"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 mt-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nominee / Co-Applicant Details
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nominee Name</label>
                    <input
                      type="text"
                      value={coApplicantName}
                      onChange={(e) => setCoApplicantName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nominee Relation</label>
                    <input
                      type="text"
                      value={coApplicantRelation}
                      onChange={(e) => setCoApplicantRelation(e.target.value)}
                      placeholder="e.g. Spouse, Son, Father"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nominee Full Address</label>
                  <textarea
                    rows={2}
                    value={coApplicantAddress}
                    onChange={(e) => setCoApplicantAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'address' && (
            <div className="space-y-5 animate-fade-in">
              {/* Present Address */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-500" /> Present Address
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Street Address / Village</label>
                  <input
                    type="text"
                    value={presentAddressText}
                    onChange={(e) => setPresentAddressText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Post Office (P.O)</label>
                    <input
                      type="text"
                      value={presentPO}
                      onChange={(e) => setPresentPO(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Police Station (P.S)</label>
                    <input
                      type="text"
                      value={presentPS}
                      onChange={(e) => setPresentPS(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">District</label>
                    <input
                      type="text"
                      value={presentDist}
                      onChange={(e) => setPresentDist(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Permanent Address */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-500" /> Permanent Address
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPresentAddress}
                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Copy Present Address
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Street Address / Village</label>
                  <input
                    type="text"
                    value={permanentAddressText}
                    onChange={(e) => setPermanentAddressText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Post Office (P.O)</label>
                    <input
                      type="text"
                      value={permanentPO}
                      onChange={(e) => setPermanentPO(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Police Station (P.S)</label>
                    <input
                      type="text"
                      value={permanentPS}
                      onChange={(e) => setPermanentPS(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">District</label>
                    <input
                      type="text"
                      value={permanentDist}
                      onChange={(e) => setPermanentDist(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Pin Code</label>
                    <input
                      type="text"
                      value={permanentPin}
                      onChange={(e) => setPermanentPin(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Landmark</label>
                    <input
                      type="text"
                      value={permanentLandmark}
                      onChange={(e) => setPermanentLandmark(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ID DOCUMENTS & UPLOADS */}
          {activeTab === 'documents' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aadhar Number</label>
                  <input
                    type="text"
                    value={aadharNo}
                    onChange={(e) => setAadharNo(e.target.value)}
                    placeholder="12 digit Aadhar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={panNo}
                    onChange={(e) => setPanNo(e.target.value)}
                    placeholder="10 digit PAN"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Voter ID Number</label>
                  <input
                    type="text"
                    value={voterNo}
                    onChange={(e) => setVoterNo(e.target.value)}
                    placeholder="Voter Card No"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                
                {/* Photo Upload Panel */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 block self-start">
                    Applicant Profile Photo
                  </span>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />

                  {photo ? (
                    <div className="relative group w-28 h-28 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-md">
                      <img 
                        src={photo} 
                        alt="Profile Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 bg-white text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Change Photo"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhoto(null)}
                          className="p-1.5 bg-white text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Remove Photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 transition-all flex flex-col items-center justify-center bg-white cursor-pointer"
                    >
                      <Camera className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-500 font-bold">Select Image</span>
                    </button>
                  )}

                  <p className="text-[10px] text-slate-400 font-medium mt-3">
                    Supported formats: JPG, JPEG, PNG. Max auto-compressed size is 800KB.
                  </p>
                </div>

                {/* Identity Document Proof Upload Panel */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 block self-start">
                    Identity Document Proof Scan
                  </span>

                  <input
                    type="file"
                    ref={docInputRef}
                    accept="image/*"
                    onChange={handleDocChange}
                    className="hidden"
                  />

                  {identityDocument ? (
                    <div className="relative group w-28 h-28 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                      <img 
                        src={identityDocument} 
                        alt="Doc Scan Preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => docInputRef.current?.click()}
                          className="p-1.5 bg-white text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Change Document"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIdentityDocument(null)}
                          className="p-1.5 bg-white text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Remove Document"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl hover:border-emerald-400 transition-all flex flex-col items-center justify-center bg-white cursor-pointer"
                    >
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-[10px] text-slate-500 font-bold">Select Scan File</span>
                    </button>
                  )}

                  <p className="text-[10px] text-slate-400 font-medium mt-3">
                    Upload a photograph scan of Aadhar card, PAN card, or Voter card ID.
                  </p>
                </div>

              </div>

              {compressing && (
                <div className="text-center text-indigo-600 text-xs font-bold animate-pulse py-2">
                  Processing and compressing image...
                </div>
              )}
            </div>
          )}

        </form>

        {/* Action Controls Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            {activeTab === 'account' && (
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg cursor-pointer"
              >
                Next Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {activeTab === 'personal' && (
              <button
                type="button"
                onClick={() => setActiveTab('address')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg cursor-pointer"
              >
                Next Addresses <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {activeTab === 'address' && (
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors rounded-lg cursor-pointer"
              >
                Next Documents <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {activeTab !== 'account' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'personal') setActiveTab('account');
                  if (activeTab === 'address') setActiveTab('personal');
                  if (activeTab === 'documents') setActiveTab('address');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors rounded-lg cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous Tab
              </button>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || compressing}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || compressing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-xl shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
