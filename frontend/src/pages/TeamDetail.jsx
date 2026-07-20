import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserPicker from '../components/UserPicker';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_BADGE = {
  pending:  'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize ${STATUS_BADGE[status] ?? 'bg-slate-500/15 text-slate-300 ring-slate-500/30'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <svg className="h-9 w-9 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [submission, setSubmission] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add member form
  const [memberId, setMemberId] = useState('');
  const [memberErr, setMemberErr] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  // Registration action
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Delete / Leave
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState('');

  // ── Fetch team ──────────────────────────────────────────────────────────────
  const loadTeam = async () => {
    try {
      const { data } = await api.get(`/teams/${id}`);
      setTeam(data);

      // After loading team, find registration for this team
      const regRes = await api.get('/registrations/my');
      const reg = regRes.data.find((r) => r.team?._id === data._id || r.team === data._id);
      setRegistration(reg ?? null);

      // Find submission for this team
      const subRes = await api.get('/submissions/my');
      const sub = subRes.data.find((s) => s.team?._id === data._id || s.team === data._id);
      setSubmission(sub ?? null);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load team.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeam(); }, [id]);

  if (loading) return <Spinner />;

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-2xl font-bold text-white">Team Not Found</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/participant/dashboard" className="text-sm text-purple-400 hover:text-purple-300 transition">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isLeader = team.leader?._id === user?._id || team.leader?._id?.toString() === user?._id?.toString();
  const hackathonId = team.hackathon?._id;

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberErr('');
    if (!memberId.trim()) { setMemberErr('User ID is required.'); return; }
    setMemberLoading(true);
    try {
      await api.post(`/teams/${id}/members`, { userId: memberId.trim() });
      setMemberId('');
      await loadTeam();
    } catch (err) {
      setMemberErr(err.response?.data?.message ?? 'Failed to add member.');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    setRegLoading(true);
    try {
      const { data } = await api.post('/registrations', { teamId: id, hackathonId });
      setRegistration(data);
    } catch (err) {
      setRegError(err.response?.data?.message ?? 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this team? This cannot be undone.')) return;
    setActionError('');
    setDeleting(true);
    try {
      await api.delete(`/teams/${id}`);
      navigate('/participant/dashboard');
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to delete team.');
      setDeleting(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave this team?')) return;
    setActionError('');
    setLeaving(true);
    try {
      await api.post(`/teams/${id}/leave`);
      navigate('/participant/dashboard');
    } catch (err) {
      setActionError(err.response?.data?.message ?? 'Failed to leave team.');
      setLeaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-3xl">

        <Link to="/participant/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition">
          ← Dashboard
        </Link>

        {/* Main card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-white">{team.name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                🏆 {team.hackathon?.title ?? 'Unknown Hackathon'}
              </p>
              {team.hackathon?.endDate && (
                <p className="text-xs text-slate-500 mt-0.5">Ends {fmt(team.hackathon.endDate)}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {registration ? (
                <Badge status={registration.status} />
              ) : (
                <span className="text-xs text-slate-500">Not registered</span>
              )}
              {submission && (
                <span className="text-xs text-slate-400">
                  Submission: <Badge status={submission.status} />
                </span>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Members ({team.members?.length} / {team.hackathon?.maxTeamSize ?? '?'})
            </h2>
            <div className="space-y-2">
              {team.members?.map((m) => {
                const mId = m._id?.toString?.() ?? m._id;
                const leaderId = team.leader?._id?.toString?.() ?? team.leader?._id;
                return (
                  <div key={mId} className="flex items-center justify-between rounded-lg border border-white/8 bg-white/3 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400"/>
                      <div>
                        <p className="text-sm font-medium text-white">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email}</p>
                      </div>
                    </div>
                    {mId === leaderId && (
                      <span className="text-xs text-purple-300 bg-purple-500/15 ring-1 ring-purple-500/30 rounded-full px-2 py-0.5">
                        👑 Leader
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action error */}
          {actionError && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span>⚠️</span><span>{actionError}</span>
            </div>
          )}

          {/* ── Leader-only section ─────────────────────────────────────────── */}
          {isLeader && (
            <div className="space-y-6">

              {/* Add member */}
              <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">➕ Add Member</h3>
                <form onSubmit={handleAddMember} className="flex gap-2">
                  <UserPicker
                    placeholder="Search user to add..."
                    value={memberId}
                    onChange={(val) => { setMemberId(val); setMemberErr(''); }}
                  />
                  <button
                    type="submit"
                    disabled={memberLoading}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 transition disabled:opacity-60"
                  >
                    {memberLoading ? '…' : 'Add'}
                  </button>
                </form>
                {memberErr && <p className="mt-2 text-xs text-red-400">{memberErr}</p>}
              </div>

              {/* Register for hackathon */}
              {!registration && (
                <div className="rounded-xl border border-white/10 bg-white/3 p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-1">📝 Register for Hackathon</h3>
                  <p className="text-xs text-slate-500 mb-3">Your team is not yet registered. Register to be eligible for submission.</p>
                  {regError && <p className="mb-2 text-xs text-red-400">⚠️ {regError}</p>}
                  <button
                    onClick={handleRegister}
                    disabled={regLoading || !hackathonId}
                    className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-60 active:scale-95"
                  >
                    {regLoading ? 'Registering…' : '📝 Register Team'}
                  </button>
                </div>
              )}

              {/* Submit project (approved only) */}
              {registration?.status === 'approved' && !submission && (
                <Link
                  to={`/submissions/create?teamId=${id}&hackathonId=${hackathonId}`}
                  className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 hover:bg-emerald-500/15 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">🚀 Submit Your Project</p>
                    <p className="text-xs text-slate-500 mt-0.5">Registration approved — you&apos;re ready to submit!</p>
                  </div>
                  <span className="text-emerald-400">→</span>
                </Link>
              )}

              {/* Delete team */}
              <div className="pt-2 border-t border-white/8">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : '🗑️ Delete Team'}
                </button>
              </div>
            </div>
          )}

          {/* ── Member-only: Leave ──────────────────────────────────────────── */}
          {!isLeader && (
            <div className="pt-4 border-t border-white/8">
              {registration?.status === 'approved' && !submission && (
                <Link
                  to={`/submissions/create?teamId=${id}&hackathonId=${hackathonId}`}
                  className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 hover:bg-emerald-500/15 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">🚀 Submit Your Project</p>
                    <p className="text-xs text-slate-500 mt-0.5">Registration approved — you&apos;re ready to submit!</p>
                  </div>
                  <span className="text-emerald-400">→</span>
                </Link>
              )}
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition disabled:opacity-60"
              >
                {leaving ? 'Leaving…' : '🚪 Leave Team'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
