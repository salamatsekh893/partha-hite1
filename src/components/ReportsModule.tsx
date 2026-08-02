import { useState } from 'react';
import { 
  FileText, Download, Printer, Search, Calendar, Filter, 
  TrendingUp, Users, ShoppingBag, Award, DollarSign, ArrowUpRight,
  Layers, Package, CreditCard, ChevronRight, CheckCircle2
} from 'lucide-react';
import { User, DownlineMember, ProductOrder } from '../types.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';

interface ReportsModuleProps {
  user: User;
  downlines: DownlineMember[];
  orders: ProductOrder[];
  isDarkMode?: boolean;
}

export default function ReportsModule({ user, downlines, orders, isDarkMode = false }: ReportsModuleProps) {
  const [activeReportTab, setActiveReportTab] = useState<
    'direct_business' | 'team_business' | 'product_wise' | 'distributor_wise' | 
    'bonus' | 'earnings' | 'order' | 'transaction'
  >('direct_business');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('all');

  // Direct Distributors (Level 1)
  const directDistributors = downlines.filter(m => m.level === 1);
  const teamDistributors = downlines.filter(m => m.level > 1);

  // Generate Report Data Arrays based on Active Tab
  
  // 1. Direct Business Report Data
  const directBusinessData = directDistributors.map(m => ({
    distributorId: m.phone,
    name: m.name,
    email: m.email,
    level: `Level 1 (Direct)`,
    bv: 25000,
    pv: 250,
    businessInr: 31250,
    commissionEarned: 3750,
    status: m.status.toUpperCase(),
    joinedDate: new Date(m.created_at).toLocaleDateString()
  }));

  // 2. Team Business Report Data
  const teamBusinessData = teamDistributors.map(m => ({
    distributorId: m.phone,
    name: m.name,
    sponsorName: m.referrer_name || 'Team Leader',
    sponsorMobile: m.referrer_phone || '-',
    level: `Level ${m.level}`,
    bv: 18000,
    pv: 180,
    businessInr: 22500,
    overrideCommission: 1080,
    status: m.status.toUpperCase(),
    joinedDate: new Date(m.created_at).toLocaleDateString()
  }));

  // 3. Product Wise Business Report Data
  const productWiseData = [
    { code: "PRD-535W", name: "535W Mono PERC Solar Panel", category: "Solar Panels", unitsSold: 42, totalBV: 420000, totalPV: 4200, salesAmount: 596400, stockRemaining: 180 },
    { code: "PRD-3KW", name: "3kW On-Grid Solar Inverter Pro", category: "Inverters", unitsSold: 28, totalBV: 616000, totalPV: 6160, salesAmount: 826000, stockRemaining: 95 },
    { code: "PRD-5KW", name: "5kW Hybrid Solar Inverter (Grid & Battery)", category: "Inverters", unitsSold: 19, totalBV: 760000, totalPV: 7600, salesAmount: 988000, stockRemaining: 45 },
    { code: "PRD-5HP", name: "5HP Submersible Solar Water Pump System", category: "Solar Pumps", unitsSold: 12, totalBV: 1020000, totalPV: 10200, salesAmount: 1380000, stockRemaining: 24 },
    { code: "PRD-150AH", name: "150Ah 48V Lithium-ion Solar Battery", category: "Batteries", unitsSold: 35, totalBV: 630000, totalPV: 6300, salesAmount: 868000, stockRemaining: 110 },
    { code: "PRD-60W", name: "60W All-in-One Solar Street Light", category: "Street Lights", unitsSold: 85, totalBV: 382500, totalPV: 3825, salesAmount: 527000, stockRemaining: 320 }
  ];

  // 4. Distributor Wise Business Report Data
  const distributorWiseData = downlines.map(m => {
    const isDirect = m.level === 1;
    const personalBV = isDirect ? 25000 : 18000;
    const teamBV = isDirect ? 45000 : 12000;
    const totalBV = personalBV + teamBV;
    return {
      distributorId: m.phone,
      name: m.name,
      level: `Level ${m.level}`,
      personalBV,
      teamBV,
      totalBV,
      totalPV: Math.round(totalBV / 100),
      rank: totalBV >= 50000 ? 'Executive Partner' : 'Star Distributor',
      status: m.status.toUpperCase()
    };
  });

  // 5. Bonus Report Data
  const bonusReportData = [
    { refNo: "BON-2026-001", date: "2026-07-31", type: "Direct Bonus (12%)", basisBV: 50000, amount: 6000, taxDeducted: 300, netPaid: 5700, status: "Paid" },
    { refNo: "BON-2026-002", date: "2026-07-31", type: "Team Level Bonus (6%)", basisBV: 72000, amount: 4320, taxDeducted: 216, netPaid: 4104, status: "Paid" },
    { refNo: "BON-2026-003", date: "2026-07-25", type: "Pair Matching Bonus", basisBV: 30000, amount: 3000, taxDeducted: 150, netPaid: 2850, status: "Paid" },
    { refNo: "BON-2026-004", date: "2026-07-15", type: "Solar Executive Milestone Reward", basisBV: 100000, amount: 8500, taxDeducted: 425, netPaid: 8075, status: "Paid" },
    { refNo: "BON-2026-005", date: "2026-06-30", type: "Monthly Performance Royalty Pool", basisBV: 150000, amount: 12000, taxDeducted: 600, netPaid: 11400, status: "Paid" }
  ];

  // 6. Earnings Report Data
  const earningsReportData = [
    { period: "July 2026", directIncome: 6000, teamIncome: 4320, rewardBonus: 8500, totalGross: 18820, tdsDeduction: 941, netPayout: 17879, status: "Disbursed to Bank" },
    { period: "June 2026", directIncome: 5000, teamIncome: 3800, rewardBonus: 12000, totalGross: 20800, tdsDeduction: 1040, netPayout: 19760, status: "Disbursed to Bank" },
    { period: "May 2026", directIncome: 4500, teamIncome: 2900, rewardBonus: 5000, totalGross: 12400, tdsDeduction: 620, netPayout: 11780, status: "Disbursed to Bank" },
    { period: "April 2026", directIncome: 3000, teamIncome: 1800, rewardBonus: 2500, totalGross: 7300, tdsDeduction: 365, netPayout: 6935, status: "Disbursed to Bank" }
  ];

  // 7. Order Report Data
  const orderReportData = orders.map(o => ({
    orderId: o.id,
    date: o.orderDate,
    product: o.productName,
    qty: o.qty,
    amount: `₹${o.totalAmount.toLocaleString('en-IN')}`,
    bvCredited: `${o.totalBV} BV`,
    pvCredited: `${o.totalPV} PV`,
    address: o.shippingAddress,
    status: o.status
  }));

  // 8. Transaction Report Data
  const transactionReportData = [
    { txId: "TXN-99401", date: "2026-07-31", type: "CREDIT", category: "Bonus Payout", description: "Monthly Direct & Team Commission Payout", bv: 122000, amount: "₹18,820", status: "Success" },
    { txId: "TXN-99388", date: "2026-07-28", type: "DEBIT", category: "Product Purchase", description: "Order #ORD-84201 - 535W Panels", bv: 20000, amount: "₹28,400", status: "Completed" },
    { txId: "TXN-99342", date: "2026-07-20", type: "CREDIT", category: "Direct Sponsor BV", description: "Direct Referral Signup BV Credit", bv: 25000, amount: "250 PV", status: "Credited" },
    { txId: "TXN-99290", date: "2026-07-15", type: "CREDIT", category: "Reward Bonus", description: "Executive Milestone Cash Reward", bv: 0, amount: "₹8,500", status: "Completed" }
  ];

  // Handle Export Excel (CSV)
  const handleExportCSV = () => {
    let filename = "";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReportTab === 'direct_business') {
      filename = "Direct_Business_Report";
      headers = ["Distributor ID", "Name", "Email", "Tier", "Business Value (BV)", "Point Value (PV)", "Business Value (INR)", "Commission Earned (INR)", "Status", "Joined Date"];
      rows = directBusinessData.map(d => [d.distributorId, d.name, d.email, d.level, d.bv, d.pv, d.businessInr, d.commissionEarned, d.status, d.joinedDate]);
    } else if (activeReportTab === 'team_business') {
      filename = "Team_Business_Report";
      headers = ["Distributor ID", "Name", "Sponsor Name", "Sponsor Mobile", "Tier Level", "BV", "PV", "Business Amount (INR)", "Team Override (INR)", "Status", "Joined Date"];
      rows = teamBusinessData.map(d => [d.distributorId, d.name, d.sponsorName, d.sponsorMobile, d.level, d.bv, d.pv, d.businessInr, d.overrideCommission, d.status, d.joinedDate]);
    } else if (activeReportTab === 'product_wise') {
      filename = "Product_Wise_Business_Report";
      headers = ["Product Code", "Product Name", "Category", "Units Sold", "Total BV", "Total PV", "Total Sales Amount (INR)", "Stock Remaining"];
      rows = productWiseData.map(d => [d.code, d.name, d.category, d.unitsSold, d.totalBV, d.totalPV, d.salesAmount, d.stockRemaining]);
    } else if (activeReportTab === 'distributor_wise') {
      filename = "Distributor_Wise_Performance_Report";
      headers = ["Distributor Mobile ID", "Name", "Network Level", "Personal BV", "Team BV", "Total BV", "Total PV", "Rank Title", "Status"];
      rows = distributorWiseData.map(d => [d.distributorId, d.name, d.level, d.personalBV, d.teamBV, d.totalBV, d.totalPV, d.rank, d.status]);
    } else if (activeReportTab === 'bonus') {
      filename = "Bonus_Commission_History_Report";
      headers = ["Bonus Ref No", "Date", "Bonus Type", "Basis BV", "Gross Amount (INR)", "TDS Tax (INR)", "Net Paid (INR)", "Status"];
      rows = bonusReportData.map(d => [d.refNo, d.date, d.type, d.basisBV, d.amount, d.taxDeducted, d.netPaid, d.status]);
    } else if (activeReportTab === 'earnings') {
      filename = "Earnings_Payout_Statement_Report";
      headers = ["Earnings Period", "Direct Income (INR)", "Team Income (INR)", "Reward Bonus (INR)", "Total Gross Income", "TDS Deduction", "Net Payout", "Disbursement Status"];
      rows = earningsReportData.map(d => [d.period, d.directIncome, d.teamIncome, d.rewardBonus, d.totalGross, d.tdsDeduction, d.netPayout, d.status]);
    } else if (activeReportTab === 'order') {
      filename = "Product_Order_History_Report";
      headers = ["Order ID", "Order Date", "Product Name", "Quantity", "Total Amount", "BV Credited", "PV Credited", "Delivery Address", "Status"];
      rows = orderReportData.map(d => [d.orderId, d.date, d.product, d.qty, d.amount, d.bvCredited, d.pvCredited, d.address, d.status]);
    } else if (activeReportTab === 'transaction') {
      filename = "Financial_Transaction_Log_Report";
      headers = ["Transaction ID", "Date", "TX Type", "Category", "Description", "BV Volume", "Amount / PV", "Status"];
      rows = transactionReportData.map(d => [d.txId, d.date, d.type, d.category, d.description, d.bv, d.amount, d.status]);
    }

    exportToCSV(filename, headers, rows);
  };

  // Handle Export Formatted Printable PDF
  const handlePrintPDF = () => {
    let title = "";
    let subtitle = "";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReportTab === 'direct_business') {
      title = "Direct Distributor Business Report";
      subtitle = "Comprehensive audit of Level 1 direct referrals, BV generated, and direct commissions.";
      headers = ["Distributor ID", "Name", "Email", "BV", "PV", "Business (INR)", "Commission (INR)", "Status"];
      rows = directBusinessData.map(d => [d.distributorId, d.name, d.email, `${d.bv} BV`, `${d.pv} PV`, `₹${d.businessInr.toLocaleString('en-IN')}`, `₹${d.commissionEarned.toLocaleString('en-IN')}`, d.status]);
    } else if (activeReportTab === 'team_business') {
      title = "Team Downline Business Report";
      subtitle = "Multi-tier team volume performance across Levels 2+ downline networks.";
      headers = ["Distributor ID", "Name", "Sponsor", "Tier", "BV", "PV", "Business (INR)", "Team Override", "Status"];
      rows = teamBusinessData.map(d => [d.distributorId, d.name, d.sponsorName, d.level, `${d.bv} BV`, `${d.pv} PV`, `₹${d.businessInr.toLocaleString('en-IN')}`, `₹${d.overrideCommission.toLocaleString('en-IN')}`, d.status]);
    } else if (activeReportTab === 'product_wise') {
      title = "Product-Wise Business & Sales Report";
      subtitle = "Sales turnover, BV, and PV generation broken down by individual solar products.";
      headers = ["Code", "Product Name", "Category", "Qty Sold", "Total BV", "Total PV", "Total Sales (INR)"];
      rows = productWiseData.map(d => [d.code, d.name, d.category, d.unitsSold, `${d.totalBV.toLocaleString('en-IN')} BV`, `${d.totalPV} PV`, `₹${d.salesAmount.toLocaleString('en-IN')}`]);
    } else if (activeReportTab === 'distributor_wise') {
      title = "Distributor Performance Summary Report";
      subtitle = "Rank titles, personal BV, and team BV breakdown per distributor.";
      headers = ["Distributor Mobile ID", "Name", "Level", "Personal BV", "Team BV", "Total BV", "Rank Title", "Status"];
      rows = distributorWiseData.map(d => [d.distributorId, d.name, d.level, `${d.personalBV} BV`, `${d.teamBV} BV`, `${d.totalBV} BV`, d.rank, d.status]);
    } else if (activeReportTab === 'bonus') {
      title = "Bonus & Commission Statement Report";
      subtitle = "Detailed audit of direct, team, binary pair, and rank milestone bonus payouts.";
      headers = ["Ref No", "Date", "Bonus Type", "Basis BV", "Gross Amount", "TDS Tax", "Net Paid", "Status"];
      rows = bonusReportData.map(d => [d.refNo, d.date, d.type, `${d.basisBV} BV`, `₹${d.amount}`, `₹${d.taxDeducted}`, `₹${d.netPaid}`, d.status]);
    } else if (activeReportTab === 'earnings') {
      title = "Monthly Earnings & Bank Payout Report";
      subtitle = "Monthly gross income, TDS tax deductions, and bank disbursement receipts.";
      headers = ["Period", "Direct Income", "Team Income", "Reward Bonus", "Total Gross", "TDS Tax", "Net Payout", "Disbursement Status"];
      rows = earningsReportData.map(d => [d.period, `₹${d.directIncome}`, `₹${d.teamIncome}`, `₹${d.rewardBonus}`, `₹${d.totalGross}`, `₹${d.tdsDeduction}`, `₹${d.netPayout}`, d.status]);
    } else if (activeReportTab === 'order') {
      title = "Solar Product Order History Report";
      subtitle = "Order details, billing amounts, and BV/PV point allocations.";
      headers = ["Order ID", "Date", "Product Name", "Qty", "Amount (INR)", "BV Credited", "PV Credited", "Status"];
      rows = orderReportData.map(d => [d.orderId, d.date, d.product, d.qty, d.amount, d.bvCredited, d.pvCredited, d.status]);
    } else if (activeReportTab === 'transaction') {
      title = "Financial & Point Volume Transaction Log";
      subtitle = "Detailed credit/debit audit trail for wallet, BV credits, and order deductions.";
      headers = ["Tx ID", "Date", "Type", "Category", "Description", "BV Volume", "Amount / PV", "Status"];
      rows = transactionReportData.map(d => [d.txId, d.date, d.type, d.category, d.description, `${d.bv} BV`, d.amount, d.status]);
    }

    printPDFReport(title, subtitle, headers, rows, { name: user.name, phone: user.phone });
  };

  const reportTabs = [
    { id: 'direct_business', label: 'Direct Business Report', icon: Users, color: 'text-indigo-600' },
    { id: 'team_business', label: 'Team Business Report', icon: Layers, color: 'text-amber-600' },
    { id: 'product_wise', label: 'Product Wise Report', icon: ShoppingBag, color: 'text-emerald-600' },
    { id: 'distributor_wise', label: 'Distributor Wise Report', icon: Award, color: 'text-violet-600' },
    { id: 'bonus', label: 'Bonus Report', icon: DollarSign, color: 'text-blue-600' },
    { id: 'earnings', label: 'Earnings Report', icon: TrendingUp, color: 'text-emerald-500' },
    { id: 'order', label: 'Order Report', icon: Package, color: 'text-amber-500' },
    { id: 'transaction', label: 'Transaction Report', icon: CreditCard, color: 'text-purple-600' },
  ];

  return (
    <div className={`space-y-6 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner with Export Tools */}
      <div className={`p-6 rounded-3xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white' 
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-800'
      }`}>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-black">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Executive Business Intelligence Reports Module</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">System Financial & Network Reports</h2>
          <p className="text-xs text-indigo-200/80 font-medium">
            Filter, inspect, export to Excel (CSV), or print official certified PDF reports.
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            <span>Print Formatted PDF Report</span>
          </button>
        </div>
      </div>

      {/* 2. 8-Report Type Switcher */}
      <div className={`p-2 rounded-2xl border shadow-sm grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 overflow-x-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {reportTabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl text-[11px] font-black transition-all cursor-pointer text-center leading-tight gap-1.5 ${
                isActive
                  ? isDarkMode
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-indigo-600 text-white shadow-md'
                  : isDarkMode
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Report Data Table Container */}
      <div className={`border rounded-3xl overflow-hidden shadow-sm ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Table Top Controls */}
        <div className={`p-4 sm:px-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter current report rows..."
              className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Timeframe:
            </span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold focus:outline-none cursor-pointer ${
                isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <option value="all">All Time History</option>
              <option value="this_month">This Month (July 2026)</option>
              <option value="last_month">Last Month (June 2026)</option>
              <option value="this_year">Financial Year 2026-27</option>
            </select>
          </div>
        </div>

        {/* 4. DYNAMIC REPORT TABLES */}

        {/* 1. Direct Business Report */}
        {activeReportTab === 'direct_business' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Distributor Mobile ID</th>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Business Volume (BV)</th>
                  <th className="p-4">Point Value (PV)</th>
                  <th className="p-4">Business (INR)</th>
                  <th className="p-4">Commission (12%)</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {directBusinessData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-indigo-400">{row.distributorId}</td>
                    <td className="p-4">
                      <div className="font-bold">{row.name}</div>
                      <div className="text-[11px] text-slate-400">{row.email}</div>
                    </td>
                    <td className="p-4"><span className="bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">{row.level}</span></td>
                    <td className="p-4 font-mono font-black">{row.bv.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold">{row.pv} PV</td>
                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">₹{row.businessInr.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">+₹{row.commissionEarned.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Team Business Report */}
        {activeReportTab === 'team_business' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Distributor ID</th>
                  <th className="p-4">Team Member</th>
                  <th className="p-4">Sponsor Mobile</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Team BV</th>
                  <th className="p-4">Team PV</th>
                  <th className="p-4">Business Amount</th>
                  <th className="p-4">Team Override (6%)</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {teamBusinessData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-amber-500">{row.distributorId}</td>
                    <td className="p-4 font-bold">{row.name}</td>
                    <td className="p-4 font-mono text-slate-400">{row.sponsorMobile}</td>
                    <td className="p-4"><span className="bg-amber-100 text-amber-800 font-black px-2.5 py-0.5 rounded-full text-[10px]">{row.level}</span></td>
                    <td className="p-4 font-mono font-black">{row.bv.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold">{row.pv} PV</td>
                    <td className="p-4 font-mono font-bold">₹{row.businessInr.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono font-black text-amber-600 dark:text-amber-400">+₹{row.overrideCommission.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Product Wise Report */}
        {activeReportTab === 'product_wise' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Code</th>
                  <th className="p-4">Solar Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Units Sold</th>
                  <th className="p-4">Generated BV</th>
                  <th className="p-4">Generated PV</th>
                  <th className="p-4">Total Sales (INR)</th>
                  <th className="p-4 text-center">In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {productWiseData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-indigo-400">{row.code}</td>
                    <td className="p-4 font-extrabold">{row.name}</td>
                    <td className="p-4"><span className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{row.category}</span></td>
                    <td className="p-4 font-black">{row.unitsSold} Units</td>
                    <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold">{row.totalPV} PV</td>
                    <td className="p-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">₹{row.salesAmount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center font-bold">{row.stockRemaining} Units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Distributor Wise Report */}
        {activeReportTab === 'distributor_wise' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Distributor Mobile</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Network Level</th>
                  <th className="p-4">Personal BV</th>
                  <th className="p-4">Team BV</th>
                  <th className="p-4">Total BV</th>
                  <th className="p-4">Rank Title</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {distributorWiseData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-violet-400">{row.distributorId}</td>
                    <td className="p-4 font-bold">{row.name}</td>
                    <td className="p-4"><span className="bg-violet-100 text-violet-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">{row.level}</span></td>
                    <td className="p-4 font-mono font-bold">{row.personalBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold">{row.teamBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400">{row.totalBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-extrabold text-amber-500">{row.rank}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Bonus Report */}
        {activeReportTab === 'bonus' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Ref No</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Bonus Category</th>
                  <th className="p-4">Basis BV</th>
                  <th className="p-4">Gross Bonus</th>
                  <th className="p-4">TDS (5%)</th>
                  <th className="p-4">Net Paid</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {bonusReportData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-blue-400">{row.refNo}</td>
                    <td className="p-4 text-slate-400">{row.date}</td>
                    <td className="p-4 font-extrabold">{row.type}</td>
                    <td className="p-4 font-mono font-bold">{row.basisBV.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono text-rose-500">-₹{row.taxDeducted}</td>
                    <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">₹{row.netPaid.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Earnings Report */}
        {activeReportTab === 'earnings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Earnings Period</th>
                  <th className="p-4">Direct Income</th>
                  <th className="p-4">Team Income</th>
                  <th className="p-4">Reward Bonus</th>
                  <th className="p-4">Gross Total</th>
                  <th className="p-4">TDS Deduction</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4 text-center">Disbursement Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {earningsReportData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-bold">{row.period}</td>
                    <td className="p-4 font-mono">₹{row.directIncome.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono">₹{row.teamIncome.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono text-amber-500">₹{row.rewardBonus.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono font-bold">₹{row.totalGross.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-mono text-rose-500">-₹{row.tdsDeduction}</td>
                    <td className="p-4 font-mono font-black text-emerald-600 dark:text-emerald-400">₹{row.netPayout.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Order Report */}
        {activeReportTab === 'order' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Product Purchased</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">BV Credited</th>
                  <th className="p-4">PV Credited</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {orderReportData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-amber-500">{row.orderId}</td>
                    <td className="p-4 text-slate-400">{row.date}</td>
                    <td className="p-4 font-bold">{row.product}</td>
                    <td className="p-4 font-black">{row.qty}</td>
                    <td className="p-4 font-mono font-extrabold">{row.amount}</td>
                    <td className="p-4 font-mono font-black text-indigo-600 dark:text-indigo-400">{row.bvCredited}</td>
                    <td className="p-4 font-mono font-bold">{row.pvCredited}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 8. Transaction Report */}
        {activeReportTab === 'transaction' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">BV Credit/Debit</th>
                  <th className="p-4">Amount / PV</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {transactionReportData.map((row, idx) => (
                  <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                    <td className="p-4 font-mono font-bold text-purple-400">{row.txId}</td>
                    <td className="p-4 text-slate-400">{row.date}</td>
                    <td className="p-4"><span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${row.type === 'CREDIT' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{row.type}</span></td>
                    <td className="p-4 font-extrabold">{row.category}</td>
                    <td className="p-4 text-slate-400">{row.description}</td>
                    <td className="p-4 font-mono font-black">{row.bv.toLocaleString('en-IN')} BV</td>
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.amount}</td>
                    <td className="p-4 text-center"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-black">{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
