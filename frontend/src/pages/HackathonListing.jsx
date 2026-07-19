import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const STATUS_COLOR = {
  upcoming: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  ongoing: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  completed: 'text-slate-400 bg-slate-500/15 ring-slate-500/30',
};

const MODE_COLOR = {
  online: 'text-violet-300 bg-violet-500/15 ring-violet-500/30',
  offline: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
};

// ── HackathonCard ─────────────────────────────────────────────────────────────
function HackathonCard({ h }) {
  return (
    <Link
      to={`/hackathons/${h._id}`}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-200
        hover:border-purple-500/50 hover:bg-white/8 hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-0.5"
    >
      {/* Top badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {h.status && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 capitalize ${STATUS_COLOR[h.status] ?? ''}`}>
            {h.status}
          </span>
        )}
        {h.mode && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 capitalize ${MODE_COLOR[h.mode] ?? ''}`}>
            {h.mode === 'online' ? '🌐' : '📍'} {h.mode}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2">
        {h.title}
      </h2>

      {/* Theme */}
      {h.theme && (
        <p className="mt-1 text-xs font-medium text-purple-400">#{h.theme}</p>
      )}

      {/* Dates */}
      <div className="mt-4 flex-1 space-y-1.5 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-4">📅</span>
          <span>{fmt(h.startDate)} → {fmt(h.endDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-4">⏰</span>
          <span>Registration by {fmt(h.registrationDeadline)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        {h.prizePool ? (
          <span className="text-sm font-semibold text-emerald-400">🏆 {h.prizePool}</span>
        ) : (
          <span />
        )}
        <span className="text-xs font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
          View details →
        </span>
      </div>
    </Link>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <svg className="h-8 w-8 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HackathonListing() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const mode = searchParams.get('mode') ?? 'all';

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (mode && mode !== 'all') params.mode = mode;
      const { data } = await api.get('/hackathons', { params });
      setHackathons(data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  }, [search, mode]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 ring-1 ring-purple-500/40">
            🏆 Hackathons
          </span>
          <h1 className="mt-4 text-4xl font-extrabold text-white">Explore Hackathons</h1>
          <p className="mt-2 text-slate-400">Find your next challenge and team up with the best.</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              type="text"
              placeholder="Search hackathons…"
              value={search}
              onChange={(e) => setParam('search', e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none
                focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          {/* Mode filter */}
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 gap-1">
            {['all', 'online', 'offline'].map((m) => (
              <button
                key={m}
                onClick={() => setParam('mode', m)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition
                  ${mode === m
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && <Spinner />}

        {!loading && error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && hackathons.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <span className="text-5xl">🔭</span>
            <h2 className="mt-4 text-lg font-semibold text-white">No hackathons found</h2>
            <p className="mt-1 text-sm text-slate-400">
              {search || mode !== 'all'
                ? 'Try adjusting your filters.'
                : 'Check back soon — events are coming!'}
            </p>
          </div>
        )}

        {!loading && !error && hackathons.length > 0 && (
          <>
            <p className="mb-4 text-xs text-slate-500">{hackathons.length} hackathon{hackathons.length !== 1 ? 's' : ''} found</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {hackathons.map((h) => (
                <HackathonCard key={h._id} h={h} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
