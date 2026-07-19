import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

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

// ── Submission card ───────────────────────────────────────────────────────────
function SubmissionCard({ sub }) {
  const teamName      = sub.team?.name ?? '—';
  const hackathonTitle = sub.hackathon?.title ?? '—';

  return (
    <Link
      to={`/judge/review/${sub._id}`}
      className="group relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm
        hover:border-purple-500/40 hover:bg-white/8 transition-all duration-200"
    >
      {/* Review status badge */}
      <span
        className={`self-start rounded-full px-3 py-0.5 text-xs font-semibold ring-1 ${
          sub.reviewedByMe
            ? 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30'
            : 'text-amber-300 bg-amber-500/15 ring-amber-500/30'
        }`}
      >
        {sub.reviewedByMe ? '✓ Reviewed' : '○ Not Reviewed Yet'}
      </span>

      {/* Project name */}
      <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
        {sub.projectName}
      </h2>

      {/* Meta */}
      <div className="space-y-1">
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Team: </span>
          <span className="text-slate-300 font-medium">{teamName}</span>
        </p>
        <p className="text-xs text-slate-400">
          <span className="text-slate-500">Hackathon: </span>
          <span className="text-slate-300 font-medium">{hackathonTitle}</span>
        </p>
      </div>

      {/* Hackathon end date */}
      {sub.hackathon?.endDate && (
        <p className="mt-auto text-xs text-slate-600">
          Ends {fmt(sub.hackathon.endDate)}
        </p>
      )}

      {/* Hover arrow */}
      <span className="absolute bottom-5 right-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function JudgeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/reviews/assigned');
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load assigned submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const reviewed    = submissions.filter((s) => s.reviewedByMe);
  const unreviewed  = submissions.filter((s) => !s.reviewedByMe);

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-sm font-semibold text-violet-300 ring-1 ring-violet-500/40">
              ⚖️ HeckNest
            </span>
            <span className="hidden text-sm text-slate-500 sm:block">Judge Portal</span>
          </div>
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
        <div className="mb-10">
          <p className="text-sm font-medium text-violet-400 mb-1">Welcome back,</p>
          <h1 className="text-3xl font-extrabold text-white">
            {user?.name ?? 'Judge'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {submissions.length === 0
              ? 'No submissions assigned yet.'
              : `${unreviewed.length} pending · ${reviewed.length} reviewed · ${submissions.length} total`}
          </p>
        </div>

        {/* Progress bar */}
        {submissions.length > 0 && (
          <div className="mb-10">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span>Review progress</span>
              <span>{reviewed.length} / {submissions.length}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                style={{ width: `${(reviewed.length / submissions.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
            <span className="text-5xl mb-4">⚖️</span>
            <h2 className="text-xl font-bold text-white mb-2">No submissions assigned</h2>
            <p className="text-sm text-slate-400">
              A hackathon organizer must assign you as a judge before submissions appear here.
            </p>
          </div>
        )}

        {/* ── Pending section ──────────────────────────────────────────────── */}
        {unreviewed.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              Pending Review
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300 normal-case tracking-normal">
                {unreviewed.length}
              </span>
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {unreviewed.map((sub) => (
                <SubmissionCard key={sub._id} sub={sub} />
              ))}
            </div>
          </section>
        )}

        {/* ── Reviewed section ─────────────────────────────────────────────── */}
        {reviewed.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Reviewed
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300 normal-case tracking-normal">
                {reviewed.length}
              </span>
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviewed.map((sub) => (
                <SubmissionCard key={sub._id} sub={sub} />
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
