import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Scale, Percent, Download, Printer, Filter, Calendar, 
  RefreshCw, CheckCircle, ArrowRightLeft, Sparkles, PieChart as PieIcon, 
  BarChart2, Zap, Layers, AlertCircle, ShieldCheck, Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { User, DownlineMember, BusinessTargetConfig } from '../types.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';

interface BusinessRatioModuleProps {
  user: User;
  downlines?: DownlineMember[];
  isDarkMode?: boolean;
}

export default function BusinessRatioModule({ user, downlines = [], isDarkMode = false }: BusinessRatioModuleProps) {
  // Target Config from Admin Panel
  const [targetConfig, setTargetConfig] = useState<BusinessTargetConfig>(() => {
    try {
      const saved = localStorage.getItem('mlm_business_target_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'TARGET-2026-01',
      title: 'Executive Star Royalty & Business Target 2026',
      description: 'BV and PV target setting module according to 50:50 ratio rule for direct and team business.',
      directBvTarget: 10000,
      directPvTarget: 500,
      teamBvTarget: 50000,
      teamPvTarget: 2500,
      ratioRuleEnabled: true,
      strongLegMaxRatio: 50,
      otherLegsMinRatio: 50,
      startDate: '2026-08-01',
      endDate: '2026-12-31',
      isActive: true,
      rewardTitle: 'Executive Star Rank & Royalty Pool Qualification'
    };
  });

  useEffect(() => {
    const handleTargetUpdate = (e: any) => {
      if (e.detail) {
        setTargetConfig(e.detail);
      }
    };
    window.addEventListener('business-target-updated', handleTargetUpdate);
    return () => window.removeEventListener('business-target-updated', handleTargetUpdate);
  }, []);

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

  // Distributor Target & Reward Progress Calculations
  const targetProgress = useMemo(() => {
    // Calculate actual active direct and team members to compute realistic business values
    const activeDirectCount = downlines.filter(m => m.level === 1 && m.status === 'active').length;
    const activeTeamCount = downlines.filter(m => m.level > 1 && m.status === 'active').length;

    // Direct Business BV & PV
    const directBv = activeDirectCount * 25000;
    const directPv = Math.round(directBv / 20); // 1 PV = 20 BV

    // Team Business BV & PV
    const teamBv = activeTeamCount * 25000;
    const teamPv = Math.round(teamBv / 20); // 1 PV = 20 BV

    // Combined Volumes
    const currentBv = directBv + teamBv;
    const currentPv = directPv + teamPv;

    // Targets from backend admin settings
    const targetDirectBv = targetConfig.directBvTarget || 10000;
    const targetDirectPv = targetConfig.directPvTarget || 500;
    const targetTeamBv = targetConfig.teamBvTarget || 50000;
    const targetTeamPv = targetConfig.teamPvTarget || 2500;

    const targetBv = targetDirectBv + targetTeamBv;
    const targetPv = targetDirectPv + targetTeamPv;

    // Percentages per category
    const directBvProgress = targetDirectBv > 0 ? Math.min(100, Math.round((directBv / targetDirectBv) * 100)) : 100;
    const directPvProgress = targetDirectPv > 0 ? Math.min(100, Math.round((directPv / targetDirectPv) * 100)) : 100;
    const teamBvProgress = targetTeamBv > 0 ? Math.min(100, Math.round((teamBv / targetTeamBv) * 100)) : 100;
    const teamPvProgress = targetTeamPv > 0 ? Math.min(100, Math.round((teamPv / targetTeamPv) * 100)) : 100;

    const overallProgress = Math.min(100, Math.round((directBvProgress + directPvProgress + teamBvProgress + teamPvProgress) / 4));

    const isDirectBvAchieved = directBv >= targetDirectBv;
    const isDirectPvAchieved = directPv >= targetDirectPv;
    const isTeamBvAchieved = teamBv >= targetTeamBv;
    const isTeamPvAchieved = teamPv >= targetTeamPv;

    // 50:50 ratio rule
    const maxLeg = Math.max(ratioData.leftBV, ratioData.rightBV);
    const minLeg = Math.min(ratioData.leftBV, ratioData.rightBV);
    const isRatioMet = !targetConfig.ratioRuleEnabled || (minLeg >= maxLeg * (targetConfig.otherLegsMinRatio / targetConfig.strongLegMaxRatio));
    
    // Achieved is true when both direct & team, BV & PV, and ratio rules are completely fulfilled
    const isAchieved = isDirectBvAchieved && isDirectPvAchieved && isTeamBvAchieved && isTeamPvAchieved && isRatioMet;

    const today = new Date();
    const endDateObj = new Date(targetConfig.endDate || '2026-12-31');
    const diffTime = endDateObj.getTime() - today.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      currentBv,
      currentPv,
      directBv,
      directPv,
      teamBv,
      teamPv,
      targetDirectBv,
      targetDirectPv,
      targetTeamBv,
      targetTeamPv,
      targetBv,
      targetPv,
      directBvProgress,
      directPvProgress,
      teamBvProgress,
      teamPvProgress,
      overallProgress,
      isDirectBvAchieved,
      isDirectPvAchieved,
      isTeamBvAchieved,
      isTeamPvAchieved,
      isRatioMet,
      isAchieved,
      daysLeft
    };
  }, [downlines, ratioData, targetConfig]);

  // Handle high-fidelity Printing for Achievement Certificate
  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Пожалуйста, разрешите всплывающие окна для печати сертификата.');
      return;
    }
    const htmlContent = `
      <html>
        <head>
          <title>Success India - Certificate of Achievement - ${user.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print {
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              .no-print { display: none; }
              .cert-bg { background-color: #fffbeb !important; }
            }
            body { font-family: 'Georgia', serif; background-color: #fafaf9; }
            .cert-container { 
              max-width: 900px; 
              margin: 40px auto; 
              padding: 50px; 
              background-color: #fffbeb; 
              border: 18px double #b45309; 
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              position: relative;
            }
            .cert-seal {
              border-radius: 9999px;
              width: 90px;
              height: 90px;
              background: radial-gradient(circle, #f59e0b 0%, #b45309 100%);
              border: 4px solid #fff;
              box-shadow: 0 4px 10px rgba(180, 83, 9, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="cert-container text-center rounded-lg">
            <!-- Interior frame -->
            <div class="border-4 border-amber-600/60 p-8 h-full relative">
              <!-- Corner Ornaments -->
              <div class="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-amber-800"></div>
              <div class="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-amber-800"></div>
              <div class="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-amber-800"></div>
              <div class="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-amber-800"></div>

              <!-- Header Logos -->
              <div class="mb-4">
                <span class="text-xs font-black tracking-widest text-amber-800 uppercase block">SUCCESS INDIA SOLAR ENERGY NETWORK</span>
                <span class="text-[9px] text-slate-500 font-bold block tracking-wider mt-0.5">Global Distribution & Leadership Portal</span>
              </div>

              <!-- Certificate Title -->
              <h1 class="text-4xl font-extrabold text-amber-900 tracking-wide uppercase font-serif mt-2 mb-1">CERTIFICATE OF ACHIEVEMENT</h1>
              <div class="text-[11px] text-slate-500 tracking-widest uppercase font-bold italic mb-6">Achievement & Recognition Certificate</div>

              <!-- Presentation Text -->
              <p class="text-sm text-slate-700 italic mb-2">This is proudly presented to</p>
              <h2 class="text-3xl font-black text-slate-900 border-b-2 border-amber-500/30 pb-1.5 max-w-lg mx-auto mb-4 font-serif tracking-wide">${user.name}</h2>
              <div class="text-[11px] text-indigo-700 font-mono font-bold uppercase tracking-wider mb-8">
                Distributor ID: #${user.id} &bull; Sponsor Phone: ${user.phone}
              </div>

              <!-- Achievement Narrative -->
              <p class="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto mb-8 font-serif">
                For outstanding sales performance, network leadership, and successfully maintaining the strict 
                <strong>50:50 Business Ratio</strong> requirements during the campaign 
                <strong class="text-amber-900">"${targetConfig.title}"</strong>.
                By completing 
                <strong>${targetProgress.directBv.toLocaleString('en-IN')} BV / ${targetProgress.directPv} PV</strong> in Direct Business and 
                <strong>${targetProgress.teamBv.toLocaleString('en-IN')} BV / ${targetProgress.teamPv} PV</strong> in Team Business, 
                they are officially decorated with the prestigious rank of:
              </p>

              <!-- Rank Title Decoration -->
              <div class="bg-amber-100/60 border-2 border-amber-500/40 py-3 px-6 rounded-2xl max-w-md mx-auto mb-8">
                <span class="text-[10px] text-amber-800 font-black block uppercase tracking-widest mb-1">OFFICIALLY DECORATED RANK</span>
                <strong class="text-lg text-amber-900 font-black tracking-wider uppercase font-serif">
                  "${targetConfig.rewardTitle || 'Solar Executive Star'}"
                </strong>
              </div>

              <!-- Rewards & Entitlement -->
              <div class="text-xs text-slate-600 italic max-w-lg mx-auto mb-10 leading-snug">
                This achievement entitles the holder to the premium reward of 
                <strong class="text-slate-900">${targetConfig.rewardGift || 'iPhone 15 Pro'}</strong>, 
                along with a cash bonus of 
                <strong class="text-slate-900">₹${(targetConfig.rewardBonusAmount || 0).toLocaleString('en-IN')}</strong> 
                and exclusive <strong class="text-slate-900">${targetConfig.rewardIncentive || '5% Royalty Pool Shares'}</strong>.
              </div>

              <!-- Footer Signatures -->
              <div class="grid grid-cols-3 gap-6 items-center max-w-lg mx-auto pt-6 border-t border-slate-200/80">
                <div class="text-center">
                  <div class="text-xs font-mono font-bold text-slate-900 border-b border-slate-300 pb-1">${new Date().toLocaleDateString('en-IN')}</div>
                  <div class="text-[9px] text-slate-400 uppercase font-black tracking-wider mt-1">Issue Date</div>
                </div>

                <div class="flex justify-center">
                  <div class="cert-seal flex flex-col items-center justify-center text-white select-none">
                    <span class="text-[10px] font-black tracking-wider uppercase leading-none">GOLD</span>
                    <span class="text-[9px] font-bold leading-none mt-1">SEAL</span>
                  </div>
                </div>

                <div class="text-center">
                  <div class="text-xs font-mono font-bold text-slate-900 border-b border-slate-300 pb-1 italic">SUCCESS INDIA</div>
                  <div class="text-[9px] text-slate-400 uppercase font-black tracking-wider mt-1">Authorized Audit</div>
                </div>
              </div>

              <div class="text-[9px] text-slate-400 font-mono mt-8 uppercase tracking-widest">
                VERIFIED DISTRIBUTOR BLOCKCHAIN SECURED &bull; VERIFICATION CODE: IND-SOLAR-TARGET-ACH-${user.id}
              </div>
            </div>
          </div>
          
          <div class="no-print text-center mt-6">
            <button onclick="window.print()" class="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-lg shadow-md cursor-pointer transition-all">
              🖨️ Print Certificate
            </button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

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

    if (ratioData.totalBV === 0) {
      return [
        computeRow('Current Total', 0, 0)
      ];
    }

    if (timePeriod === 'daily') {
      return [
        computeRow('Today Live', ratioData.leftBV, ratioData.rightBV),
      ];
    } else if (timePeriod === 'weekly') {
      return [
        computeRow('This Week Live', ratioData.leftBV, ratioData.rightBV),
      ];
    } else if (timePeriod === 'monthly') {
      return [
        computeRow('This Month Live', ratioData.leftBV, ratioData.rightBV),
      ];
    } else {
      return [
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

      {/* 1.5 DISTRIBUTOR TARGET MANAGEMENT SYSTEM (BV & PV LIVE PROGRESS CARD) */}
      <div className={`p-5 rounded-3xl border shadow-lg space-y-5 transition-all relative overflow-hidden ${
        targetProgress.isAchieved 
          ? isDarkMode 
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border-emerald-500/50 text-white' 
            : 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 border-emerald-400 text-white shadow-emerald-900/20'
          : isDarkMode 
            ? 'bg-slate-900 border-indigo-500/30 text-white' 
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-800 text-white shadow-indigo-950/20'
      }`}>
        {/* Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-0.5 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                {targetConfig.targetPeriodType === 'monthly' ? '📅 Monthly Target' : targetConfig.targetPeriodType === 'yearly' ? '🏆 Yearly Target' : '⏳ Custom Target'}
              </span>
              <span className="px-2.5 py-0.5 bg-white/15 backdrop-blur-md text-amber-200 font-mono text-[10px] font-bold rounded-full border border-white/20">
                Start: {targetConfig.startDate} ➔ End: {targetConfig.endDate}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold rounded-full border border-emerald-400/30">
                ⏳ {targetProgress.daysLeft > 0 ? `${targetProgress.daysLeft} Days Remaining` : 'Campaign Ending Soon'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-amber-300 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>{targetConfig.title}</span>
            </h3>
            <p className="text-xs text-indigo-100/80 font-medium">
              {targetConfig.description}
            </p>
          </div>

          {/* Achievement Status Badge */}
          <div className="shrink-0 flex items-center gap-2">
            {targetProgress.isAchieved ? (
              <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 animate-bounce">
                <CheckCircle className="w-4 h-4 text-slate-950" />
                <span>🎉 TARGET ACHIEVED!</span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl font-black text-xs text-amber-300 border border-amber-400/30 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>⏳ TARGET IN PROGRESS ({targetProgress.overallProgress}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* BV & PV Progress Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Business Value (BV) Progress Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Business Value (BV) Target
              </span>
              <span className="text-xs font-black font-mono text-amber-200">
                {targetProgress.bvProgress}%
              </span>
            </div>

            <div className="flex items-baseline justify-between font-mono">
              <div>
                <span className="text-2xl font-black text-white">{targetProgress.currentBv.toLocaleString('en-IN')}</span>
                <span className="text-xs text-amber-200 ml-1 font-bold">BV Achieved</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-300">/ {targetProgress.targetBv.toLocaleString('en-IN')} BV Target</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  targetProgress.isBvAchieved ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-gradient-to-r from-amber-500 to-orange-400'
                }`}
                style={{ width: `${targetProgress.bvProgress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-200/90 font-medium">
              <span>Direct BV: <strong>{targetProgress.directBv.toLocaleString('en-IN')}</strong></span>
              <span>Team BV: <strong>{targetProgress.teamBv.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

          {/* Point Value (PV) Progress Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-indigo-400" />
                Point Value (PV) Target
              </span>
              <span className="text-xs font-black font-mono text-indigo-200">
                {targetProgress.pvProgress}%
              </span>
            </div>

            <div className="flex items-baseline justify-between font-mono">
              <div>
                <span className="text-2xl font-black text-white">{targetProgress.currentPv.toLocaleString('en-IN')}</span>
                <span className="text-xs text-indigo-200 ml-1 font-bold">PV Achieved</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-300">/ {targetProgress.targetPv.toLocaleString('en-IN')} PV Target</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  targetProgress.isPvAchieved ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                }`}
                style={{ width: `${targetProgress.pvProgress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-200/90 font-medium">
              <span>Direct PV: <strong>{targetProgress.directPv.toLocaleString('en-IN')}</strong></span>
              <span>Team PV: <strong>{targetProgress.teamPv.toLocaleString('en-IN')}</strong></span>
            </div>
          </div>

        </div>

        {/* Gifts, Rewards & Bonus Showcase Footer Box */}
        <div className="bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              GIFT, REWARD & BONUS UPON TARGET COMPLETION
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              {targetConfig.rewardGift && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30">
                  <span>🎁 Gift:</span>
                  <strong className="text-amber-300">{targetConfig.rewardGift}</strong>
                </div>
              )}
              {targetConfig.rewardIncentive && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-400/30">
                  <span>🌟 Incentive:</span>
                  <strong className="text-indigo-200">{targetConfig.rewardIncentive}</strong>
                </div>
              )}
              {targetConfig.rewardBonusAmount ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-400/30">
                  <span>💵 Cash Bonus:</span>
                  <strong className="text-emerald-300">₹{targetConfig.rewardBonusAmount.toLocaleString('en-IN')}</strong>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0">
            {targetProgress.isAchieved ? (
              <button
                type="button"
                onClick={() => alert(`🎉 congratulations! Your target reward (${targetConfig.rewardGift || 'Executive Reward'}) has been approved for claim in your account!`)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>🏆 CLAIM REWARD</span>
              </button>
            ) : (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">50:50 Ratio Status</span>
                <span className="text-xs font-black text-emerald-400 font-mono">Strong 50% : Others 50%</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 1.6 CERTIFICATE & PROGRESS REPORT SECTION */}
      <div className={`p-6 rounded-3xl border shadow-md space-y-6 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              🏆 Certificate & Progress Audit
            </h3>
            <p className="text-xs text-slate-500">
              Live certificate generation and four-level progress tracking audit report based on target achievements.
            </p>
          </div>
          <button
            onClick={handlePrintCertificate}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Print Certificate</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Certificate Preview Panel */}
          <div className="lg:col-span-7 bg-amber-50/20 dark:bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-amber-200/60 dark:border-slate-800 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
            {/* Watermark Stamp */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.02] pointer-events-none select-none">
              <span className="text-[120px] font-black tracking-widest uppercase font-serif">SOLAR</span>
            </div>

            {/* In Progress / Achieved Stamp Watermark Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] pointer-events-none select-none z-10">
              {targetProgress.isAchieved ? (
                <div className="border-8 border-emerald-500/30 text-emerald-500/35 text-2xl sm:text-4xl font-black px-6 py-3 rounded-3xl uppercase tracking-widest leading-none">
                  🎉 ACHIEVED
                </div>
              ) : (
                <div className="border-8 border-slate-500/25 text-slate-500/25 text-2xl sm:text-4xl font-black px-6 py-3 rounded-3xl uppercase tracking-widest leading-none">
                  ⏳ IN PROGRESS
                </div>
              )}
            </div>

            {/* Certificate Border decoration */}
            <div className="border-2 border-amber-600/40 p-6 flex-1 flex flex-col justify-between relative rounded-xl bg-amber-50/10">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-800"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-800"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-800"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-800"></div>

              <div className="text-center space-y-4">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-extrabold tracking-widest text-amber-700 uppercase block">SUCCESS INDIA PORTAL</span>
                  <span className="text-[16px] font-serif font-black text-slate-800 dark:text-slate-200 block">CERTIFICATE OF ACHIEVEMENT</span>
                  <span className="text-[8px] text-slate-500 block">Achievement & Recognition Certificate</span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 italic">This is proudly presented to</p>
                  <h4 className="text-xl font-serif font-black text-amber-800 dark:text-amber-400 tracking-wide">{user.name}</h4>
                  <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                    ID: #{user.id} &bull; Sponsor: {user.phone}
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-serif">
                  For outstanding performance and successfully fulfilling the <strong>50:50 Business Ratio Leg Matching</strong> requirement of 
                  the campaign <strong>"{targetConfig.title}"</strong>. Fully completed Direct and Team business targets and decorated with the rank of:
                </p>

                <div className="inline-block bg-amber-100/40 dark:bg-amber-950/20 border border-amber-500/30 px-4 py-1.5 rounded-lg">
                  <strong className="text-xs text-amber-900 dark:text-amber-300 font-black tracking-wide uppercase tracking-widest font-serif">
                    "{targetConfig.rewardTitle || 'Solar Executive Star'}"
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-200/50 dark:border-slate-800/80 mt-6 text-[9px] text-slate-400 font-mono">
                <div>
                  <span className="block">Date: {new Date().toLocaleDateString('en-IN')}</span>
                  <span className="block uppercase">Verified Live</span>
                </div>
                <div className="w-10 h-10 rounded-full border border-amber-500/40 bg-amber-500/5 flex items-center justify-center font-black text-[7px] text-amber-700 leading-none text-center">
                  SEAL OF<br/>SUCCESS
                </div>
                <div>
                  <span className="block italic">Audit Status: Approved</span>
                  <span className="block uppercase">Success India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Detailed Live Progress Checklist Panel */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>📊 Progress Audit Checklist (4-Level Verification)</span>
            </h4>

            <div className="space-y-3">
              {/* Milestone 1: Direct BV */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Direct Sales Volume (Direct BV)</span>
                  {targetProgress.isDirectBvAchieved ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full uppercase">Completed</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full uppercase">In Progress</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{targetProgress.directBv.toLocaleString('en-IN')} / {targetProgress.targetDirectBv.toLocaleString('en-IN')} BV</span>
                  <span>{targetProgress.directBvProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${targetProgress.directBvProgress}%` }}></div>
                </div>
              </div>

              {/* Milestone 2: Direct PV */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Direct Point Volume (Direct PV)</span>
                  {targetProgress.isDirectPvAchieved ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full uppercase">Completed</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full uppercase">In Progress</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{targetProgress.directPv.toLocaleString('en-IN')} / {targetProgress.targetDirectPv.toLocaleString('en-IN')} PV</span>
                  <span>{targetProgress.directPvProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${targetProgress.directPvProgress}%` }}></div>
                </div>
              </div>

              {/* Milestone 3: Team BV */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">3. Team Sales Volume (Team BV)</span>
                  {targetProgress.isTeamBvAchieved ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full uppercase">Completed</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full uppercase">In Progress</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{targetProgress.teamBv.toLocaleString('en-IN')} / {targetProgress.targetTeamBv.toLocaleString('en-IN')} BV</span>
                  <span>{targetProgress.teamBvProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${targetProgress.teamBvProgress}%` }}></div>
                </div>
              </div>

              {/* Milestone 4: Team PV */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">4. Team Point Volume (Team PV)</span>
                  {targetProgress.isTeamPvAchieved ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full uppercase">Completed</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full uppercase">In Progress</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>{targetProgress.teamPv.toLocaleString('en-IN')} / {targetProgress.targetTeamPv.toLocaleString('en-IN')} PV</span>
                  <span>{targetProgress.teamPvProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${targetProgress.teamPvProgress}%` }}></div>
                </div>
              </div>

              {/* 50:50 Ratio Status */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">⚡ 50:50 Business Ratio Balance (Leg Matching)</span>
                  {targetProgress.isRatioMet ? (
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full uppercase">Balanced</span>
                  ) : (
                    <span className="text-[9px] bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-full uppercase">Skewed</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                  <span>Score: {ratioData.balanceScore}% Balanced</span>
                  <span>Left: {ratioData.leftPercent}% | Right: {ratioData.rightPercent}%</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

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
              MATCHED VOLUME (2X)
            </span>
            <Zap className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
            {ratioData.eligibleBusiness.toLocaleString('en-IN')} BV
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            2 × Base (50% Stronger + 50% Weaker Matched)
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
