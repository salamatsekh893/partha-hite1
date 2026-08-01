import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Zap, ShieldCheck, MapPin, Phone, Mail, ArrowRight, CheckCircle2, 
  Sparkles, BatteryCharging, Lightbulb, Compass, Award, FileText, Send, UserCheck, ChevronRight, ChevronLeft, X, Image as ImageIcon,
  Check, Star, Video, Globe, Play, Pause, Maximize2, Grid, Layers
} from 'lucide-react';
import { WebsiteContent } from '../types.js';

interface SolarLandingProps {
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

// Fallback high-contrast SVG graphics if network photo fails or is blocked
function SolarFallbackGraphic({ type }: { type: string }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex flex-col items-center justify-center p-4 text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-400/30 via-transparent to-transparent pointer-events-none" />
      <motion.div 
        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-lg mb-2"
      >
        {type === 'on-grid' && '⚡'}
        {type === 'off-grid' && '🔋'}
        {type === 'hybrid' && '🔄'}
        {type === 'water-pump' && '💧'}
        {type === 'water-heater' && '♨️'}
        {type === 'street-lights' && '💡'}
        {type === 'fencing' && '🛡️'}
        {type === 'home-lighting' && '🏠'}
        {type === 'ev-charge' && '🔌'}
        {!['on-grid','off-grid','hybrid','water-pump','water-heater','street-lights','fencing','home-lighting','ev-charge'].includes(type) && '☀️'}
      </motion.div>
      <span className="text-xs font-black uppercase tracking-wider text-amber-300">SuccessIndia Field Setup</span>
    </div>
  );
}

// Smart Image with automatic SVG Fallback
function SmartSolarImage({ src, alt, type, className }: { src: string; alt: string; type: string; className: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <SolarFallbackGraphic type={type} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      referrerPolicy="no-referrer"
    />
  );
}

export default function SolarLanding({ onOpenAuthModal }: SolarLandingProps) {
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquirySetup, setInquirySetup] = useState('On Grid Setup');
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Dynamic live website media & notices uploaded by Admin
  const [websiteContents, setWebsiteContents] = useState<WebsiteContent[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [lightboxMedia, setLightboxMedia] = useState<WebsiteContent | null>(null);

  useEffect(() => {
    fetch('/api/website/contents')
      .then(res => res.json())
      .then(data => {
        if (data.contents) {
          setWebsiteContents(data.contents);
        }
      })
      .catch(err => console.error('Failed to load website contents:', err));
  }, []);

  // Automatic carousel slide rotation timer
  useEffect(() => {
    if (!isAutoplay || websiteContents.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % websiteContents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoplay, websiteContents.length]);

  const handleNextSlide = () => {
    if (websiteContents.length === 0) return;
    setActiveSlideIndex((prev) => (prev + 1) % websiteContents.length);
  };

  const handlePrevSlide = () => {
    if (websiteContents.length === 0) return;
    setActiveSlideIndex((prev) => (prev - 1 + websiteContents.length) % websiteContents.length);
  };

  // Exact 9 Setup Solutions with high-res solar photos
  const setupSolutions = [
    {
      id: 'on-grid',
      title: '1. On Grid Setup',
      icon: '⚡',
      badgeColor: 'bg-blue-600',
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80',
      desc: 'Grid-tied rooftop solar power system connected directly to local electricity board with net-metering benefits.',
      highlight: 'Zero battery cost & lower bills'
    },
    {
      id: 'off-grid',
      title: '2. Off Grid Setup',
      icon: '🔋',
      badgeColor: 'bg-emerald-600',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
      desc: 'Standalone solar power plant with high capacity lithium/tubular battery storage for 24/7 power autonomy.',
      highlight: 'Complete blackout protection'
    },
    {
      id: 'hybrid',
      title: '3. Hybrid Setup',
      icon: '🔄',
      badgeColor: 'bg-amber-600',
      image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
      desc: 'Combines grid connectivity with battery backup for maximum energy security and optimized savings.',
      highlight: 'Best of both worlds'
    },
    {
      id: 'water-pump',
      title: '4. Solar Water Pump Setup',
      icon: '💧',
      badgeColor: 'bg-teal-600',
      image: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80',
      desc: 'High efficiency DC & AC agricultural water pumping solutions for farms, irrigation & deep borewells.',
      highlight: 'Zero diesel & grid dependency'
    },
    {
      id: 'water-heater',
      title: '5. Solar Water Heater Setup',
      icon: '♨️',
      badgeColor: 'bg-orange-600',
      image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
      desc: 'Evacuated Tube (ETC) & Flat Plate (FPC) solar thermal water heating for residential & commercial use.',
      highlight: 'Instant hot water all year'
    },
    {
      id: 'street-lights',
      title: '6. Solar Street Lights',
      icon: '💡',
      badgeColor: 'bg-yellow-600',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      desc: 'All-In-One & Integrated solar LED street lighting systems with auto dusk-to-dawn sensors and motion detection.',
      highlight: 'Auto dusk-to-dawn operation'
    },
    {
      id: 'fencing',
      title: '7. Solar Fencing',
      icon: '🛡️',
      badgeColor: 'bg-indigo-600',
      image: 'https://images.unsplash.com/photo-1592833159057-651427230006?auto=format&fit=crop&w=800&q=80',
      desc: 'Non-lethal high-voltage solar energized security fencing for agricultural fields, farms, and industrial sites.',
      highlight: 'Maximum perimeter security'
    },
    {
      id: 'home-lighting',
      title: '8. Solar Home Lighting System',
      icon: '🏠',
      badgeColor: 'bg-pink-600',
      image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80',
      desc: 'Compact plug-and-play solar home lighting kit with multi-bulb support, mobile charging ports & fan outputs.',
      highlight: 'Ideal for homes & rural areas'
    },
    {
      id: 'ev-charge',
      title: '9. EV Charge',
      icon: '🔌',
      badgeColor: 'bg-purple-600',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
      desc: 'Solar powered Electric Vehicle (EV) charging stations and fast chargers for residential & commercial parking.',
      highlight: 'Green mobility charging'
    }
  ];

  // Gallery images showcase
  const solarGallery = [
    { id: 'on-grid', title: 'Commercial Rooftop Solar Plant', img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80' },
    { id: 'water-pump', title: 'Agricultural Solar Water Pump', img: 'https://images.unsplash.com/photo-1548337138-e87d889cc369?auto=format&fit=crop&w=800&q=80' },
    { id: 'street-lights', title: 'Solar LED Street Lights Installation', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
    { id: 'ev-charge', title: 'Solar EV Fast Charging Station', img: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80' }
  ];

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitted(true);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Pro-Level Radiant Solar Hero Banner (Vibrant Sky Blue & Gold with 3D Magic Motion) */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-sky-400/40"
      >
        {/* Background Animated Floating Sun Glow Effects */}
        <motion.div 
          animate={{ 
            x: [0, 20, -20, 0],
            y: [0, -15, 15, 0],
            scale: [1, 1.1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-amber-400/35 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            x: [0, -20, 20, 0],
            y: [0, 15, -15, 0],
            scale: [0.9, 1.15, 1, 0.9]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/30 rounded-full blur-3xl pointer-events-none" 
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide shadow-lg border border-amber-300"
            >
              <Sun className="w-4 h-4 text-slate-950 animate-spin-slow" />
              <span>SuccessIndia Solar Energy & Complete Setup Solutions</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-sm"
            >
              Clean Solar Energy <br className="hidden sm:inline" />
              <span className="text-amber-300 underline decoration-amber-400/80 decoration-wavy decoration-2">
                Powering India's Future
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xs sm:text-sm text-sky-100 max-w-xl font-semibold leading-relaxed"
            >
              Welcome to <strong className="text-white font-black">SuccessIndia Solar</strong>. We provide end-to-end solar installations, agricultural water pumps, street lights, EV chargers, and solar security fencing with full setup support.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenAuthModal('login')}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-400/30 transition-all cursor-pointer flex items-center gap-2 border border-amber-200"
              >
                <UserCheck className="w-4 h-4" />
                <span>Member Login</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenAuthModal('register')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm rounded-2xl border border-white/40 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Partner Registration</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </motion.button>
            </motion.div>

            {/* Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/20 text-xs font-bold text-sky-100"
            >
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Govt Approved
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> 25 Yrs Warranty
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> Expert Setup
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" /> Referral Rewards
              </span>
            </motion.div>
          </div>

          {/* Right Column: High-Visibility 3D Solar Feature Card */}
          <div className="lg:col-span-5">
            <motion.div 
              whileHover={{ rotateY: 6, rotateX: -6, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 border border-white/30 shadow-2xl space-y-2 transform-gpu"
            >
              <div className="relative rounded-xl overflow-hidden h-48 sm:h-52 w-full bg-slate-900 border border-white/20 group">
                <SmartSolarImage
                  src="https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80"
                  alt="Solar Rooftop Plant"
                  type="on-grid"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5 bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[11px] shadow-md flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> 9 Complete Solutions
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">Turnkey Solar Engineering</span>
                  <h3 className="text-xs font-black">Rooftop Solar Plants & Water Pumps</h3>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 2. Complete Setup Solutions (9 Items with Bright Cards & Guaranteed Photos) */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-4 py-1.5 rounded-full inline-block shadow-sm">
            ☀️ Our Core Solar Offerings
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complete Setup Solutions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-bold">
            We deliver turnkey solar engineering, procurement & commissioning tailored to your exact requirements.
          </p>
        </div>

        {/* 9 Grid Items with 3D Magic Hover & Motion Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {setupSolutions.map((item, index) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ 
                y: -8, 
                rotateX: 2, 
                rotateY: -2,
                boxShadow: "0 25px 50px -12px rgba(245, 158, 11, 0.25)" 
              }}
              className="bg-white rounded-2xl border-2 border-slate-200/90 shadow-md hover:border-amber-400 transition-all overflow-hidden group flex flex-col justify-between transform-gpu"
            >
              <div>
                {/* Photo & Header Graphic */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden border-b border-slate-200">
                  <SmartSolarImage 
                    src={item.image} 
                    alt={item.title} 
                    type={item.id}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  
                  {/* Floating Icon Box */}
                  <motion.span 
                    whileHover={{ scale: 1.25, rotate: 12 }}
                    className="absolute bottom-3 left-3 text-2xl bg-white text-slate-950 p-2 rounded-xl shadow-lg border border-slate-200 cursor-pointer"
                  >
                    {item.icon}
                  </motion.span>
                  
                  {/* Highlight Pill */}
                  <span className="absolute top-3 right-3 text-[10px] font-black text-white bg-slate-950/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg shadow-md">
                    {item.highlight}
                  </span>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="font-black text-base text-slate-900 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setInquirySetup(item.title);
                    const el = document.getElementById('inquiry-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-300"
                >
                  <span>Request Setup Quote</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Highlight Note */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="bg-gradient-to-r from-amber-100 via-amber-50 to-emerald-100 border-2 border-dashed border-amber-400 p-5 rounded-2xl text-center shadow-md"
        >
          <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
            <span>And all other Solar Products can be supplied according to your requirement!</span>
          </p>
        </motion.div>
      </section>

      {/* Dynamic Admin Uploaded Media & Notices Section (Single Frame Carousel & Grid View) */}
      {websiteContents.length > 0 && (
        <section className="space-y-6 pt-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-950 bg-indigo-100 border border-indigo-300 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                Live Management Uploads
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Website Official Photos & Media Frame
              </h2>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('slider')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" /> Single Frame Showcase
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-4 h-4" /> All Grid View
              </button>
            </div>
          </div>

          {/* SINGLE PHOTO/MEDIA CAROUSEL SHOWCASE FRAME (একেবারে একটি ফটো ফ্রেমে পর পর স্ক্রোল হবে) */}
          {viewMode === 'slider' && (
            <div className="bg-slate-950 border-4 border-amber-400/90 rounded-3xl shadow-2xl overflow-hidden relative text-white">
              {/* Active Item Container */}
              {(() => {
                const safeIndex = activeSlideIndex >= websiteContents.length ? 0 : activeSlideIndex;
                const current = websiteContents[safeIndex];
                if (!current) return null;

                return (
                  <div className="flex flex-col lg:flex-row items-stretch min-h-[420px] lg:min-h-[480px]">
                    {/* Left Media Stage */}
                    <div className="lg:w-3/5 relative bg-black flex items-center justify-center overflow-hidden min-h-[300px] lg:min-h-full group">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={current.id}
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.04 }}
                          transition={{ duration: 0.4 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          {current.type === 'photo' && current.media_url && (
                            <div className="relative w-full h-full min-h-[320px] lg:min-h-[460px]">
                              <img
                                src={current.media_url}
                                alt={current.title}
                                className="w-full h-full object-cover max-h-[500px]"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                              <button
                                onClick={() => setLightboxMedia(current)}
                                className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-white transition-all shadow-lg cursor-pointer flex items-center gap-1 text-xs font-extrabold"
                              >
                                <Maximize2 className="w-4 h-4" /> Full View
                              </button>
                            </div>
                          )}

                          {current.type === 'video' && (
                            <div className="w-full h-full min-h-[320px] lg:min-h-[460px] bg-slate-950 flex items-center justify-center">
                              {current.media_url?.includes('youtube.com') || current.media_url?.includes('youtu.be') ? (
                                <iframe
                                  src={current.media_url.replace('watch?v=', 'embed/')}
                                  title={current.title}
                                  className="w-full h-full min-h-[320px] lg:min-h-[460px] border-0"
                                  allowFullScreen
                                />
                              ) : current.media_url?.startsWith('data:video') ? (
                                <video src={current.media_url} controls className="w-full h-full object-contain" />
                              ) : (
                                <div className="text-center p-6 space-y-3">
                                  <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                                    <Play className="w-8 h-8 fill-white ml-1" />
                                  </div>
                                  <a
                                    href={current.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-full text-xs font-black text-white inline-block shadow-lg"
                                  >
                                    Open Video Stream
                                  </a>
                                </div>
                              )}
                            </div>
                          )}

                          {current.type === 'text' && (
                            <div className="p-8 sm:p-12 w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/40 flex flex-col justify-center items-center text-center space-y-4">
                              <span className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xl text-2xl">
                                📢
                              </span>
                              <h3 className="text-xl sm:text-2xl font-black text-amber-300 max-w-md leading-tight">
                                {current.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-200 max-w-lg font-medium leading-relaxed">
                                {current.description}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>

                      {/* Navigation Overlay Buttons */}
                      {websiteContents.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevSlide}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition-all shadow-xl border border-slate-700/80 cursor-pointer z-10"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={handleNextSlide}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-white flex items-center justify-center transition-all shadow-xl border border-slate-700/80 cursor-pointer z-10"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Right Info & Details Panel */}
                    <div className="lg:w-2/5 p-6 sm:p-8 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {current.type === 'photo' && (
                              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                                <ImageIcon className="w-3.5 h-3.5" /> Photo Frame
                              </span>
                            )}
                            {current.type === 'video' && (
                              <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                                <Video className="w-3.5 h-3.5" /> Field Video
                              </span>
                            )}
                            {current.type === 'text' && (
                              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                                <FileText className="w-3.5 h-3.5" /> Notice
                              </span>
                            )}
                            {current.badge && (
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase">
                                {current.badge}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                            {safeIndex + 1} / {websiteContents.length}
                          </span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-amber-300 leading-snug">
                          {current.title}
                        </h3>

                        {current.description && (
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                            {current.description}
                          </p>
                        )}
                      </div>

                      {/* Interactive Controls & Thumbnails Strip */}
                      <div className="space-y-4 pt-4 border-t border-slate-800">
                        {/* Play/Pause Autoplay Control */}
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => setIsAutoplay(!isAutoplay)}
                            className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                          >
                            {isAutoplay ? (
                              <>
                                <Pause className="w-3.5 h-3.5 text-amber-400" /> Auto-Scroll Active
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 text-slate-400" /> Auto-Scroll Paused
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={handlePrevSlide}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleNextSlide}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnails Bar */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {websiteContents.map((thumb, idx) => (
                            <button
                              key={thumb.id}
                              onClick={() => {
                                setActiveSlideIndex(idx);
                              }}
                              className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer relative bg-slate-950 ${
                                idx === safeIndex
                                  ? 'border-amber-400 scale-105 shadow-md ring-2 ring-amber-400/40'
                                  : 'border-slate-800 opacity-60 hover:opacity-100'
                              }`}
                            >
                              {thumb.type === 'photo' && thumb.media_url ? (
                                <img src={thumb.media_url} alt={thumb.title} className="w-full h-full object-cover" />
                              ) : thumb.type === 'video' ? (
                                <div className="w-full h-full bg-rose-950 text-rose-300 flex items-center justify-center text-xs font-black">
                                  ▶ Video
                                </div>
                              ) : (
                                <div className="w-full h-full bg-indigo-950 text-amber-300 flex items-center justify-center text-[10px] font-black p-1 text-center">
                                  📢
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* GRID VIEW MODE (IF USER CLICKS 'ALL GRID VIEW') */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {websiteContents.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="bg-white border-2 border-slate-200 hover:border-amber-400 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Photo Preview */}
                    {item.type === 'photo' && item.media_url && (
                      <div className="relative h-52 bg-slate-900 overflow-hidden group">
                        <img
                          src={item.media_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => setLightboxMedia(item)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Photo Gallery
                        </span>
                      </div>
                    )}

                    {/* Video Preview */}
                    {item.type === 'video' && (
                      <div className="relative h-52 bg-slate-950 flex items-center justify-center overflow-hidden">
                        {item.media_url?.includes('youtube.com') || item.media_url?.includes('youtu.be') ? (
                          <iframe
                            src={item.media_url.replace('watch?v=', 'embed/')}
                            title={item.title}
                            className="w-full h-full border-0"
                            allowFullScreen
                          />
                        ) : item.media_url?.startsWith('data:video') ? (
                          <video src={item.media_url} controls className="w-full h-full object-cover" />
                        ) : (
                          <a
                            href={item.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-center p-4 space-y-2 group"
                          >
                            <div className="w-14 h-14 rounded-full bg-rose-600 group-hover:bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg transition-transform group-hover:scale-110">
                              <Play className="w-7 h-7 fill-white ml-1" />
                            </div>
                            <span className="text-xs font-extrabold text-slate-200 block underline">Watch Video Stream</span>
                          </a>
                        )}
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> Video Demonstration
                        </span>
                      </div>
                    )}

                    {/* Text Notice Header */}
                    {item.type === 'text' && (
                      <div className="p-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 border-b border-amber-400 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Official Notice
                        </span>
                        <Sparkles className="w-5 h-5 text-slate-900 animate-pulse" />
                      </div>
                    )}

                    {/* Content Details */}
                    <div className="p-6 space-y-2.5">
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            {item.badge}
                          </span>
                        )}
                        {item.category && (
                          <span className="text-[11px] font-bold text-slate-500">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] font-bold text-slate-400 text-right">
                    Published on SuccessIndia Portal
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL FOR HIGH-RES MEDIA */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col relative text-white shadow-2xl">
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase">
                {lightboxMedia.badge || lightboxMedia.type}
              </span>
              <h3 className="text-lg font-black text-amber-300 pr-10 truncate">{lightboxMedia.title}</h3>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black">
              {lightboxMedia.type === 'photo' && lightboxMedia.media_url && (
                <img
                  src={lightboxMedia.media_url}
                  alt={lightboxMedia.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                />
              )}
              {lightboxMedia.type === 'video' && (
                <div className="w-full h-[60vh] max-h-[500px]">
                  {lightboxMedia.media_url?.includes('youtube.com') || lightboxMedia.media_url?.includes('youtu.be') ? (
                    <iframe
                      src={lightboxMedia.media_url.replace('watch?v=', 'embed/')}
                      title={lightboxMedia.title}
                      className="w-full h-full border-0 rounded-2xl"
                      allowFullScreen
                    />
                  ) : (
                    <video src={lightboxMedia.media_url} controls className="w-full h-full rounded-2xl object-contain" />
                  )}
                </div>
              )}
              {lightboxMedia.type === 'text' && (
                <div className="p-8 text-center space-y-4 max-w-xl">
                  <h3 className="text-2xl font-black text-amber-300">{lightboxMedia.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium">{lightboxMedia.description}</p>
                </div>
              )}
            </div>

            {lightboxMedia.description && lightboxMedia.type !== 'text' && (
              <div className="p-5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 font-medium">
                {lightboxMedia.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Real On-Site Solar Executions Photo Gallery */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 border border-emerald-300 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            Project Gallery Showcase
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Real On-Site Solar Installations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {solarGallery.map((g, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -6 }}
              className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md h-56 bg-slate-900 transition-all transform-gpu cursor-pointer"
            >
              <SmartSolarImage 
                src={g.img} 
                alt={g.title} 
                type={g.id}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-90" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">SuccessIndia Field Project</span>
                <h4 className="text-xs font-black">{g.title}</h4>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Contact & Free Quote Request (Vibrant Bright Card Layout with 3D Motion) */}
      <section id="inquiry-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
        {/* Left: Office Address & Contact Card (Vibrant Amber & Emerald) */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 shadow-xl space-y-6"
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 bg-white/80 border border-white px-3 py-1 rounded-full shadow-sm">
              Head Office & Experience Center
            </span>
            <h3 className="text-2xl font-black text-slate-950 mt-3">
              SuccessIndia Solar Solutions
            </h3>
            <p className="text-xs font-bold text-slate-900 mt-1">
              Visit our experience center or contact us for on-site survey and subsidies.
            </p>
          </div>

          <div className="space-y-4 text-xs font-bold text-slate-950 border-t border-slate-950/20 pt-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-slate-950 shadow-md flex items-center justify-center shrink-0 mt-0.5 font-black text-base">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <strong className="block text-slate-950 font-black text-sm mb-0.5">Office Address (Bengaluru):</strong>
                <p className="text-slate-950 leading-relaxed font-bold">
                  Marathahalli Main Rd, near HAL, HAL Quarters, Sector 3, HAL, Bengaluru, Karnataka 560037
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-slate-950 shadow-md flex items-center justify-center shrink-0 font-black text-base">
                <Phone className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <strong className="block text-slate-950 font-black">Phone Support / WhatsApp:</strong>
                <span className="text-slate-950 font-black text-sm">+91 98145 22052 / +91 99999 99999</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-slate-950 shadow-md flex items-center justify-center shrink-0 font-black text-base">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <strong className="block text-slate-950 font-black">Email Inquiry:</strong>
                <span className="text-slate-950 font-black text-sm">support@successindia.com</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-white space-y-2 shadow-md">
            <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Become a SuccessIndia Solar Partner
            </h4>
            <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
              Earn attractive multi-level commission rewards when you refer solar projects or register customers in your downline network.
            </p>
            <button
              type="button"
              onClick={() => onOpenAuthModal('register')}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md mt-1"
            >
              Join Solar Referral Network →
            </button>
          </div>
        </motion.div>

        {/* Right: Instant Inquiry / Quote Request (3D Motion) */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-xl space-y-5"
        >
          <div>
            <h3 className="text-2xl font-black text-slate-900">
              Get Free Solar Quotation & On-Site Consultation
            </h3>
            <p className="text-xs text-slate-600 font-bold mt-1">
              Fill in your contact details below to receive expert advice and customized pricing for your property.
            </p>
          </div>

          {inquirySubmitted ? (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-black text-emerald-950 text-base">Inquiry Submitted Successfully!</h4>
              <p className="text-xs text-emerald-900 font-bold">
                Our solar engineer will contact you shortly at <strong>{inquiryPhone}</strong> for <strong>{inquirySetup}</strong>.
              </p>
              <button
                type="button"
                onClick={() => setInquirySubmitted(false)}
                className="mt-2 text-xs font-black text-emerald-800 underline cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="e.g. 9814522052"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    Select Required Solar Setup <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={inquirySetup}
                    onChange={(e) => setInquirySetup(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {setupSolutions.map(s => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                    <option value="Custom Solar Product">Other Custom Solar Product</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  Message / Property Location Details
                </label>
                <textarea
                  rows={3}
                  value={inquiryMsg}
                  onChange={(e) => setInquiryMsg(e.target.value)}
                  placeholder="Specify roof area, monthly electricity bill or pump horsepower requirements..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Solar Quote Request</span>
              </button>
            </form>
          )}
        </motion.div>
      </section>
    </div>
  );
}

