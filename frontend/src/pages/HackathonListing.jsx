import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

function ModeBadge({ mode }) {
  if (!mode) return null;
  const cls = mode === 'online'
    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return (
    <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium ${cls}`}>
      {mode === 'online' ? 'Online' : 'Offline'}
    </span>
  );
}

function HackathonCard({ h }) {
  return (
    <Link
      to={`/hackathons/${h._id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
          {h.title}
        </h2>
        <ModeBadge mode={h.mode} />
      </div>

      {h.theme && (
        <p className="text-xs text-text-faint">#{h.theme}</p>
      )}

      {h.prizePool && (
        <p className="text-xs font-medium text-text-muted">Prize: {h.prizePool}</p>
      )}

      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3 text-xs text-text-muted">
        <span>{fmt(h.startDate)} → {fmt(h.endDate)}</span>
        {h.registrationDeadline && (
          <span>Reg. deadline: {fmt(h.registrationDeadline)}</span>
        )}
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HackathonListing() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const { data } = await api.get(`/hackathons?${params}`);
      setHackathons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  const visible = hackathons.filter((h) =>
    modeFilter === 'all' || h.mode === modeFilter
  );

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="border-b border-border bg-base/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">
            HeckNest
          </Link>
          <Link to="/login" className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:border-border-strong hover:text-text-primary transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Page title + filters */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary">Hackathons</h1>
          <p className="mt-1 text-sm text-text-muted">Browse and discover upcoming events</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-elevated px-4 py-2 text-sm text-text-primary placeholder-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors sm:max-w-xs"
          />
          {/* Mode filter */}
          <div className="flex gap-1">
            {['all', 'online', 'offline'].map((m) => (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors
                  ${modeFilter === m
                    ? 'bg-accent text-white'
                    : 'border border-border text-text-muted hover:border-border-strong hover:text-text-primary'}`}
              >
                {m === 'all' ? 'All' : m}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="shrink-0">⚠</span><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-text-muted">No hackathons found</p>
            <p className="mt-1 text-xs text-text-faint">Try adjusting your search or filters</p>
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((h) => <HackathonCard key={h._id} h={h} />)}
          </div>
        )}
      </main>
    </div>
  );
}
