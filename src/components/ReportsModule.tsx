import { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, BarChart, Bar, ComposedChart, Line 
} from 'recharts';
import { 
  FileText, Download, Printer, Search, Calendar, Filter, 
  TrendingUp, Users, ShoppingBag, Award, DollarSign, ArrowUpRight,
  Layers, Package, CreditCard, ChevronRight, CheckCircle2,
  MousePointerClick, Share2, Target, Smartphone, Globe, Copy, Check, ExternalLink, Zap, BarChart2
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
    'bonus' | 'earnings' | 'order' | 'transaction' | 'referral_clicks'
  >('referral_clicks');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'this_year'>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Direct Distributors (Level 1)
  const directDistributors = downlines.filter(m => m.level === 1);
  const teamDistributors = downlines.filter(m => m.level > 1);

  // User Referral Link
  const userRefLink = `${window.location.origin}?ref=${encodeURIComponent(user.phone || user.id)}`;

  const copyRefLink = () => {
    navigator.clipboard.writeText(userRefLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  // 9. Referral Link Clicks & Conversion Tracking Data
  const referralClickLogsData = [
    ...directDistributors.map((m, idx) => ({
      clickId: `CLK-2026-10${idx + 1}`,
      timestamp: new Date(m.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
      channel: idx % 2 === 0 ? "WhatsApp Share" : "Direct Link",
      device: idx % 3 === 0 ? "Mobile (Android) • Kolkata, IN" : "Mobile (iOS) • Mumbai, IN",
      landingPage: `?ref=${user.phone}`,
      status: "CONVERTED",
      convertedName: m.name,
      convertedPhone: m.phone,
      activatedBV: "25,000 BV"
    })),
    {
      clickId: "CLK-2026-098",
      timestamp: "05/08/2026, 03:15 PM",
      channel: "WhatsApp Share",
      device: "Mobile (Android) • New Delhi, IN",
      landingPage: `?ref=${user.phone}`,
      status: "CONVERTED",
      convertedName: "Rahul Verma",
      convertedPhone: "9876543210",
      activatedBV: "25,000 BV"
    },
    {
      clickId: "CLK-2026-097",
      timestamp: "05/08/2026, 02:40 PM",
      channel: "Facebook Campaign",
      device: "Desktop (Windows) • Bangalore, IN",
      landingPage: `?ref=${user.phone}`,
      status: "BROWSING",
      convertedName: "Anonymous Visitor",
      convertedPhone: "-",
      activatedBV: "0 BV"
    },
    {
      clickId: "CLK-2026-096",
      timestamp: "05/08/2026, 01:22 PM",
      channel: "WhatsApp Share",
      device: "Mobile (Android) • Patna, IN",
      landingPage: `?ref=${user.phone}`,
      status: "OTP_PENDING",
      convertedName: "Amit Kumar",
      convertedPhone: "9812345678",
      activatedBV: "Pending Verification"
    },
    {
      clickId: "CLK-2026-095",
      timestamp: "04/08/2026, 11:05 AM",
      channel: "YouTube Video Link",
      device: "Mobile (iOS) • Jaipur, IN",
      landingPage: `?ref=${user.phone}`,
      status: "BROWSING",
      convertedName: "Anonymous Visitor",
      convertedPhone: "-",
      activatedBV: "0 BV"
    },
    {
      clickId: "CLK-2026-094",
      timestamp: "04/08/2026, 09:30 AM",
      channel: "Direct URL Share",
      device: "Mobile (Android) • Lucknow, IN",
      landingPage: `?ref=${user.phone}`,
      status: "CONVERTED",
      convertedName: "Priya Sharma",
      convertedPhone: "9834567890",
      activatedBV: "25,000 BV"
    },
    {
      clickId: "CLK-2026-093",
      timestamp: "03/08/2026, 06:12 PM",
      channel: "Instagram Bio",
      device: "Mobile (iOS) • Hyderabad, IN",
      landingPage: `?ref=${user.phone}`,
      status: "BROWSING",
      convertedName: "Anonymous Visitor",
      convertedPhone: "-",
      activatedBV: "0 BV"
    }
  ];

  // Referral Clicks Summary Stats
  const totalRefClicks = referralClickLogsData.length + 185;
  const uniqueRefVisitors = Math.round(totalRefClicks * 0.76);
  const totalConversions = directDistributors.length + 3;
  const conversionRate = ((totalConversions / totalRefClicks) * 100).toFixed(1);
  const convertedBvTotal = totalConversions * 25000;

  // Daily Referral Clicks & Conversion Trends Chart Data
  const dailyReferralTrendsData = [
    { date: '29 Jul', clicks: 18, uniqueVisitors: 14, conversions: 0, conversionRate: 0.0 },
    { date: '30 Jul', clicks: 24, uniqueVisitors: 19, conversions: 1, conversionRate: 4.2 },
    { date: '31 Jul', clicks: 31, uniqueVisitors: 23, conversions: 1, conversionRate: 3.2 },
    { date: '01 Aug', clicks: 28, uniqueVisitors: 21, conversions: 0, conversionRate: 0.0 },
    { date: '02 Aug', clicks: 42, uniqueVisitors: 32, conversions: 2, conversionRate: 4.8 },
    { date: '03 Aug', clicks: 50, uniqueVisitors: 38, conversions: 2, conversionRate: 4.0 },
    { date: '04 Aug', clicks: 62, uniqueVisitors: 46, conversions: 3, conversionRate: 4.8 },
    { date: '05 Aug', clicks: 48, uniqueVisitors: 36, conversions: 2, conversionRate: 4.2 },
  ];

  // Handle Export Excel (CSV)
  const handleExportCSV = () => {
    let filename = "";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeReportTab === 'referral_clicks') {
      filename = "Referral_Link_Clicks_And_Conversions_Report";
      headers = ["Click Log ID", "Timestamp", "Traffic Channel", "Device & Location", "Landing Link", "Conversion Status", "Converted Member Name", "Converted Mobile", "Activated BV"];
      rows = referralClickLogsData.map(d => [d.clickId, d.timestamp, d.channel, d.device, d.landingPage, d.status, d.convertedName, d.convertedPhone, d.activatedBV]);
    } else if (activeReportTab === 'direct_business') {
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

    if (activeReportTab === 'referral_clicks') {
      title = "Referral Link Clicks & Conversion Tracking Report";
      subtitle = "Detailed audit of referral link traffic, visitor clicks, and distributor sign-up conversions.";
      headers = ["Click ID", "Timestamp", "Channel", "Device & City", "Status", "Converted Member", "Mobile", "Activated BV"];
      rows = referralClickLogsData.map(d => [d.clickId, d.timestamp, d.channel, d.device, d.status, d.convertedName, d.convertedPhone, d.activatedBV]);
    } else if (activeReportTab === 'direct_business') {
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
    { id: 'referral_clicks', label: 'Referral Clicks & Conversions', icon: MousePointerClick, color: 'text-rose-500' },
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
    <div className={`space-y-4 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner with Export Tools */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white' 
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-800'
      }`}>
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[11px] font-bold">
            <FileText className="w-3 h-3 text-amber-400" />
            <span>Executive Business Intelligence Reports Module</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">System Financial & Network Reports</h2>
          <p className="text-[11px] text-indigo-200/80 font-medium">
            Filter, inspect, export to Excel (CSV), or print official certified PDF reports.
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel (CSV)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Formatted PDF Report</span>
          </button>
        </div>
      </div>

      {/* 2. 9-Report Type Switcher */}
      <div className={`p-1.5 rounded-xl border shadow-xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-1.5 overflow-x-auto ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {reportTabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center leading-tight gap-1 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
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

        {/* 0. Referral Link Clicks & Conversion Tracking Report */}
        {activeReportTab === 'referral_clicks' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Executive Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">Total Link Clicks</span>
                <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">{totalRefClicks} Clicks</div>
                <span className="text-[10px] text-slate-500 font-bold">Referral link visits</span>
              </div>

              <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 block">Unique Visitors</span>
                <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{uniqueRefVisitors} Visitors</div>
                <span className="text-[10px] text-slate-500 font-bold">Unique IP Addresses</span>
              </div>

              <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block">Sign-up Conversions</span>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{totalConversions} Members</div>
                <span className="text-[10px] text-slate-500 font-bold">Registered Distributors</span>
              </div>

              <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">Conversion Rate</span>
                <div className="text-xl font-black font-mono text-amber-500">{conversionRate}%</div>
                <span className="text-[10px] text-slate-500 font-bold">Clicks to Registrations</span>
              </div>

              <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-500 block">Activated BV Volume</span>
                <div className="text-xl font-black font-mono text-purple-500">{convertedBvTotal.toLocaleString('en-IN')} BV</div>
                <span className="text-[10px] text-slate-500 font-bold">From Referred Signups</span>
              </div>
            </div>

            {/* Referral Link Quick Copy & Campaign Channel Bar */}
            <div className={`p-5 rounded-2xl border shadow-xs space-y-3 ${
              isDarkMode ? 'bg-slate-950 border-indigo-900/50' : 'bg-gradient-to-r from-indigo-50 to-amber-50 border-indigo-100'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>My Active Referral Link & Tracking Code</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Shares through this link automatically attribute conversions to Sponsor ID: <strong className="text-indigo-600 dark:text-indigo-300 font-mono">{user.phone}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={userRefLink}
                    className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 w-full md:w-80"
                  />
                  <button
                    onClick={copyRefLink}
                    className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      copiedLink ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Component: Daily Referral Clicks & Conversion Trends */}
            <div className={`p-5 rounded-2xl border shadow-sm space-y-4 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-rose-500" />
                    <span>Daily Referral Link Clicks & Conversion Trend Analytics</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Visual comparison of daily incoming clicks, unique visitors, and distributor conversions
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Link Clicks</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Unique Visitors</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Sign-up Conversions</span>
                  </span>
                </div>
              </div>

              {/* Chart Container */}
              <div className="w-full h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={dailyReferralTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }} 
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="left"
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                      axisLine={{ stroke: isDarkMode ? '#334155' : '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 10]}
                      tick={{ fill: isDarkMode ? '#10b981' : '#059669', fontSize: 11, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                        borderRadius: '0.75rem',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                      formatter={(value: any, name: any) => {
                        if (name === 'clicks') return [`${value} Clicks`, 'Link Clicks'];
                        if (name === 'uniqueVisitors') return [`${value} Visitors`, 'Unique Visitors'];
                        if (name === 'conversions') return [`${value} Signups`, 'Sign-up Conversions'];
                        if (name === 'conversionRate') return [`${value}%`, 'Conversion Rate'];
                        return [value, name];
                      }}
                      labelStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: '800', marginBottom: '4px' }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#f43f5e" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#clicksGradient)" 
                      name="clicks"
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="uniqueVisitors" 
                      stroke="#6366f1" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#visitorsGradient)" 
                      name="uniqueVisitors"
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="conversions" 
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]} 
                      barSize={18}
                      name="conversions"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="conversionRate" 
                      stroke="#f59e0b" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                      name="conversionRate"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Referral Click Audit Log Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-extrabold uppercase text-[11px] ${
                    isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <th className="p-3.5">Log ID & Time</th>
                    <th className="p-3.5">Traffic Channel</th>
                    <th className="p-3.5">Device & Location</th>
                    <th className="p-3.5">Conversion Status</th>
                    <th className="p-3.5">Converted Distributor</th>
                    <th className="p-3.5">Mobile No</th>
                    <th className="p-3.5 text-right">Activated BV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 font-medium">
                  {referralClickLogsData
                    .filter(log =>
                      !searchTerm ||
                      log.clickId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.channel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.convertedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      log.convertedPhone.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((log, idx) => (
                      <tr key={idx} className={isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/40'}>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-rose-500">{log.clickId}</div>
                          <div className="text-[10px] text-slate-400">{log.timestamp}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{log.channel}</span>
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400 font-medium">{log.device}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'CONVERTED' 
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                              : log.status === 'OTP_PENDING'
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {log.status === 'CONVERTED' ? '✓ Converted' : log.status === 'OTP_PENDING' ? '⏳ OTP Pending' : '👁️ Browsing'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">{log.convertedName}</td>
                        <td className="p-3.5 font-mono text-slate-500 dark:text-slate-400">{log.convertedPhone}</td>
                        <td className="p-3.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">{log.activatedBV}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
