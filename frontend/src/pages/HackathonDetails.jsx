import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

function InlineSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-text-faint uppercase tracking-wider">{label}</span>
      <span className="text-sm text-text-muted">{children}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HackathonDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Register state
  const [teamName, setTeamName] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/hackathons/${id}`);
        setHackathon(data);
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to load hackathon.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    if (!teamName.trim()) { setRegError('Team name is required.'); return; }
    setRegLoading(true);
    try {
      await api.post('/teams', { name: teamName.trim(), hackathon: id });
      setRegSuccess('Team created! Head to your dashboard to register and submit.');
      setTeamName('');
    } catch (err) {
      setRegError(err.response?.data?.message ?? 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) return <Spinner />;

  if (error || !hackathon) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm font-medium text-text-muted">{error || 'Hackathon not found.'}</p>
        <Link to="/hackathons" className="text-sm text-accent hover:text-accent-hover transition-colors">
          ← Back to hackathons
        </Link>
      </div>
    );
  }

  const h = hackathon;

  return (
    <div className="min-h-screen bg-base">
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <Link to="/hackathons" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          ← Back to Hackathons
        </Link>

        {/* Title block */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {h.mode && (
              <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium
                ${h.mode === 'online' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {h.mode === 'online' ? 'Online' : 'Offline'}
              </span>
            )}
            {h.theme && (
              <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-xs text-text-muted">
                #{h.theme}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">{h.title}</h1>
          {h.organizer?.name && (
            <p className="mt-1 text-sm text-text-muted">by {h.organizer.name}</p>
          )}
        </div>

        {/* Description */}
        {h.description && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-faint">About</h2>
            <p className="text-sm text-text-muted leading-relaxed">{h.description}</p>
          </div>
        )}

        {/* Meta grid */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-faint">Details</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MetaRow label="Start Date">{fmt(h.startDate)}</MetaRow>
            <MetaRow label="End Date">{fmt(h.endDate)}</MetaRow>
            <MetaRow label="Reg. Deadline">{fmt(h.registrationDeadline)}</MetaRow>
            {h.prizePool && <MetaRow label="Prize Pool">{h.prizePool}</MetaRow>}
            {h.maxTeamSize && <MetaRow label="Max Team Size">{h.maxTeamSize} members</MetaRow>}
            {h.venue && <MetaRow label="Venue">{h.venue}</MetaRow>}
          </div>
        </div>

        {/* Judging criteria */}
        {h.judgingCriteria?.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-faint">Judging Criteria</h2>
            <div className="flex flex-wrap gap-2">
              {h.judgingCriteria.map((c, i) => (
                <span key={i} className="rounded-md border border-border bg-elevated px-2.5 py-1 text-xs text-text-muted">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rules */}
        {h.rules && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-faint">Rules</h2>
            <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line">{h.rules}</p>
          </div>
        )}

        {/* Leaderboard link */}
        <Link
          to={`/leaderboard/${id}`}
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:border-border-strong hover:bg-elevated"
        >
          <div>
            <p className="text-sm font-medium text-text-primary">View Leaderboard</p>
            <p className="text-xs text-text-muted">See how teams ranked after judging</p>
          </div>
          <span className="text-text-faint">→</span>
        </Link>

        {/* Participant registration */}
        {user?.role === 'participant' && (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-1 text-sm font-semibold text-text-primary">Join this Hackathon</h2>
            <p className="mb-4 text-xs text-text-muted">Create a team to register your spot.</p>

            {regSuccess && (
              <div className="mb-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {regSuccess}
              </div>
            )}

            <form onSubmit={handleRegister} noValidate className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <input
                  id="teamName" type="text" value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setRegError(''); }}
                  placeholder="Team name"
                  className={`w-full rounded-lg border bg-elevated px-4 py-2 text-sm text-text-primary placeholder-text-faint outline-none focus:ring-1 focus:ring-accent transition-colors
                    ${regError ? 'border-red-500' : 'border-border focus:border-accent'}`}
                />
                {regError && <p className="mt-1 text-xs text-red-400">{regError}</p>}
              </div>
              <button
                type="submit" disabled={regLoading}
                className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {regLoading ? (
                  <span className="flex items-center gap-2"><InlineSpinner />Creating…</span>
                ) : 'Create Team'}
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
