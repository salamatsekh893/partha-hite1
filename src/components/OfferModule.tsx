import { useState } from 'react';
import { 
  Sparkles, Award, Clock, Calendar, CheckCircle2, Trophy, 
  Flame, Zap, Gift, ChevronRight, Target
} from 'lucide-react';
import { User, OfferItem } from '../types.js';
import { INITIAL_OFFERS } from '../data/products.js';

interface OfferModuleProps {
  user: User;
  isDarkMode?: boolean;
}

export default function OfferModule({ user, isDarkMode = false }: OfferModuleProps) {
  const [activeTab, setActiveTab] = useState<'running' | 'upcoming' | 'expired'>('running');

  // Running Offers
  const runningOffers = INITIAL_OFFERS;

  // Upcoming Offers
  const upcomingOffers: OfferItem[] = [
    {
      id: "OFF-201",
      title: "Diwali Luxury Solar Car Award Challenge 2026",
      reward: "Brand New SUV Car / Cash Equivalent ₹12,000,000",
      criteria: "Achieve 5,000,000 Total Downline BV before Diwali 2026.",
      validTill: "10 Nov 2026",
      badge: "Mega Award",
      progressPercent: 25,
      category: "Rank Award"
    },
    {
      id: "OFF-202",
      title: "International Solar Expo Tour - Dubai 2026",
      reward: "4 Days / 3 Nights All-Expense Paid International Flight & 5-Star Hotel Stay",
      criteria: "Build 5 Direct Executive Level Achievers in your downline.",
      validTill: "31 Dec 2026",
      badge: "International Tour",
      progressPercent: 10,
      category: "Tour Incentive"
    }
  ];

  // Expired Offers Archive
  const expiredOffers: OfferItem[] = [
    {
      id: "OFF-099",
      title: "Monsoon Kickoff Double PV Challenge",
      reward: "₹10,000 Cash Credit + 2X Point Value on 3kW Solar Kits",
      criteria: "Order 3 Units of 3kW On-Grid Inverters during July 2026.",
      validTill: "31 Jul 2026",
      badge: "Completed",
      progressPercent: 100,
      category: "Special Booster"
    }
  ];

  return (
    <div className={`space-y-4 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border-amber-500/20 text-white' 
          : 'bg-gradient-to-r from-amber-900 via-slate-900 to-amber-950 text-white border-amber-800'
      }`}>
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Exclusive Partner Promotions & Rewards</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Active Offers & Achiever Incentives</h2>
          <p className="text-[11px] text-amber-100/80 font-medium">
            Qualify for cash bonuses, leadership retreats, professional solar toolkits, and international tours!
          </p>
        </div>
      </div>

      {/* 2. Sub-tabs Switcher */}
      <div className={`p-1.5 rounded-2xl border shadow-sm flex items-center gap-1 overflow-x-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('running')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'running' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🔥 Running Offers ({runningOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'upcoming' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🚀 Upcoming Offers ({upcomingOffers.length})
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'expired' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📁 Expired / Completed Archive
        </button>
      </div>

      {/* 3. OFFERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(activeTab === 'running' ? runningOffers : activeTab === 'upcoming' ? upcomingOffers : expiredOffers).map((item) => (
          <div key={item.id} className={`p-6 rounded-3xl border shadow-md space-y-4 relative overflow-hidden flex flex-col justify-between ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="space-y-3">
              {/* Badge & Category Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-xs">
                  {item.badge}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Valid Till: {item.validTill}
                </span>
              </div>

              <h3 className="font-black text-base leading-snug">{item.title}</h3>

              {/* Reward Highlight Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border border-amber-500/20 space-y-1">
                <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">Award & Gift</span>
                <p className="text-xs font-black text-slate-800 dark:text-amber-300">{item.reward}</p>
              </div>

              {/* Criteria */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Criteria</span>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.criteria}</p>
              </div>
            </div>

            {/* Achievement Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400">Achievement Progress:</span>
                <span className="text-amber-500 font-mono">{item.progressPercent}% Completed</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-500" 
                  style={{ width: `${item.progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
