import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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

// ── Submission card ───────────────────────────────────────────────────────────
function SubmissionCard({ sub }) {
  const teamName       = sub.team?.name ?? '—';
  const hackathonTitle = sub.hackathon?.title ?? '—';

  return (
    <Link
      to={`/judge/review/${sub._id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium
          ${sub.reviewedByMe
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
          {sub.reviewedByMe ? 'Reviewed' : 'Pending'}
        </span>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors leading-snug">
          {sub.projectName}
        </h2>
        <p className="mt-1 text-xs text-text-muted">Team: {teamName}</p>
        <p className="text-xs text-text-faint">{hackathonTitle}</p>
      </div>

      {sub.hackathon?.endDate && (
        <p className="mt-auto text-xs text-text-faint">Ends {fmt(sub.hackathon.endDate)}</p>
      )}
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

  const handleSignOut = () => { logout(); navigate('/login'); };

  const reviewed   = submissions.filter((s) => s.reviewedByMe);
  const unreviewed = submissions.filter((s) => !s.reviewedByMe);

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-base">
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{user?.name ?? 'Judge'}</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {submissions.length === 0
              ? 'No submissions assigned yet.'
              : `${unreviewed.length} pending · ${reviewed.length} reviewed · ${submissions.length} total`}
          </p>
        </div>

        {/* Progress bar */}
        {submissions.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-text-faint">
              <span>Review progress</span>
              <span>{reviewed.length} / {submissions.length}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(reviewed.length / submissions.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-text-muted">No submissions assigned</p>
            <p className="mt-1 text-xs text-text-faint">
              A hackathon organizer must assign you as a judge before submissions appear here.
            </p>
          </div>
        )}

        {/* Pending section */}
        {unreviewed.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Pending Review</h2>
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400">{unreviewed.length}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unreviewed.map((sub) => <SubmissionCard key={sub._id} sub={sub} />)}
            </div>
          </section>
        )}

        {/* Reviewed section */}
        {reviewed.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Reviewed</h2>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">{reviewed.length}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviewed.map((sub) => <SubmissionCard key={sub._id} sub={sub} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
