import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_CLS = {
  pending:      'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected:     'bg-red-500/10 text-red-400 border-red-500/20',
  under_review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[status] ?? 'bg-elevated text-text-faint border-border'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function StatCard({ icon, label, value, loading }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium text-text-faint">{label}</p>
      {loading ? (
        <div className="mt-2 h-7 w-10 animate-pulse rounded-md bg-elevated" />
      ) : (
        <p className="mt-1 text-2xl font-semibold text-text-primary tabular-nums">{value}</p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <svg className="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [t, r, s] = await Promise.all([
        api.get('/teams/my'),
        api.get('/registrations/my'),
        api.get('/submissions/my'),
      ]);
      setTeams(t.data);
      setRegistrations(r.data);
      setSubmissions(s.data);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const regByTeam = {};
  registrations.forEach((r) => { if (r.team?._id) regByTeam[r.team._id] = r; });

  const subByTeam = {};
  submissions.forEach((s) => { if (s.team?._id) subByTeam[s.team._id] = s; });

  const approvedCount = registrations.filter((r) => r.status === 'approved').length;

  return (
    <div className="min-h-screen bg-base">

      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-border bg-base/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-primary">HeckNest</span>
            <span className="hidden text-xs text-text-faint sm:block">Participant</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-text-muted sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {user?.name}
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Hackathons" value={registrations.length} loading={loading} />
          <StatCard label="Teams" value={teams.length} loading={loading} />
          <StatCard label="Submissions" value={submissions.length} loading={loading} />
          <StatCard label="Approved" value={approvedCount} loading={loading} />
        </div>

        {/* Quick action */}
        <Link
          to="/hackathons"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          Browse Hackathons →
        </Link>

        {/* Error state */}
        {error && (
          <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2"><span>⚠</span><span>{error}</span></span>
            <button
              onClick={loadData}
              className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Teams section */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-faint">My Teams</h2>

          {loading && <Spinner />}

          {!loading && !error && teams.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-14 text-center">
              <p className="text-sm text-text-muted">You&apos;re not in any team yet.</p>
              <Link to="/hackathons" className="mt-3 text-sm text-accent hover:text-accent-hover transition-colors">
                Find a hackathon to join →
              </Link>
            </div>
          )}

          {!loading && teams.length > 0 && (
            <div className="space-y-3">
              {teams.map((team) => {
                const reg = regByTeam[team._id];
                const sub = subByTeam[team._id];
                const isLeader = team.leader?._id === user?._id || team.leader === user?._id;

                return (
                  <div key={team._id} className="rounded-xl border border-border bg-surface p-5">

                    {/* Team header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-text-primary">{team.name}</h3>
                          {isLeader && (
                            <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-xs text-accent">
                              Leader
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {team.hackathon?.title ?? 'Unknown hackathon'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {reg && <Badge status={reg.status} />}
                        {sub && <Badge status={sub.status} />}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="mb-4">
                      <p className="mb-2 text-xs text-text-faint">Members ({team.members?.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {team.members?.map((m) => (
                          <span key={m._id} className="flex items-center gap-1 rounded-md border border-border bg-elevated px-2.5 py-1 text-xs text-text-muted">
                            {m.name}
                            {m._id === (team.leader?._id ?? team.leader) && (
                              <span className="text-text-faint">·</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                      <Link
                        to={`/teams/${team._id}`}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
                      >
                        Manage Team
                      </Link>
                      {reg?.status === 'approved' && !sub && (
                        <Link
                          to={`/submissions/create?teamId=${team._id}&hackathonId=${team.hackathon?._id}`}
                          className="rounded-lg bg-accent hover:bg-accent-hover px-3 py-1.5 text-xs font-medium text-white transition-colors"
                        >
                          Submit Project
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
