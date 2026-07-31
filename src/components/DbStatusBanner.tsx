import { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { DBConfigStatus } from '../types.js';

export default function DbStatusBanner() {
  const [status, setStatus] = useState<DBConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/db-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <div id="db-status-banner" className="bg-slate-50 border-b border-slate-200 py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">ডাটাবেজ কানেকশন স্টেটাস:</span>
          {status?.isMySQL ? (
            status.connected ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                রিমোট MySQL সংযুক্ত আছে
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                MySQL সংযোগ ব্যর্থ (লোকাল ডাটাবেজে চলছে)
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              লোকাল অফলাইন ডাটাবেজ (JSON DB) সক্রিয়
            </span>
          )}
        </div>

        <div className="text-slate-600 flex items-center gap-2 flex-wrap">
          {status?.isMySQL ? (
            status.connected ? (
              <span>
                সংযুক্ত হোস্ট: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">{status.host}</code> | ডাটাবেজ: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">{status.database}</code>
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                ত্রুটি: {status.error || 'Connection Failed'}. হোস্ট ও ক্রেডেনশিয়াল চেক করুন।
              </span>
            )
          ) : (
            <span>
              হোস্টিংগার বা গিটহাবে ডেপ্লয় করার সময় <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">DB_HOST</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">DB_USER</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">DB_PASSWORD</code>, এবং <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">DB_NAME</code> যুক্ত করলে তা অটো MySQL টেবিল তৈরি করে নেবে।
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
