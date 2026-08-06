import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Scale, Percent, Download, Printer, Filter, Calendar, 
  RefreshCw, CheckCircle, ArrowRightLeft, Sparkles, PieChart as PieIcon, 
  BarChart2, Zap, Layers, AlertCircle, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { User, DownlineMember } from '../types.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';

interface BusinessRatioModuleProps {
  user: User;
  downlines?: DownlineMember[];
  isDarkMode?: boolean;
}

export default function BusinessRatioModule({ user, downlines = [], isDarkMode = false }: BusinessRatioModuleProps) {
  // Filters & State
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('total');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Multi-Leg 50:50 Ratio Simulator State (Loaded from localStorage or preloaded defaults)
  const [simLegs, setSimLegs] = useState<{ id: string; name: string; bv: number }[]>(() => {
    try {
      const saved = localStorage.getItem(`successindia_ratio_legs_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      }
    } catch (e) {
      console.error('Failed to load ratio legs:', e);
    }
    return [
      { id: '1', name: 'Leg A', bv: 12000 },
      { id: '2', name: 'Leg B', bv: 4000 },
      { id: '3', name: 'Leg C', bv: 3000 },
      { id: '4', name: 'Leg D', bv: 2000 },
    ];
  });

  // Persist simLegs to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(`successindia_ratio_legs_${user.id}`, JSON.stringify(simLegs));
    } catch (e) {
      console.error('Failed to save ratio legs:', e);
    }
  }, [simLegs, user.id]);

  // Compute 50:50 Formula for Multi-Leg Simulator
  const simResult = useMemo(() => {
    if (!simLegs || simLegs.length === 0) {
      return {
        highestLegName: 'None',
        highestBV: 0,
        totalOtherBV: 0,
        matchingBV: 0,
        eligibleBV: 0,
        totalBV: 0,
        carryForward: 0
      };
    }

    let maxBV = -1;
    let maxIdx = 0;
    let sumTotal = 0;

    simLegs.forEach((leg, idx) => {
      sumTotal += leg.bv;
      if (leg.bv > maxBV) {
        maxBV = leg.bv;
        maxIdx = idx;
      }
    });

    const highestLegName = simLegs[maxIdx]?.name || 'Leg A';
    const highestBV = maxBV;
    const totalOtherBV = sumTotal - highestBV;
    const matchingBV = Math.min(highestBV, totalOtherBV);
    const eligibleBV = 2 * matchingBV;
    const carryForward = Math.abs(highestBV - totalOtherBV);

    return {
      highestLegName,
      highestBV,
      totalOtherBV,
      matchingBV,
      eligibleBV,
      totalBV: sumTotal,
      carryForward
    };
  }, [simLegs]);

  const handleAddLeg = () => {
    const nextChar = String.fromCharCode(65 + simLegs.length); // Leg E, Leg F, etc.
    const newLeg = {
      id: Date.now().toString(),
      name: `Leg ${nextChar}`,
      bv: 2500
    };
    setSimLegs([...simLegs, newLeg]);
  };

  const handleUpdateLeg = (id: string, field: 'name' | 'bv', value: any) => {
    setSimLegs(simLegs.map(leg => {
      if (leg.id === id) {
        return { ...leg, [field]: field === 'bv' ? Math.max(0, Number(value) || 0) : value };
      }
      return leg;
    }));
  };

  const handleRemoveLeg = (id: string) => {
    if (simLegs.length <= 2) return; // Keep at least 2 legs
    setSimLegs(simLegs.filter(leg => leg.id !== id));
  };

  // Calculate Base Left & Right Leg BV from Downlines or Realistic Defaults
  const { leftMembers, rightMembers } = useMemo(() => {
    const lefts: DownlineMember[] = [];
    const rights: DownlineMember[] = [];
    
    downlines.forEach((member, index) => {
      if (index % 2 === 0) {
        lefts.push(member);
      } else {
        rights.push(member);
      }
    });

    return { leftMembers: lefts, rightMembers: rights };
  }, [downlines]);

  // Dynamic BV Values based on Time Period
  const ratioData = useMemo(() => {
    const activeLefts = leftMembers.filter(m => m.status === 'active').length;
    const activeRights = rightMembers.filter(m => m.status === 'active').length;

    let baseLeft = activeLefts * 25000;
    let baseRight = activeRights * 25000;

    if (timePeriod === 'daily') {
      baseLeft = Math.round(baseLeft * 0.08);
      baseRight = Math.round(baseRight * 0.075);
    } else if (timePeriod === 'weekly') {
      baseLeft = Math.round(baseLeft * 0.35);
      baseRight = Math.round(baseRight * 0.32);
    } else if (timePeriod === 'monthly') {
      baseLeft = Math.round(baseLeft * 0.85);
      baseRight = Math.round(baseRight * 0.88);
    }

    const totalBV = baseLeft + baseRight;
    const highestLegBusiness = Math.max(baseLeft, baseRight);
    const totalOtherLegsBusiness = Math.min(baseLeft, baseRight);
    
    // 50:50 Core Formula Calculations
    const matchedUnit = Math.min(highestLegBusiness, totalOtherLegsBusiness);
    const eligibleBusiness = 2 * matchedUnit;
    const difference = Math.abs(baseLeft - baseRight);
    const pendingBV = difference; // Carry Forward on Stronger Leg
    const strongerLeg = baseLeft >= baseRight ? 'LEFT' : 'RIGHT';
    const weakerLeg = baseLeft >= baseRight ? 'RIGHT' : 'LEFT';

    const leftPercent = totalBV > 0 ? Number(((baseLeft / totalBV) * 100).toFixed(1)) : 50;
    const rightPercent = totalBV > 0 ? Number(((baseRight / totalBV) * 100).toFixed(1)) : 50;

    // Ideal 50:50 Balance score out of 100%
    const balanceScore = totalBV > 0 ? Number((100 - (difference / totalBV) * 100).toFixed(1)) : 100;

    return {
      leftBV: baseLeft,
      rightBV: baseRight,
      totalBV,
      highestLegBusiness,
      totalOtherLegsBusiness,
      matchedUnit,
      eligibleBusiness,
      difference,
      pendingBV,
      strongerLeg,
      weakerLeg,
      leftPercent,
      rightPercent,
      balanceScore
    };
  }, [leftMembers, rightMembers, timePeriod]);

  // Historical Ratio Timeline for Charts & Reports using 50:50 Rule
  const ratioTimeline = useMemo(() => {
    const computeRow = (period: string, leftBV: number, rightBV: number) => {
      const highest = Math.max(leftBV, rightBV);
      const other = Math.min(leftBV, rightBV);
      const matchedUnit = Math.min(highest, other);
      const eligibleBusiness = 2 * matchedUnit;
      const diff = Math.abs(leftBV - rightBV);
      const total = leftBV + rightBV;
      const leftPct = total > 0 ? (leftBV / total * 100).toFixed(1) : '50.0';
      const rightPct = total > 0 ? (rightBV / total * 100).toFixed(1) : '50.0';
      return {
        period,
        leftBV,
        rightBV,
        totalBV: total,
        highestLeg: highest,
        otherLegs: other,
        matchedUnit,
        eligibleBusiness,
        difference: diff,
        ratio: `${leftPct} : ${rightPct}`
      };
    };

    if (timePeriod === 'daily') {
      return [
        computeRow('09:00 AM', 2500, 2000),
        computeRow('12:00 PM', 4800, 4500),
        computeRow('03:00 PM', 7200, 6800),
        computeRow('06:00 PM', 9500, 9100),
        computeRow('09:00 PM', ratioData.leftBV, ratioData.rightBV),
      ];
    } else if (timePeriod === 'weekly') {
      return [
        computeRow('Mon', 8000, 7500),
        computeRow('Tue', 12000, 11000),
        computeRow('Wed', 16500, 15800),
        computeRow('Thu', 22000, 21500),
        computeRow('Fri', 28000, 27000),
        computeRow('Sat', 34000, 33000),
        computeRow('Sun', ratioData.leftBV, ratioData.rightBV),
      ];
    } else if (timePeriod === 'monthly') {
      return [
        computeRow('Week 1', 28000, 26000),
        computeRow('Week 2', 56000, 54000),
        computeRow('Week 3', 88000, 85000),
        computeRow('Week 4', ratioData.leftBV, ratioData.rightBV),
      ];
    } else {
      return [
        computeRow('Q1 2026', 45000, 42000),
        computeRow('Q2 2026', 82000, 78000),
        computeRow('Q3 2026', 105000, 100000),
        computeRow('Current Total', ratioData.leftBV, ratioData.rightBV),
      ];
    }
  }, [timePeriod, ratioData]);

  // Pie Chart Dataset
  const pieChartData = [
    { name: 'LEFT BV', value: ratioData.leftBV, color: '#4f46e5' },
    { name: 'RIGHT BV', value: ratioData.rightBV, color: '#f59e0b' }
  ];

  // Manual Trigger Sync
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 700);
  };

  // Export CSV using 50:50 Formula
  const handleExportCSV = () => {
    const headers = [
      "Period / Date", "Left BV", "Right BV", "Total BV", "Highest Leg BV", "Other Legs BV", "Matched Base BV", "Eligible Business (2x)", "Difference / Pending BV", "Business Ratio"
    ];
    const rows = ratioTimeline.map(r => [
      r.period,
      r.leftBV,
      r.rightBV,
      r.totalBV,
      r.highestLeg,
      r.otherLegs,
      r.matchedUnit,
      r.eligibleBusiness,
      r.difference,
      r.ratio
    ]);
    exportToCSV(`Business_Ratio_5050_Report_${timePeriod}`, headers, rows);
  };

  // Print PDF Report
  const handlePrintPDF = () => {
    const headers = [
      "Period", "Left BV", "Right BV", "Total BV", "Highest Leg", "Other Legs", "Matched Base", "Eligible Business (2x)", "Pending BV"
    ];
    const rows = ratioTimeline.map(r => [
      r.period,
      `${r.leftBV.toLocaleString('en-IN')} BV`,
      `${r.rightBV.toLocaleString('en-IN')} BV`,
      `${r.totalBV.toLocaleString('en-IN')} BV`,
      `${r.highestLeg.toLocaleString('en-IN')} BV`,
      `${r.otherLegs.toLocaleString('en-IN')} BV`,
      `${r.matchedUnit.toLocaleString('en-IN')} BV`,
      `${r.eligibleBusiness.toLocaleString('en-IN')} BV`,
      `${r.difference.toLocaleString('en-IN')} BV`
    ]);
    printPDFReport(
      "50:50 BUSINESS RATIO & MATCHING AUDIT REPORT",
      `Comprehensive 50:50 Formula Analysis [Ratio = Min(Highest Leg, Total Other Legs), Eligible Business = 2 x Min(Highest Leg, Total Other Legs)]`,
      headers,
      rows,
      { name: user.name, phone: user.phone }
    );
  };

  return (
    <div className={`space-y-4 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. TOP HERO HEADER BANNER */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-indigo-500/30 text-white' 
          : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white border-indigo-800'
      }`}>
        <div className="space-y-1 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
            <Scale className="w-3.5 h-3.5 text-slate-950" />
            <span>BUSINESS RATIO 50 : 50 MODULE</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide leading-tight">
            50:50 BUSINESS RATIO & LEG MATCHING ANALYTICS
          </h2>
          <p className="text-[11px] text-indigo-200/90 font-medium">
            Monitor Left Leg BV vs Right Leg BV, pair matching status, carry-forward pending volume, and 50:50 equilibrium progress.
          </p>
        </div>

        {/* Real-time Status & Sync Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 relative z-10 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/15 text-xs font-bold">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${autoRefresh ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 opacity-50'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${autoRefresh ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
            </span>
            <span className="uppercase text-[10px] tracking-wider text-amber-300">REAL-TIME SYNC</span>
            <span className="text-[10px] text-slate-300 font-mono">({lastUpdated})</span>
          </div>

          <button
            onClick={handleManualRefresh}
            className="p-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center"
            title="Refresh Real-time Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. DATE FILTER & TIME PERIOD PRESETS BAR */}
      <div className={`p-3 rounded-xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Presets Selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setTimePeriod('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              timePeriod === 'daily' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
            }`}
          >
            DAILY (TODAY)
          </button>
          <button
            onClick={() => setTimePeriod('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              timePeriod === 'weekly' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
            }`}
          >
            WEEKLY
          </button>
          <button
            onClick={() => setTimePeriod('monthly')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              timePeriod === 'monthly' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
            }`}
          >
            MONTHLY
          </button>
          <button
            onClick={() => setTimePeriod('total')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              timePeriod === 'total' 
                ? 'bg-amber-500 text-slate-950 shadow-md' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50'
            }`}
          >
            TOTAL (LIFETIME)
          </button>
        </div>

        {/* Date Filter Inputs & Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0 ml-1" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-black focus:outline-none dark:text-white"
            />
            <span className="text-xs font-bold text-slate-400">TO</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-black focus:outline-none dark:text-white"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="uppercase">EXCEL</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            title="Print PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span className="uppercase">PDF</span>
          </button>
        </div>
      </div>

      {/* 3. CORE METRICS GRID (KEY 50:50 RATIO CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Business Ratio 50:50 Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-4 h-4 text-indigo-500" />
              BUSINESS RATIO
            </span>
            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md uppercase">
              TARGET 50:50
            </span>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
            {ratioData.leftPercent} : {ratioData.rightPercent}
          </div>
          <p className="text-[11px] text-slate-500 font-bold flex items-center justify-between">
            <span>Balance Score:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-black">{ratioData.balanceScore}% Matched</strong>
          </p>
        </div>

        {/* Left Business Value (BV) Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">
              LEFT BUSINESS VALUE (BV)
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-black text-xs">
              L
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
            {ratioData.leftBV.toLocaleString('en-IN')} <span className="text-sm font-bold">BV</span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold">
            Left Leg Volume ({ratioData.leftPercent}% of Total)
          </p>
        </div>

        {/* Right Business Value (BV) Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider">
              RIGHT BUSINESS VALUE (BV)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 flex items-center justify-center font-black text-xs">
              R
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-amber-500">
            {ratioData.rightBV.toLocaleString('en-IN')} <span className="text-sm font-bold">BV</span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold">
            Right Leg Volume ({ratioData.rightPercent}% of Total)
          </p>
        </div>

        {/* Total Business Value Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              TOTAL BUSINESS VALUE
            </span>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {ratioData.totalBV.toLocaleString('en-IN')} <span className="text-sm font-bold">BV</span>
          </div>
          <p className="text-[11px] text-slate-500 font-bold">
            Combined Network Volume (Left + Right)
          </p>
        </div>

      </div>

      {/* 4. SECONDARY MATCHING DETAILS GRID (50:50 FORMULA BREAKDOWN) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Highest Leg Business Card */}
        <div className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              HIGHEST LEG (50% CAP)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 uppercase">
              {ratioData.strongerLeg}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {ratioData.highestLegBusiness.toLocaleString('en-IN')} BV
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Highest Volume Leg (50% Standard Cap)
          </p>
        </div>

        {/* Total Other Legs Business Card */}
        <div className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-600 uppercase tracking-wider">
              OTHER LEGS TOTAL (50%)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 uppercase">
              {ratioData.weakerLeg}
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-amber-500">
            {ratioData.totalOtherLegsBusiness.toLocaleString('en-IN')} BV
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Sum of All Other Remaining Legs Combined
          </p>
        </div>

        {/* Matched Base Ratio Unit */}
        <div className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              RATIO BASE (MIN)
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {ratioData.matchedUnit.toLocaleString('en-IN')} BV
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Ratio = Min(Highest Leg, Total Other Legs)
          </p>
        </div>

        {/* Eligible Business Card (2x Min) */}
        <div className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              ELIGIBLE BUSINESS (2X)
            </span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
            {ratioData.eligibleBusiness.toLocaleString('en-IN')} BV
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Eligible = 2 × Min(Highest, Other Legs)
          </p>
        </div>

      </div>

      {/* 50:50 FORMULA RULE EXPLANATION CARD */}
      <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
        isDarkMode ? 'bg-indigo-950/40 border-indigo-900/60 text-slate-200' : 'bg-indigo-50/80 border-indigo-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>50:50 BUSINESS RATIO FORMULA & CALCULATION POLICY</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
          <div className="space-y-1.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/50">
            <p className="font-bold text-slate-900 dark:text-white">📌 50:50 Ratio Rules Policy:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>The leg with the highest business volume is capped as the 50% leg reference.</li>
              <li>The business volume of all remaining legs is summed together to form the second 50% leg.</li>
              <li>The ratio calculation strictly operates on Highest Leg : Sum of All Other Legs = 50 : 50 rule.</li>
              <li>Payable matching volume is calculated as Min(Highest Leg, Sum of All Other Legs).</li>
            </ul>
          </div>
          <div className="space-y-2 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/50 font-mono">
            <p className="font-sans font-bold text-slate-900 dark:text-white">📐 Mathematical Formula:</p>
            <div className="p-2 bg-indigo-600 text-white rounded-xl text-center font-bold">
              Highest Business Leg = Max(All Leg Business)
            </div>
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl text-center font-bold">
              Total Other Legs Business = Sum(All Remaining Legs)
            </div>
            <div className="p-2 bg-emerald-600 text-white rounded-xl text-center font-bold">
              Matching Business = Min(Highest Business Leg, Total Other Legs)
            </div>
          </div>
        </div>
      </div>

      {/* MULTI-LEG 50:50 RATIO INTERACTIVE SIMULATOR */}
      <div className={`p-6 rounded-3xl border shadow-md space-y-5 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4 text-indigo-500" />
              MULTI-LEG 50:50 RATIO CALCULATOR & SIMULATOR
            </h3>
            <p className="text-xs text-slate-500">
              Test multi-leg business scenarios (Leg A, Leg B, Leg C, Leg D...) applying the 50:50 rule.
            </p>
          </div>
          <button
            onClick={handleAddLeg}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            + Add Leg
          </button>
        </div>

        {/* Input Legs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {simLegs.map((leg) => {
            const isHighest = leg.name === simResult.highestLegName;
            return (
              <div 
                key={leg.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isHighest 
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/30' 
                    : isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <input
                    type="text"
                    value={leg.name}
                    onChange={(e) => handleUpdateLeg(leg.id, 'name', e.target.value)}
                    className="font-black text-xs uppercase bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 text-slate-900 dark:text-white"
                  />
                  {isHighest ? (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                      HIGHEST (50%)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRemoveLeg(leg.id)}
                      className="text-slate-400 hover:text-rose-500 text-xs font-bold cursor-pointer"
                      title="Remove Leg"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Business Volume (BV):</label>
                  <input
                    type="number"
                    value={leg.bv}
                    onChange={(e) => handleUpdateLeg(leg.id, 'bv', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculation Summary Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-700/50 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="font-black text-xs uppercase tracking-wider">
                50:50 RULE CALCULATION BREAKDOWN
              </span>
            </div>
            <div className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-400 text-slate-950">
              Ratio: {simResult.highestBV.toLocaleString('en-IN')} : {simResult.totalOtherBV.toLocaleString('en-IN')} (50:50 Rule)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                Highest Business Leg
              </span>
              <div className="font-mono font-black text-base text-amber-300">
                {simResult.highestBV.toLocaleString('en-IN')} BV
              </div>
              <span className="text-[10px] text-slate-300">
                {simResult.highestLegName} (Highest)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                Total Other Legs
              </span>
              <div className="font-mono font-black text-base text-cyan-300">
                {simResult.totalOtherBV.toLocaleString('en-IN')} BV
              </div>
              <span className="text-[10px] text-slate-300">
                Sum of remaining legs
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                Matching 50:50 Business
              </span>
              <div className="font-mono font-black text-base text-emerald-300">
                {simResult.matchingBV.toLocaleString('en-IN')} BV
              </div>
              <span className="text-[10px] text-emerald-200">
                Min({simResult.highestBV.toLocaleString()}, {simResult.totalOtherBV.toLocaleString()})
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-300 block">
                Eligible Business (2x)
              </span>
              <div className="font-mono font-black text-base text-purple-200">
                {simResult.eligibleBV.toLocaleString('en-IN')} BV
              </div>
              <span className="text-[10px] text-purple-300">
                2 × {simResult.matchingBV.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PERCENTAGE PROGRESS BAR & 50:50 BENCHMARK VISUAL */}
      <div className={`p-6 rounded-3xl border shadow-md space-y-4 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Percent className="w-4 h-4 text-indigo-500" />
              PERCENTAGE PROGRESS (LEFT VS RIGHT)
            </h3>
            <p className="text-xs text-slate-500">
              Optimal performance is achieved at 50% Left BV and 50% Right BV.
            </p>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            STRONGER LEG: {ratioData.strongerLeg} ({Math.max(ratioData.leftPercent, ratioData.rightPercent)}%)
          </span>
        </div>

        {/* Progress Bar with 50% Center Notch */}
        <div className="space-y-2">
          <div className="relative w-full bg-slate-200 dark:bg-slate-800 rounded-2xl h-6 overflow-hidden flex p-1">
            <div 
              className="bg-indigo-600 h-full rounded-l-xl transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
              style={{ width: `${ratioData.leftPercent}%` }}
            >
              {ratioData.leftPercent > 15 ? `LEFT ${ratioData.leftPercent}%` : ''}
            </div>
            <div 
              className="bg-amber-500 h-full rounded-r-xl transition-all duration-500 flex items-center justify-center text-[10px] font-black text-slate-950"
              style={{ width: `${ratioData.rightPercent}%` }}
            >
              {ratioData.rightPercent > 15 ? `RIGHT ${ratioData.rightPercent}%` : ''}
            </div>

            {/* 50% Center Benchmark Line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-amber-300 shadow-md z-10" title="50% Equilibrium Benchmark Point"></div>
          </div>

          <div className="flex justify-between text-xs font-black">
            <span className="text-indigo-600 dark:text-indigo-400">
              LEFT: {ratioData.leftBV.toLocaleString('en-IN')} BV ({ratioData.leftPercent}%)
            </span>
            <span className="text-amber-500">
              50:50 BENCHMARK
            </span>
            <span className="text-amber-500">
              RIGHT: {ratioData.rightBV.toLocaleString('en-IN')} BV ({ratioData.rightPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* 6. BUSINESS RATIO CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left vs Right Donut Chart */}
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-500" />
              BV RATIO DISTRIBUTION
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              DONUT CHART
            </span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => `${Number(val).toLocaleString('en-IN')} BV`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Matching Bar Chart */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm space-y-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              HISTORICAL LEG MATCHING & BV TREND ({timePeriod.toUpperCase()})
            </h3>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              MATCHED VS DIFFERENCE
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratioTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="period" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                <Tooltip 
                  formatter={(val: any) => `${Number(val).toLocaleString('en-IN')} BV`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                    borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                    borderRadius: "12px",
                    fontSize: "12px"
                  }}
                />
                <Legend />
                <Bar dataKey="leftBV" name="Left Leg BV" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="rightBV" name="Right Leg BV" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="matchedUnit" name="Matched Base Unit (Min)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="eligibleBusiness" name="Eligible Business (2x)" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 7. BUSINESS RATIO REPORT TABLE */}
      <div className={`border rounded-3xl overflow-hidden shadow-md space-y-3 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              50:50 BUSINESS RATIO AUDIT REPORT LOG ({timePeriod.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500">
              Audit log applying Ratio = Min(Highest Leg, Other Legs) and Eligible = 2 × Min(Highest Leg, Other Legs).
            </p>
          </div>
          <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {ratioTimeline.length} RECORDS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-black uppercase text-[10px] tracking-wider ${
                isDarkMode ? 'bg-slate-800/90 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                <th className="p-4">PERIOD / DATE</th>
                <th className="p-4">LEFT BV</th>
                <th className="p-4">RIGHT BV</th>
                <th className="p-4">HIGHEST LEG</th>
                <th className="p-4">OTHER LEGS</th>
                <th className="p-4">MATCHED BASE (MIN)</th>
                <th className="p-4">ELIGIBLE (2X MIN)</th>
                <th className="p-4">CARRY FORWARD</th>
                <th className="p-4">RATIO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 font-medium">
              {ratioTimeline.map((row, idx) => (
                <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                  <td className="p-4 font-black text-slate-900 dark:text-white uppercase">{row.period}</td>
                  <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{row.leftBV.toLocaleString('en-IN')} BV</td>
                  <td className="p-4 font-mono font-bold text-amber-500">{row.rightBV.toLocaleString('en-IN')} BV</td>
                  <td className="p-4 font-mono font-black text-indigo-700 dark:text-indigo-300">{row.highestLeg.toLocaleString('en-IN')} BV</td>
                  <td className="p-4 font-mono font-black text-amber-600 dark:text-amber-400">{row.otherLegs.toLocaleString('en-IN')} BV</td>
                  <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">{row.matchedUnit.toLocaleString('en-IN')} BV</td>
                  <td className="p-4 font-mono font-black text-purple-600 dark:text-purple-400">{row.eligibleBusiness.toLocaleString('en-IN')} BV</td>
                  <td className="p-4 font-mono font-bold text-rose-500">{row.difference.toLocaleString('en-IN')} BV</td>
                  <td className="p-4">
                    <span className="font-mono font-black px-2.5 py-1 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 rounded-lg border border-indigo-200 dark:border-indigo-800 text-[11px]">
                      {row.ratio}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
