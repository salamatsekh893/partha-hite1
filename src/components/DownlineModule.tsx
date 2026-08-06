import { useState } from 'react';
import { 
  Network, Search, Users, ChevronRight, ChevronDown, Download, Printer, 
  Layers, UserCheck, Clock, Award, ShieldCheck, Phone, Mail, Sparkles,
  BarChart3, FileText, ArrowDownRight, LogIn, Eye, X, ExternalLink, Shield, ArrowLeft,
  DollarSign, TrendingUp, CheckCircle2, UserPlus
} from 'lucide-react';
import { User, DownlineMember } from '../types.js';
import { exportToCSV, printPDFReport } from '../utils/exportUtils.js';

interface DownlineModuleProps {
  user: User;
  downlines: DownlineMember[];
  isDarkMode?: boolean;
  onImpersonateUser?: (targetUser: User) => void;
  onOpenNewDistributorModal?: () => void;
}

export default function DownlineModule({ user, downlines, isDarkMode = false, onImpersonateUser, onOpenNewDistributorModal }: DownlineModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'tree' | 'level' | 'depth' | 'depth_business' | 'level_business'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  // Member profile details modal state
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<DownlineMember | null>(null);

  // Sub-tree root focus member state
  const [focusedRootMember, setFocusedRootMember] = useState<DownlineMember | null>(null);

  // Expanded nodes state for interactive tree view
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  const toggleNode = (nodeId: number) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Active root node ID for visual tree
  const activeRootId = focusedRootMember ? focusedRootMember.id : user.id;

  // Filtered downline list
  const filteredDownlines = downlines.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = selectedLevel === 'all' || m.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  // Calculate Level-wise counts & BV
  const levelStatsMap = new Map<number, { count: number; active: number; bv: number }>();
  downlines.forEach(m => {
    const lvl = m.level;
    const current = levelStatsMap.get(lvl) || { count: 0, active: 0, bv: 0 };
    current.count += 1;
    if (m.status === 'active') current.active += 1;
    current.bv += (lvl === 1 ? 25000 : 18000);
    levelStatsMap.set(lvl, current);
  });

  const levelStatsArray = Array.from(levelStatsMap.entries()).sort((a, b) => a[0] - b[0]);

  // Max depth achieved
  const maxDepth = levelStatsArray.length > 0 ? Math.max(...levelStatsArray.map(l => l[0])) : 0;

  // Total Business across network
  const totalNetworkBV = Array.from(levelStatsMap.values()).reduce((sum, item) => sum + item.bv, 0);

  // Handle CSV Export
  const handleExportCSV = () => {
    const headers = ["Level", "Distributor ID / Phone", "Name", "Email", "Sponsor ID", "Sponsor Name", "Status", "Joined Date"];
    const rows = downlines.map(m => [
      `Level ${m.level}`,
      m.phone,
      m.name,
      m.email,
      m.referrer_phone || '-',
      m.referrer_name || '-',
      m.status.toUpperCase(),
      new Date(m.created_at).toLocaleDateString()
    ]);
    exportToCSV("Downline_Network_Report", headers, rows);
  };

  // Handle PDF Print
  const handlePrintPDF = () => {
    const headers = ["Level", "Distributor ID", "Name", "Email", "Sponsor", "Status", "Joined Date"];
    const rows = downlines.map(m => [
      `Level ${m.level}`,
      m.phone,
      m.name,
      m.email,
      m.referrer_name || '-',
      m.status.toUpperCase(),
      new Date(m.created_at).toLocaleDateString()
    ]);
    printPDFReport("Downline Network Audit Report", `Total Downline Members: ${downlines.length} across ${maxDepth} Network Levels`, headers, rows, { name: user.name, phone: user.phone });
  };

  // Helper recursive component for visual Tree view
  const renderTreeNode = (memberId: number, level: number = 1) => {
    const children = downlines.filter(m => m.referrer_id === memberId);

    return (
      <div key={memberId} className="space-y-2 ml-3 sm:ml-6 border-l-2 border-indigo-200 dark:border-indigo-900/50 pl-2 sm:pl-4 my-2">
        {children.map(child => {
          const childHasChildren = downlines.some(m => m.referrer_id === child.id);
          const isCollapsed = expandedNodes[child.id] === false;
          const childIsExpanded = !isCollapsed;

          return (
            <div key={child.id} className="space-y-2">
              <div 
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all hover:scale-[1.01] ${
                  child.status === 'active'
                    ? isDarkMode ? 'bg-slate-900/90 border-emerald-500/40 text-white hover:border-emerald-400' : 'bg-white border-emerald-300 text-slate-900 hover:border-emerald-500 shadow-sm'
                    : isDarkMode ? 'bg-slate-900/50 border-amber-500/30 text-slate-300' : 'bg-amber-50/50 border-amber-200 text-slate-800'
                }`}
              >
                
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {childHasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(child.id);
                      }}
                      className="p-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 cursor-pointer shrink-0 hover:bg-indigo-200"
                      title={childIsExpanded ? "Collapse Branch" : "Expand Branch"}
                    >
                      {childIsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                      •
                    </div>
                  )}

                  <div 
                    onClick={() => setSelectedMemberProfile(child)}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 cursor-pointer ring-2 ring-indigo-400/30 hover:ring-indigo-400"
                    title={`Click to view ${child.name}'s Profile`}
                  >
                    {child.name.charAt(0).toUpperCase()}
                  </div>

                  <div 
                    onClick={() => setSelectedMemberProfile(child)}
                    className="cursor-pointer space-y-0.5 flex-1 min-w-0"
                    title={`Click to view ${child.name}'s Profile`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-indigo-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {child.name}
                      </span>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                        Level {child.level}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium flex items-center gap-2 flex-wrap">
                      <span>ID: {child.phone}</span>
                      <span>•</span>
                      <span>Sponsor: {child.referrer_name || user.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl ${
                    child.status === 'active' 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {child.status.toUpperCase()}
                  </span>

                  {/* Direct Profile Access Button */}
                  <button
                    onClick={() => setSelectedMemberProfile(child)}
                    className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-xl transition-all border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 cursor-pointer shadow-2xs"
                    title={`View ${child.name}'s Profile & Enter Account`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Profile</span>
                  </button>

                  {onImpersonateUser && (
                    <button
                      onClick={() => {
                        const targetUser: User = {
                          id: child.id,
                          name: child.name,
                          phone: child.phone,
                          email: child.email,
                          referrer_id: child.referrer_id,
                          status: child.status,
                          role: 'user',
                          created_at: child.created_at
                        };
                        onImpersonateUser(targetUser);
                      }}
                      className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      title={`Log in as ${child.name}`}
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Enter</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Render sub-children recursively if expanded */}
              {childHasChildren && childIsExpanded && renderTreeNode(child.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`space-y-4 animate-fade-in ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDarkMode 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20 text-white' 
          : 'bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white border-indigo-800'
      }`}>
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[11px] font-bold">
            <Network className="w-3 h-3 text-indigo-400" />
            <span>Direct Selling Network Hierarchy</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Downline Network & Level Analytics</h2>
          <p className="text-[11px] text-indigo-200/80 font-medium">
            Click any member card (e.g., Dipankar) to view their full profile, inspect team tree, or log in to their profile!
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Network PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border shadow-xs space-y-0.5 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Downline</span>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{downlines.length}</div>
          <span className="text-[10px] text-slate-500 font-bold">Members across all levels</span>
        </div>

        <div className={`p-3.5 rounded-xl border shadow-xs space-y-0.5 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Max Depth Level</span>
          <div className="text-xl font-bold font-mono text-amber-500">Level {maxDepth}</div>
          <span className="text-[10px] text-slate-500 font-bold">Deepest team tier</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase">Active Network Rate</span>
          <div className="text-2xl font-black font-mono text-emerald-500">
            {downlines.length > 0 ? Math.round((downlines.filter(m => m.status === 'active').length / downlines.length) * 100) : 100}%
          </div>
          <span className="text-[10px] text-slate-500 font-bold">Active Distributors</span>
        </div>

        <div className={`p-4 rounded-2xl border shadow-xs space-y-1 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[11px] font-extrabold text-slate-400 uppercase">Total Downline BV</span>
          <div className="text-2xl font-black font-mono text-indigo-500">{totalNetworkBV.toLocaleString('en-IN')} BV</div>
          <span className="text-[10px] text-slate-500 font-bold">Business Volume</span>
        </div>
      </div>

      {/* 3. Module Sub-tabs Switcher */}
      <div className={`p-1.5 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-2 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('tree')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'tree' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tree View Downline
          </button>
          <button
            onClick={() => setActiveSubTab('level')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'level' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Level Wise List
          </button>
          <button
            onClick={() => setActiveSubTab('depth')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'depth' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Depth Wise Analysis
          </button>
          <button
            onClick={() => setActiveSubTab('depth_business')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'depth_business' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Depth Wise Business
          </button>
          <button
            onClick={() => setActiveSubTab('level_business')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeSubTab === 'level_business' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Level Wise Business
          </button>
        </div>

        {onOpenNewDistributorModal && (
          <button
            onClick={onOpenNewDistributorModal}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border border-amber-300 active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>+ New Distributor</span>
          </button>
        )}
      </div>

      {/* 4. SUB-TAB VIEWS */}

      {/* A. TREE VIEW */}
      {activeSubTab === 'tree' && (
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black">Visual Downline Tree Hierarchy</h3>
              <p className="text-xs text-slate-500">
                Click member names to open profile details or enter their account directly.
              </p>
            </div>
            
            {focusedRootMember ? (
              <button
                onClick={() => setFocusedRootMember(null)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-xl cursor-pointer transition-all self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Reset Tree to Main Root ({user.name})</span>
              </button>
            ) : (
              <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                Root Node: {user.name} ({user.phone})
              </span>
            )}
          </div>

          {/* Root Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                👑
              </div>
              <div>
                <div className="font-extrabold text-sm">
                  {focusedRootMember ? focusedRootMember.name : `${user.name} (YOU)`}
                </div>
                <div className="text-xs text-indigo-200 font-mono">
                  Mobile Distributor ID: {focusedRootMember ? focusedRootMember.phone : user.phone}
                </div>
              </div>
            </div>
            <span className="bg-emerald-500 text-slate-950 font-black px-3 py-1 rounded-full text-xs">
              {focusedRootMember ? `FOCUSED NODE` : `TOP SPONSOR`}
            </span>
          </div>

          {/* Tree Root Children */}
          {downlines.some(m => m.referrer_id === activeRootId) ? (
            renderTreeNode(activeRootId)
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No downline members found under this root node yet. Share Sponsor Link to grow team network!
            </div>
          )}
        </div>
      )}

      {/* B. LEVEL WISE LIST VIEW WITH SEARCH */}
      {activeSubTab === 'level' && (
        <div className={`border rounded-3xl overflow-hidden shadow-sm space-y-4 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Controls Bar */}
          <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search downline by name (e.g., Dipankar), mobile ID, or email..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold focus:outline-none cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                <option value="all">All Levels (L1 to L{maxDepth})</option>
                {levelStatsArray.map(([lvl]) => (
                  <option key={lvl} value={lvl}>Level {lvl} Only</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b font-extrabold uppercase text-[11px] ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="p-4">Level</th>
                  <th className="p-4">Distributor Mobile ID</th>
                  <th className="p-4">Name & Email</th>
                  <th className="p-4">Sponsor Name & Phone</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 font-medium">
                {filteredDownlines.length > 0 ? (
                  filteredDownlines.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMemberProfile(m)}
                      className={`cursor-pointer transition-all ${
                        isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-indigo-50/60'
                      }`}
                    >
                      <td className="p-4"><span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-black px-2.5 py-0.5 rounded-full text-[10px]">Level {m.level}</span></td>
                      <td className="p-4 font-mono font-bold text-indigo-500">{m.phone}</td>
                      <td className="p-4">
                        <div className="font-bold hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{m.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{m.referrer_name || user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.referrer_phone || user.phone}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          m.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(m.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedMemberProfile(m)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition-all border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                        {onImpersonateUser && (
                          <button
                            onClick={() => {
                              const targetUser: User = {
                                id: m.id,
                                name: m.name,
                                phone: m.phone,
                                email: m.email,
                                referrer_id: m.referrer_id,
                                status: m.status,
                                role: 'user',
                                created_at: m.created_at
                              };
                              onImpersonateUser(targetUser);
                            }}
                            className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Enter Account</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No downline records match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. DEPTH WISE ANALYSIS & BUSINESS */}
      {(activeSubTab === 'depth' || activeSubTab === 'depth_business' || activeSubTab === 'level_business') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {levelStatsArray.map(([lvl, stats]) => (
            <div key={lvl} className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                  Network Level {lvl}
                </span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {stats.active} Active / {stats.count} Total
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Level Business Volume (BV)</span>
                <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{stats.bv.toLocaleString('en-IN')} BV</div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500 font-bold">
                <span>Estimated Turnover:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">₹{Math.round(stats.bv * 1.25).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. INTERACTIVE MEMBER PROFILE MODAL */}
      {selectedMemberProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 text-white relative">
              <button
                onClick={() => setSelectedMemberProfile(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg ring-2 ring-amber-400 shrink-0">
                  {selectedMemberProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 px-2.5 py-0.5 rounded-full">
                      Level {selectedMemberProfile.level} Member
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      selectedMemberProfile.status === 'active'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                    }`}>
                      {selectedMemberProfile.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-tight truncate">{selectedMemberProfile.name}</h3>
                  <p className="text-xs text-indigo-200/90 font-mono font-semibold">
                    Distributor ID: {selectedMemberProfile.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-2xl border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-500" /> Email Address
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedMemberProfile.email || 'N/A'}</div>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-500" /> Sponsor Name
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{selectedMemberProfile.referrer_name || user.name}</div>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-500" /> Sponsor Phone
                  </span>
                  <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedMemberProfile.referrer_phone || user.phone}</div>
                </div>

                <div className={`p-3 rounded-2xl border space-y-1 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" /> Joined Date
                  </span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(selectedMemberProfile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Network & Business Stats for Member */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-indigo-500 tracking-wider">Distributor Network Stats</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-indigo-50/50 border-indigo-100'}`}>
                    <div className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400">
                      {downlines.filter(m => m.referrer_id === selectedMemberProfile.id).length}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">Direct Referrals</div>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/50 border-amber-100'}`}>
                    <div className="text-lg font-black font-mono text-amber-500">
                      {selectedMemberProfile.level === 1 ? '25,000' : '18,000'} BV
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">Team BV</div>
                  </div>

                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/50 border-emerald-100'}`}>
                    <div className="text-lg font-black font-mono text-emerald-500">
                      ₹{selectedMemberProfile.level === 1 ? '12,500' : '8,400'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">Total Earnings</div>
                  </div>
                </div>
              </div>

              {/* Main Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {onImpersonateUser && (
                  <button
                    onClick={() => {
                      const targetUser: User = {
                        id: selectedMemberProfile.id,
                        name: selectedMemberProfile.name,
                        phone: selectedMemberProfile.phone,
                        email: selectedMemberProfile.email,
                        referrer_id: selectedMemberProfile.referrer_id,
                        status: selectedMemberProfile.status,
                        role: 'user',
                        created_at: selectedMemberProfile.created_at
                      };
                      setSelectedMemberProfile(null);
                      onImpersonateUser(targetUser);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-slate-950" />
                    <span>🔑 Enter Profile & Log In as {selectedMemberProfile.name}</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setFocusedRootMember(selectedMemberProfile);
                      setActiveSubTab('tree');
                      setSelectedMemberProfile(null);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Focus Team Tree</span>
                  </button>

                  <a
                    href={`https://wa.me/${selectedMemberProfile.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp / Call</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
