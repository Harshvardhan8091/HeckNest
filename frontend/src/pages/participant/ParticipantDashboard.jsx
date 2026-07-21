import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  pending:      'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  approved:     'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  rejected:     'bg-red-500/15 text-red-300 ring-red-500/30',
  under_review: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize ${STATUS_BADGE[status] ?? 'bg-slate-500/15 text-slate-300 ring-slate-500/30'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function StatCard({ icon, label, value, sub, loading }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-slate-400">{label}</span>
      </div>
      {loading ? (
        <div className="mt-1 h-8 w-12 animate-pulse rounded-md bg-white/10" />
      ) : (
        <p className="text-3xl font-bold text-white">{value}</p>
      )}
      {sub && !loading && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <svg className="h-7 w-7 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
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

  // Build a lookup: teamId -> registration
  const regByTeam = {};
  registrations.forEach((r) => {
    if (r.team?._id) regByTeam[r.team._id] = r;
  });

  // Build a lookup: teamId -> submission
  const subByTeam = {};
  submissions.forEach((s) => {
    if (s.team?._id) subByTeam[s.team._id] = s;
  });

  const approvedCount = registrations.filter((r) => r.status === 'approved').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-400 font-medium">👋 Welcome back,</p>
            <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email} · participant</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-red-500/40 hover:text-red-300 transition"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
          <StatCard icon="🏆" label="Hackathons" value={registrations.length} sub={`${approvedCount} approved`} loading={loading}/>
          <StatCard icon="👥" label="Teams" value={teams.length} loading={loading}/>
          <StatCard icon="📦" label="Submissions" value={submissions.length} loading={loading}/>
          <StatCard icon="✅" label="Approved Regs" value={approvedCount} loading={loading}/>
        </div>

        {/* Quick action */}
        <div className="mb-8">
          <Link
            to="/hackathons"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-pink-500 transition active:scale-95"
          >
            🔍 Browse Hackathons
          </Link>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-8 flex flex-col gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2"><span>⚠️</span><span>{error}</span></span>
            <button
              onClick={loadData}
              className="shrink-0 rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Teams section */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-white">My Teams</h2>

          {loading && <Spinner />}

          {!loading && !error && teams.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <span className="text-4xl">👥</span>
              <p className="mt-3 text-sm text-slate-400">You&apos;re not in any team yet.</p>
              <Link
                to="/hackathons"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition"
              >
                Find a hackathon to join →
              </Link>
            </div>
          )}

          {!loading && teams.length > 0 && (
            <div className="space-y-4">
              {teams.map((team) => {
                const reg = regByTeam[team._id];
                const sub = subByTeam[team._id];
                const isLeader = team.leader?._id === user?._id || team.leader === user?._id;

                return (
                  <div
                    key={team._id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                  >
                    {/* Team header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          {team.name}
                          {isLeader && (
                            <span className="text-xs font-normal text-purple-300 bg-purple-500/15 ring-1 ring-purple-500/30 rounded-full px-2 py-0.5">
                              Leader
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          🏆 {team.hackathon?.title ?? 'Unknown hackathon'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {reg && <Badge status={reg.status} />}
                        {sub && (
                          <span className="text-xs text-slate-400">
                            Submission: <Badge status={sub.status} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Members */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Members ({team.members?.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {team.members?.map((m) => (
                          <span key={m._id} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1 text-xs text-slate-300 border border-white/8">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"/>
                            {m.name}
                            {m._id === (team.leader?._id ?? team.leader) && (
                              <span className="text-purple-400">👑</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-white/8">
                      <Link
                        to={`/teams/${team._id}`}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-purple-500/50 hover:text-white transition"
                      >
                        Manage Team →
                      </Link>
                      {reg?.status === 'approved' && !sub && (
                        <Link
                          to={`/submissions/create?teamId=${team._id}&hackathonId=${team.hackathon?._id}`}
                          className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition"
                        >
                          📦 Submit Project
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
