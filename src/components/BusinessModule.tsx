import { useState } from 'react';
import { 
  TrendingUp, DollarSign, Calendar, Building2, Users, ShoppingBag, 
  Download, Printer, Percent, Sparkles, ArrowUpRight, BarChart2,
  CheckCircle2, Clock, MapPin
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, CartesianGrid, Legend 
} from 'recharts';
import { User, DownlineMember } from '../types.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';

interface BusinessModuleProps {
  user: User;
  downlines: DownlineMember[];
  isDarkMode?: boolean;
}

export default function BusinessModule({ user, downlines, isDarkMode = false }: BusinessModuleProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'daily' | 'product' | 'branch' | 'distributor'>('overview');

  const directCount = downlines.filter(m => m.level === 1).length;
  const teamCount = Math.max(0, downlines.length - directCount);

  // Business calculations
  const directBV = directCount * 25000 + 40000;
  const teamBV = teamCount * 18000 + 32000;
  const totalBV = directBV + teamBV;
  const totalBusinessINR = Math.round(totalBV * 1.25);

  const directRatio = totalBV > 0 ? Math.round((directBV / totalBV) * 100) : 50;
  const teamRatio = 100 - directRatio;

  // Monthly Business Trend Data
  const monthlyBusinessData = [
    { month: 'Jan', directBV: 15000, teamBV: 12000, totalBV: 27000, revenue: 33750 },
    { month: 'Feb', directBV: 22000, teamBV: 18000, totalBV: 40000, revenue: 50000 },
    { month: 'Mar', directBV: 30000, teamBV: 25000, totalBV: 55000, revenue: 68750 },
    { month: 'Apr', directBV: 42000, teamBV: 35000, totalBV: 77000, revenue: 96250 },
    { month: 'May', directBV: 50000, teamBV: 48000, totalBV: 98000, revenue: 122500 },
    { month: 'Jun', directBV: 65000, teamBV: 62000, totalBV: 127000, revenue: 158750 },
    { month: 'Jul', directBV: directBV, teamBV: teamBV, totalBV: totalBV, revenue: totalBusinessINR }
  ];

  // Daily Business Log Data
  const dailyBusinessLog = [
    { date: '2026-08-01', directBV: 10000, teamBV: 18000, totalBV: 28000, newSignups: 2, topProduct: '535W Panels' },
    { date: '2026-07-31', directBV: 25000, teamBV: 12000, totalBV: 37000, newSignups: 3, topProduct: '3kW Inverters' },
    { date: '2026-07-30', directBV: 15000, teamBV: 22000, totalBV: 37000, newSignups: 1, topProduct: '150Ah Batteries' },
    { date: '2026-07-29', directBV: 0, teamBV: 18000, totalBV: 18000, newSignups: 1, topProduct: '5HP Solar Pumps' },
    { date: '2026-07-28', directBV: 20000, teamBV: 15000, totalBV: 35000, newSignups: 2, topProduct: '535W Panels' },
  ];

  // Product Wise Business Breakdown
  const productWiseBusiness = [
    { product: '535W Mono PERC Panels', bv: 420000, salesAmount: 596400, percent: 32 },
    { product: '3kW Grid-Tied Inverters', bv: 616000, salesAmount: 826000, percent: 28 },
    { product: '5kW Hybrid Inverters', bv: 760000, salesAmount: 988000, percent: 22 },
    { product: '5HP Solar Water Pumps', bv: 1020000, salesAmount: 1380000, percent: 12 },
    { product: '150Ah Lithium Batteries', bv: 630000, salesAmount: 868000, percent: 6 }
  ];

  // Branch / Regional Office Wise Business
  const branchWiseBusiness = [
    { code: "BR-NORTH", branch: "North India Regional Hub (New Delhi)", totalBV: 1250000, revenue: 1562500, activeDistributors: 145, topState: "Delhi / Punjab" },
    { code: "BR-SOUTH", branch: "South India Headquarters (Bengaluru)", totalBV: 1850000, revenue: 2312500, activeDistributors: 210, topState: "Karnataka / TN" },
    { code: "BR-WEST", branch: "West India Regional Office (Jaipur / Gujarat)", totalBV: 980000, revenue: 1225000, activeDistributors: 92, topState: "Rajasthan" },
    { code: "BR-EAST", branch: "East India Distribution Center (Kolkata)", totalBV: 640000, revenue: 800000, activeDistributors: 68, topState: "West Bengal" }
  ];

  // Export CSV
  const handleExportCSV = () => {
    let headers = ["Metric / Date", "Direct BV", "Team BV", "Total BV", "Revenue (INR)"];
    let rows = monthlyBusinessData.map(m => [m.month, m.directBV, m.teamBV, m.totalBV, m.revenue]);
    exportToCSV("Business_Volume_Report", headers, rows);
  };

  // Print PDF
  const handlePrintPDF = () => {
    let headers = ["Month", "Direct BV", "Team BV", "Total BV", "Estimated Revenue (INR)"];
    let rows = monthlyBusinessData.map(m => [m.month, `${m.directBV} BV`, `${m.teamBV} BV`, `${m.totalBV} BV`, `₹${m.revenue.toLocaleString('en-IN')}`]);
    printPDFReport("Comprehensive Business Volume (BV) Report", "Direct, Team, and Branch Business Performance Audit", headers, rows, { name: user.name, phone: user.phone });
  };

  return (
    <div className={`space-y-6 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner */}
      <div className={`p-6 rounded-3xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white' 
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-800'
      }`}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-black">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Business Volume & Revenue Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Business Volume (BV) & Branch Analytics</h2>
          <p className="text-xs text-indigo-200/80 font-medium">
            Track Direct BV, Team BV, Monthly & Daily turnover, and Branch performance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total BV Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Total Business Value</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tracking-tight">{totalBV.toLocaleString('en-IN')} BV</div>
          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            Approx. Turnover: <strong className="text-emerald-600 dark:text-emerald-400">₹{totalBusinessINR.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {/* Direct BV Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Direct BV (Level 1)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">{directBV.toLocaleString('en-IN')} BV</div>
          <p className="text-[11px] text-slate-500 font-medium">
            {directCount} Direct Signups & Personal Purchases
          </p>
        </div>

        {/* Team BV Card */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-2 relative overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Team BV (Levels 2+)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-amber-500 tracking-tight">{teamBV.toLocaleString('en-IN')} BV</div>
          <p className="text-[11px] text-slate-500 font-medium">
            {teamCount} Downline Team Network Members
          </p>
        </div>

        {/* Business Ratio */}
        <div className={`p-5 rounded-3xl border shadow-md space-y-3 ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Percent className="w-4 h-4 text-indigo-500" /> Business Ratio
            </span>
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-0.5 rounded-full">
              {directRatio}% : {teamRatio}%
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex">
              <div className="bg-indigo-600 h-full transition-all" style={{ width: `${directRatio}%` }}></div>
              <div className="bg-amber-500 h-full transition-all" style={{ width: `${teamRatio}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-indigo-600 dark:text-indigo-400">Direct: {directBV.toLocaleString('en-IN')} BV</span>
              <span className="text-amber-500">Team: {teamBV.toLocaleString('en-IN')} BV</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Sub-tabs */}
      <div className={`p-1.5 rounded-2xl border shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview & Charts
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Monthly Business Trend
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'daily' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Daily Business Log
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'product' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Product-Wise BV
        </button>
        <button
          onClick={() => setActiveTab('branch')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'branch' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Branch / Regional Hubs
        </button>
      </div>

      {/* 4. TAB VIEWS */}

      {/* Overview Chart */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Monthly Business Volume Growth (BV)</h3>
                <p className="text-xs text-slate-500">Direct BV vs Team BV progression over the current year.</p>
              </div>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                +45% Month-on-Month Growth
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyBusinessData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDirect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTeam" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? "#0f172a" : "#ffffff", 
                      borderColor: isDarkMode ? "#334155" : "#cbd5e1",
                      borderRadius: "12px",
                      fontSize: "12px"
                    }} 
                  />
                  <Area type="monotone" dataKey="directBV" name="Direct BV" stroke="#6366f1" fillOpacity={1} fill="url(#colorDirect)" />
                  <Area type="monotone" dataKey="teamBV" name="Team BV" stroke="#f59e0b" fillOpacity={1} fill="url(#colorTeam)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Business Table */}
      {activeTab === 'monthly' && (
        <div className={`border rounded-3xl overflow-hidden shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Month</th>
                  <th className="p-4">Direct BV (Level 1)</th>
                  <th className="p-4">Team BV (Levels 2+)</th>
                  <th className="p-4">Total Business Volume</th>
                  <th className="p-4">Estimated Turnover (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {monthlyBusinessData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-bold">{row.month} 2026</td>
                    <td className="p-4 font-mono text-indigo-500 font-bold">{row.directBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono text-amber-500 font-bold">{row.teamBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-black">{row.totalBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹{row.revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Business Table */}
      {activeTab === 'daily' && (
        <div className={`border rounded-3xl overflow-hidden shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Date</th>
                  <th className="p-4">Direct BV</th>
                  <th className="p-4">Team BV</th>
                  <th className="p-4">Total BV</th>
                  <th className="p-4">New Signups</th>
                  <th className="p-4">Top Product Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {dailyBusinessLog.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-bold">{row.date}</td>
                    <td className="p-4 font-mono text-indigo-500 font-bold">{row.directBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono text-amber-500 font-bold">{row.teamBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-black">{row.totalBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-bold text-emerald-500">+{row.newSignups} Members</td>
                    <td className="p-4 font-bold">{row.topProduct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branch / Regional Office Business View */}
      {activeTab === 'branch' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branchWiseBusiness.map((b) => (
            <div key={b.code} className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 bg-indigo-600/10 text-indigo-600 rounded-2xl font-black">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black">{b.branch}</h4>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{b.code}</span>
                  </div>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-full border border-indigo-100">
                  {b.topState}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Branch BV</span>
                  <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{b.totalBV.toLocaleString('en-IN')} BV</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Turnover</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">₹{b.revenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
