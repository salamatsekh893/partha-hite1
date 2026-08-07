import { useState } from 'react';
import { motion } from 'motion/react';
import { User, ChevronDown, ChevronRight, CheckCircle2, XCircle, Search, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { ReferralTreeNode } from '../types.js';

interface VisualTreeProps {
  treeData: ReferralTreeNode | null;
}

interface TreeNodeProps {
  key?: any;
  node: ReferralTreeNode;
  initiallyExpanded?: boolean;
}

// Sub-component for individual nodes
function TreeNode({ node, initiallyExpanded = true }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col pl-4 sm:pl-8 border-l border-transparent relative my-1.5 first:mt-0 last:mb-0">
      {/* Horizontal connector line */}
      <div className="absolute left-0 top-5 w-4 sm:w-8 border-t border-transparent"></div>

      <div className="flex items-start gap-2 sm:gap-3 group">
        {/* Expand / Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={toggleExpand}
            className="mt-1 w-5 h-5 rounded bg-indigo-900/30 hover:bg-indigo-800/40 text-indigo-300 flex items-center justify-center transition-colors cursor-pointer border border-indigo-800/30"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <div className="w-5 h-5" /> // Spacer
        )}

        {/* Node card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02, y: -2, boxShadow: "0 8px 16px -6px rgba(79,70,229,0.35)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`p-3.5 rounded-xl border transition-all text-left max-w-xs sm:max-w-md ${
            node.level === 0 
              ? 'bg-gradient-to-br from-indigo-600 to-indigo-850 border-indigo-400 shadow-md text-white' 
              : node.status === 'active'
                ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/30 text-white hover:border-indigo-400'
                : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/20 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {/* Status indicator icon */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              node.level === 0
                ? 'bg-indigo-600 text-white border border-indigo-400'
                : node.status === 'active'
                  ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-700/50'
                  : 'bg-slate-800 text-slate-400'
            }`}>
              <User className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xs sm:text-sm leading-tight">{node.name}</span>
                
                {/* Level Tag */}
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 uppercase ${
                  node.level === 0
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-900/40 text-indigo-300 border border-indigo-800/30'
                }`}>
                  {node.level === 0 ? 'Root' : `Level ${node.level}`}
                </span>
              </div>
              
              <div className="text-[11px] text-indigo-300 font-semibold mt-0.5 font-mono select-all">
                Distributor ID: {node.phone}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="mt-2.5 pt-2 border-t border-indigo-900/30 text-[11px] space-y-1 text-slate-300">
            <div>Email: <span className="font-semibold text-slate-200">{node.email}</span></div>
            <div>Phone: <span className="font-semibold text-slate-200">{node.phone}</span></div>
            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-indigo-900/30">
              <span className="text-slate-400">Status:</span>
              {node.status === 'active' ? (
                <span className="inline-flex items-center gap-0.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 font-bold text-amber-400">
                  <XCircle className="w-3.5 h-3.5" />
                  Pending
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Render child nodes recursively */}
      {hasChildren && isExpanded && (
        <div className="mt-1 flex flex-col">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} initiallyExpanded={initiallyExpanded} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function VisualTree({ treeData }: VisualTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandAll, setExpandAll] = useState(true);

  if (!treeData) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs font-semibold">
        Network tree data not found.
      </div>
    );
  }

  // Count total descendants
  const countDescendants = (node: ReferralTreeNode): number => {
    let count = node.children.length;
    node.children.forEach(child => {
      count += countDescendants(child);
    });
    return count;
  };

  const totalDownline = countDescendants(treeData);

  // Simple search in tree (returns a flat list of matching nodes)
  const findInTree = (node: ReferralTreeNode, term: string, matches: ReferralTreeNode[] = []): ReferralTreeNode[] => {
    if (node.level > 0 && (
      node.name.toLowerCase().includes(term.toLowerCase()) ||
      node.email.toLowerCase().includes(term.toLowerCase()) ||
      node.id.toString().includes(term)
    )) {
      matches.push(node);
    }
    node.children.forEach(child => findInTree(child, term, matches));
    return matches;
  };

  const matchedNodes = searchTerm.trim() ? findInTree(treeData, searchTerm.trim()) : [];

  return (
    <div id="visual-network-tree" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Visual Referral Tree</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Recursive network tree mapping of your downline (Total distributors: {totalDownline})
          </p>
        </div>

        {/* Tree controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setExpandAll(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand All
          </button>
          <button
            onClick={() => setExpandAll(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Collapse All
          </button>
        </div>
      </div>

      {/* Local Search inside tree */}
      <div className="my-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tree by name, email, or mobile number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 focus:bg-white rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Matches list */}
        {searchTerm && (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold">
            <div className="font-bold text-slate-700 mb-1.5">Search Results ({matchedNodes.length}):</div>
            {matchedNodes.length > 0 ? (
              <div className="max-h-24 overflow-y-auto space-y-1.5">
                {matchedNodes.map(m => (
                  <div key={m.id} className="flex justify-between items-center bg-white border border-slate-200 p-2 rounded-lg">
                    <div>
                      <span className="font-bold text-slate-800">{m.name}</span>{' '}
                      <span className="text-[10px] text-slate-500">(Level {m.level})</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      m.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Mobile: {m.phone}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 py-1">No matches found.</div>
            )}
          </div>
        )}
      </div>

      {/* Tree Visualization Container */}
      <div className="mt-4 p-4 sm:p-6 bg-slate-50 border border-slate-100 rounded-2xl overflow-x-auto min-h-[300px]">
        {/* Render tree root (Logged in user) */}
        <div className="inline-block min-w-full">
          <TreeNode key={treeData.id} node={treeData} initiallyExpanded={expandAll} />
        </div>
      </div>
    </div>
  );
}
