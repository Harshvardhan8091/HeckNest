import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const STATUS_STYLE = {
  upcoming: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  ongoing:  'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  completed:'text-slate-400 bg-slate-500/15 ring-slate-500/30',
};

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <svg className="h-10 w-10 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

// ── Hackathon card ────────────────────────────────────────────────────────────
function HackathonCard({ h }) {
  return (
    <Link
      to={`/organizer/hackathons/${h._id}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm
        hover:border-purple-500/40 hover:bg-white/8 transition-all duration-200"
    >
      {/* Status badge */}
      <span
        className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize
          ${STATUS_STYLE[h.status] ?? 'text-slate-400 bg-slate-500/15 ring-slate-500/30'}`}
      >
        {h.status}
      </span>

      {/* Title */}
      <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
        {h.title}
      </h2>

      {/* Theme */}
      {h.theme && (
        <p className="text-xs text-purple-400 font-medium">#{h.theme}</p>
      )}

      {/* Date range */}
      <p className="mt-auto text-xs text-slate-500">
        {fmt(h.startDate)} → {fmt(h.endDate)}
      </p>

      {/* Mode pill */}
      {h.mode && (
        <span className="absolute top-4 right-4 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-400 capitalize">
          {h.mode === 'online' ? '🌐' : '📍'} {h.mode}
        </span>
      )}

      {/* Hover arrow */}
      <span className="absolute bottom-5 right-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/hackathons');
      // Filter to only this organizer's hackathons
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

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-semibold text-purple-300 ring-1 ring-purple-500/40">
              🚀 HeckNest
            </span>
            <span className="hidden text-sm text-slate-500 sm:block">Organizer Portal</span>
          </div>

          {/* User + sign-out */}
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:block">
              {user?.name ?? user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-purple-500/40 hover:text-white transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 py-12">

        {/* Page header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-purple-400 mb-1">Welcome back,</p>
            <h1 className="text-3xl font-extrabold text-white">
              {user?.name ?? 'Organizer'} 👋
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {hackathons.length === 0
                ? 'No hackathons yet — create your first one!'
                : `You have ${hackathons.length} hackathon${hackathons.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <Link
            to="/organizer/hackathons/create"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5
              text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 transition active:scale-95"
          >
            ＋ Create New Hackathon
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && hackathons.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
            <span className="text-5xl mb-4">🏆</span>
            <h2 className="text-xl font-bold text-white mb-2">No hackathons yet</h2>
            <p className="text-sm text-slate-400 mb-6">
              Create your first hackathon to get started.
            </p>
            <Link
              to="/organizer/hackathons/create"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5
                text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 transition"
            >
              ＋ Create Hackathon
            </Link>
          </div>
        )}

        {/* Grid */}
        {hackathons.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((h) => (
              <HackathonCard key={h._id} h={h} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
