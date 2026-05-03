import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import {
  History, Sprout, Thermometer, Droplets, Wind,
  FlaskConical, ChevronLeft, ChevronRight, RefreshCw,
  AlertCircle, Loader2, Calendar, BadgePercent, Search
} from 'lucide-react';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 8;

interface PredictionRecord {
  id: number;
  crop: string;
  confidence: number;
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

// Pastel gradient per crop (cycles through a palette)
const CROP_COLORS: Record<string, string> = {
  rice: 'from-amber-400 to-yellow-500',
  wheat: 'from-yellow-400 to-orange-400',
  maize: 'from-orange-400 to-red-400',
  cotton: 'from-sky-400 to-blue-500',
  jute: 'from-lime-400 to-green-500',
  coffee: 'from-stone-500 to-amber-700',
  coconut: 'from-teal-400 to-emerald-500',
  banana: 'from-yellow-300 to-lime-400',
  mango: 'from-orange-300 to-yellow-400',
  grapes: 'from-purple-400 to-violet-500',
  apple: 'from-red-400 to-rose-500',
  watermelon: 'from-green-400 to-emerald-600',
  default: 'from-emerald-400 to-green-600',
};

function getCropGradient(crop: string): string {
  return CROP_COLORS[crop.toLowerCase()] ?? CROP_COLORS.default;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

const StatBadge: React.FC<{ label: string; value: string; icon: React.ReactNode; isDark: boolean }> = ({ label, value, icon, isDark }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${isDark ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
    <span className="opacity-60">{icon}</span>
    <span className="opacity-60">{label}</span>
    <span className="font-bold ml-auto">{value}</span>
  </div>
);

const PredictionHistory: React.FC = () => {
  const { isDark } = useTheme();
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchHistory = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('Not authenticated. Please log in.');

      const offset = currentPage * PAGE_SIZE;
      const res = await fetch(`${API_URL}/auth/history?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to load history');
      }
      const data = await res.json();
      setRecords(data.predictions ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(page);
  }, [page, fetchHistory]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = search.trim()
    ? records.filter(r => r.crop.toLowerCase().includes(search.toLowerCase()))
    : records;

  return (
    <div className={`min-h-screen p-6 md:p-10 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-emerald-50'}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl shadow-lg shadow-emerald-500/30">
              <History className="text-white" size={26} />
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                Prediction History
              </h1>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {total} total crop recommendation{total !== 1 ? 's' : ''} made
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
              <Search size={16} className="opacity-50" />
              <input
                type="text"
                placeholder="Filter by crop..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent outline-none w-32 placeholder-slate-400"
              />
            </div>
            {/* Refresh */}
            <button
              onClick={() => fetchHistory(page)}
              disabled={loading}
              className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className={`flex gap-3 p-4 rounded-xl border mb-6 ${isDark ? 'bg-red-950/40 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={40} className="animate-spin text-emerald-500" />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading your predictions...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <Sprout size={36} className="text-emerald-500" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {search ? 'No matching predictions' : 'No predictions yet'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {search ? `No results for "${search}"` : 'Make your first crop prediction to see it here.'}
            </p>
          </div>
        )}

        {/* Cards grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5">
            {filtered.map(record => {
              const isExpanded = expandedId === record.id;
              const gradient = getCropGradient(record.crop);
              const confidencePct = (record.confidence * 100).toFixed(1);

              return (
                <div
                  key={record.id}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer group ${isDark
                    ? 'bg-slate-800/50 border-white/5 hover:border-white/10 hover:bg-slate-800/70'
                    : 'bg-white border-slate-200 hover:border-emerald-200 hover:shadow-lg'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                >
                  {/* Card top color bar */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

                  <div className="p-5">
                    {/* Crop name + confidence + date */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} shadow-md`}>
                          <Sprout className="text-white" size={22} />
                        </div>
                        <div>
                          <h3 className={`text-lg font-black capitalize tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {record.crop}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <BadgePercent size={12} className="text-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-500">{confidencePct}% confidence</span>
                          </div>
                        </div>
                      </div>

                      <div className={`text-right text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <div className="flex items-center gap-1 justify-end">
                          <Calendar size={11} />
                          <span>{formatDate(record.created_at)}</span>
                        </div>
                        <div className="mt-0.5">{formatTime(record.created_at)}</div>
                      </div>
                    </div>

                    {/* Confidence bar */}
                    <div className={`w-full h-1.5 rounded-full mb-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>

                    {/* Key stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <StatBadge label="Temp" value={`${record.temperature.toFixed(1)}°C`} icon={<Thermometer size={12} />} isDark={isDark} />
                      <StatBadge label="Humidity" value={`${record.humidity.toFixed(0)}%`} icon={<Droplets size={12} />} isDark={isDark} />
                      <StatBadge label="Rainfall" value={`${record.rainfall.toFixed(0)}mm`} icon={<Wind size={12} />} isDark={isDark} />
                    </div>

                    {/* Expand/collapse details */}
                    {isExpanded && (
                      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'} animate-fade-in`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Soil Nutrient Profile
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <StatBadge label="N" value={`${record.N.toFixed(0)}`} icon={<FlaskConical size={12} />} isDark={isDark} />
                          <StatBadge label="P" value={`${record.P.toFixed(0)}`} icon={<FlaskConical size={12} />} isDark={isDark} />
                          <StatBadge label="K" value={`${record.K.toFixed(0)}`} icon={<FlaskConical size={12} />} isDark={isDark} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <StatBadge label="pH" value={record.ph.toFixed(2)} icon={<FlaskConical size={12} />} isDark={isDark} />
                          {record.latitude && record.longitude ? (
                            <StatBadge
                              label="Location"
                              value={`${record.latitude.toFixed(2)}, ${record.longitude.toFixed(2)}`}
                              icon={<span className="text-xs">📍</span>}
                              isDark={isDark}
                            />
                          ) : (
                            <StatBadge label="Location" value="Not set" icon={<span className="text-xs">📍</span>} isDark={isDark} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expand hint */}
                    <div className={`mt-3 text-center text-xs transition-all ${isDark ? 'text-slate-600 group-hover:text-slate-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                      {isExpanded ? '▲ Hide details' : '▼ Show soil details'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${page === 0
                ? 'opacity-30 cursor-not-allowed'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className={`flex items-center gap-1`}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${i === page
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${page >= totalPages - 1
                ? 'opacity-30 cursor-not-allowed'
                : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionHistory;
