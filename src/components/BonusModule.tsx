import { useState } from 'react';
import { 
  DollarSign, Award, Gift, Layers, TrendingUp, Download, Printer, 
  Sparkles, CheckCircle2, ShieldCheck, ArrowUpRight, BarChart2
} from 'lucide-react';
import { User } from '../types.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';

interface BonusModuleProps {
  user: User;
  isDarkMode?: boolean;
}

export default function BonusModule({ user, isDarkMode = false }: BonusModuleProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'types' | 'history'>('overview');

  // Bonus history records
  const bonusHistory = [
    { refNo: "BON-2026-001", date: "2026-07-31", type: "Direct Sponsor Bonus (12%)", basisBV: 50000, gross: 6000, tds: 300, netPaid: 5700, status: "Paid" },
    { refNo: "BON-2026-002", date: "2026-07-31", type: "Team Level Bonus (6%)", basisBV: 72000, gross: 4320, tds: 216, netPaid: 4104, status: "Paid" },
    { refNo: "BON-2026-003", date: "2026-07-25", type: "Binary Pair Matching Bonus", basisBV: 30000, gross: 3000, tds: 150, netPaid: 2850, status: "Paid" },
    { refNo: "BON-2026-004", date: "2026-07-15", type: "Solar Executive Milestone Reward", basisBV: 100000, gross: 8500, tds: 425, netPaid: 8075, status: "Paid" },
    { refNo: "BON-2026-005", date: "2026-06-30", type: "Monthly Royalty Performance Pool", basisBV: 150000, gross: 12000, tds: 600, netPaid: 11400, status: "Paid" }
  ];

  const totalBonusEarned = bonusHistory.reduce((sum, item) => sum + item.netPaid, 0);

  // Bonus Types Explanatory Cards
  const bonusTypesList = [
    { name: "Direct Sponsor Bonus", percentage: "12% of Direct BV", desc: "Earned instantly on every new partner signup and direct product purchase.", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { name: "Team Level Bonus", percentage: "Up to 15% across L1-L10", desc: "Multi-tier downline override commission calculated on team sales volume.", color: "text-amber-500", bg: "bg-amber-500/10" },
    { name: "Pair / Binary Matching Bonus", percentage: "10% Matched Volume", desc: "Calculated on 1:1 business matching of left leg and right leg downline teams.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Rank & Milestone Reward Bonus", percentage: "Fixed Cash + Gift Awards", desc: "Achieved at key BV thresholds (Solar Star, Executive Director, Crown Ambassador).", color: "text-violet-500", bg: "bg-violet-500/10" },
    { name: "Monthly Performance Royalty Pool", percentage: "3% Company Turnover Pool", desc: "Distributed among top achievers meeting monthly sales targets.", color: "text-blue-500", bg: "bg-blue-500/10" }
  ];

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Ref No", "Date", "Bonus Category", "Basis BV", "Gross Amount (INR)", "TDS Tax (5%)", "Net Payout (INR)", "Status"];
    const rows = bonusHistory.map(b => [b.refNo, b.date, b.type, b.basisBV, b.gross, b.tds, b.netPaid, b.status]);
    exportToCSV("Bonus_Commission_Log", headers, rows);
  };

  // Print PDF
  const handlePrintPDF = () => {
    const headers = ["Ref No", "Date", "Bonus Category", "Basis BV", "Gross Amount", "TDS Tax", "Net Payout", "Status"];
    const rows = bonusHistory.map(b => [b.refNo, b.date, b.type, `${b.basisBV} BV`, `₹${b.gross}`, `₹${b.tds}`, `₹${b.netPaid}`, b.status]);
    printPDFReport("Bonus & Commission Income Report", `Total Net Bonus Payout Disbursed: ₹${totalBonusEarned.toLocaleString('en-IN')}`, headers, rows, { name: user.name, phone: user.phone });
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
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Commission & Royalty Distribution Module</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Bonus & Commission Management</h2>
          <p className="text-xs text-indigo-200/80 font-medium">
            Track Direct, Pair Matching, Level, Milestone, and Monthly Performance Bonus earnings.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
            <span>Print Bonus PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Top Bonus Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border shadow-md space-y-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Total Net Bonus Disbursed</span>
          <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">₹{totalBonusEarned.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-500 font-bold">Credited directly to bank account</span>
        </div>

        <div className={`p-5 rounded-3xl border shadow-md space-y-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Direct Sponsor Income</span>
          <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">₹6,000</div>
          <span className="text-[11px] text-slate-500 font-bold">12% Direct Signup Commission</span>
        </div>

        <div className={`p-5 rounded-3xl border shadow-md space-y-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-black uppercase text-violet-500 tracking-wider">Milestone & Royalty Bonus</span>
          <div className="text-3xl font-black font-mono text-violet-500">₹20,500</div>
          <span className="text-[11px] text-slate-500 font-bold">Executive Rank & Monthly Pool</span>
        </div>
      </div>

      {/* 3. Sub-tabs Switcher */}
      <div className={`p-1.5 rounded-2xl border shadow-sm flex items-center gap-1 overflow-x-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Bonus History Log
        </button>
        <button
          onClick={() => setActiveTab('types')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            activeTab === 'types' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Bonus Compensation Structure
        </button>
      </div>

      {/* 4. BONUS HISTORY LOG TABLE */}
      {activeTab === 'overview' && (
        <div className={`border rounded-3xl overflow-hidden shadow-sm ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Ref No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Bonus Category</th>
                  <th className="p-4">Basis BV Volume</th>
                  <th className="p-4">Gross Bonus</th>
                  <th className="p-4">TDS (5%)</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {bonusHistory.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-indigo-400">{row.refNo}</td>
                    <td className="p-4 text-slate-400">{row.date}</td>
                    <td className="p-4 font-extrabold">{row.type}</td>
                    <td className="p-4 font-mono font-bold">{row.basisBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold">₹{row.gross.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono text-rose-500">-₹{row.tds}</td>
                    <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">₹{row.netPaid.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. BONUS TYPES CARDS */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bonusTypesList.map((item, idx) => (
            <div key={idx} className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm">{item.name}</h4>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${item.bg} ${item.color}`}>
                  {item.percentage}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
