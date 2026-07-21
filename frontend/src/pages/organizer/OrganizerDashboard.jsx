import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_CLS = {
  upcoming:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  ongoing:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-elevated text-text-faint border-border',
};

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

function HackathonCard({ h }) {
  return (
    <Link
      to={`/organizer/hackathons/${h._id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize
          ${STATUS_CLS[h.status] ?? 'bg-elevated text-text-faint border-border'}`}>
          {h.status}
        </span>
        {h.mode && (
          <span className="text-xs text-text-faint capitalize">{h.mode}</span>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
          {h.title}
        </h2>
        {h.theme && <p className="mt-0.5 text-xs text-text-faint">#{h.theme}</p>}
      </div>

      <p className="mt-auto text-xs text-text-muted">{fmt(h.startDate)} → {fmt(h.endDate)}</p>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/hackathons');
      const mine = data.filter((h) => {
        const orgId = h.organizer?._id ?? h.organizer;
        return orgId === user?._id;
      });
      setHackathons(mine);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  const handleSignOut = () => { logout(); navigate('/login'); };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-base">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-border bg-base/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-primary">HeckNest</span>
            <span className="hidden text-xs text-text-faint sm:block">Organizer</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-text-muted sm:block">{user?.name ?? user?.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{user?.name ?? 'Organizer'}</h1>
            <p className="mt-0.5 text-sm text-text-muted">
              {hackathons.length === 0
                ? 'No hackathons yet — create your first one'
                : `${hackathons.length} hackathon${hackathons.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/organizer/hackathons/create"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            + Create Hackathon
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && hackathons.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-text-muted">No hackathons yet</p>
            <p className="mt-1 text-xs text-text-faint">Create your first hackathon to get started.</p>
            <Link
              to="/organizer/hackathons/create"
              className="mt-5 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              + Create Hackathon
            </Link>
          </div>
        )}

        {/* Grid */}
        {hackathons.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((h) => <HackathonCard key={h._id} h={h} />)}
          </div>
        )}
      </main>
    </div>
  );
}
