import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserPicker from '../components/UserPicker';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_CLS = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function Badge({ status }) {
  return (
    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[status] ?? 'bg-elevated text-text-faint border-border'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

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

  const [memberId, setMemberId] = useState('');
  const [memberErr, setMemberErr] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadTeam = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/teams/${id}`);
      setTeam(data);
      const regRes = await api.get('/registrations/my');
      const reg = regRes.data.find((r) => r.team?._id === data._id || r.team === data._id);
      setRegistration(reg ?? null);
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
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-text-muted">{error || 'Team not found.'}</p>
        <Link to="/participant/dashboard" className="text-sm text-accent hover:text-accent-hover transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const isLeader = team.leader?._id === user?._id || team.leader?._id?.toString() === user?._id?.toString();
  const hackathonId = team.hackathon?._id;

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

  return (
    <div className="min-h-screen bg-base">
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-5">
        <Link to="/participant/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Team header card */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-text-primary">{team.name}</h1>
                {registration && <Badge status={registration.status} />}
              </div>
              <p className="mt-0.5 text-sm text-text-muted">
                {team.hackathon?.title ?? 'Unknown Hackathon'}
              </p>
              {team.hackathon?.endDate && (
                <p className="text-xs text-text-faint mt-0.5">Ends {fmt(team.hackathon.endDate)}</p>
              )}
            </div>
          </div>

          {/* Members */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-text-faint">Members ({team.members?.length})</p>
            <div className="flex flex-wrap gap-2">
              {team.members?.map((m) => {
                const isLeaderMember = m._id === (team.leader?._id ?? team.leader);
                return (
                  <span key={m._id} className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2.5 py-1 text-xs text-text-muted">
                    {m.name}
                    {isLeaderMember && (
                      <span className="rounded-sm bg-accent/15 px-1 text-[10px] text-accent">Leader</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leader-only controls */}
        {isLeader && (
          <div className="space-y-4">

            {/* Add member */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-medium text-text-primary">Add Member</h2>
              <form onSubmit={handleAddMember} className="flex gap-2">
                <UserPicker
                  placeholder="Search user to add..."
                  value={memberId}
                  onChange={(val) => { setMemberId(val); setMemberErr(''); }}
                />
                <button
                  type="submit"
                  disabled={memberLoading}
                  className="shrink-0 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                >
                  {memberLoading ? '…' : 'Add'}
                </button>
              </form>
              {memberErr && <p className="mt-2 text-xs text-red-400">{memberErr}</p>}
            </div>

            {/* Register for hackathon */}
            {!registration && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="mb-1 text-sm font-medium text-text-primary">Register for Hackathon</h2>
                <p className="mb-3 text-xs text-text-muted">Your team is not yet registered.</p>
                {regError && (
                  <p className="mb-2 text-xs text-red-400">⚠ {regError}</p>
                )}
                <button
                  onClick={handleRegister}
                  disabled={regLoading || !hackathonId}
                  className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {regLoading ? 'Registering…' : 'Register Team'}
                </button>
              </div>
            )}

            {/* Submit project */}
            {registration?.status === 'approved' && !submission && (
              <Link
                to={`/submissions/create?teamId=${id}&hackathonId=${hackathonId}`}
                className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 transition-colors hover:bg-emerald-500/10"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-400">Submit Your Project</p>
                  <p className="text-xs text-text-muted mt-0.5">Registration approved — ready to submit!</p>
                </div>
                <span className="text-emerald-500">→</span>
              </Link>
            )}

            {/* Action error */}
            {actionError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <span>⚠</span><span>{actionError}</span>
              </div>
            )}

            {/* Danger zone */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-faint">Danger Zone</h2>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete Team'}
              </button>
            </div>
          </div>
        )}

        {/* Member-only controls */}
        {!isLeader && (
          <div className="space-y-4">
            {registration?.status === 'approved' && !submission && (
              <Link
                to={`/submissions/create?teamId=${id}&hackathonId=${hackathonId}`}
                className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 transition-colors hover:bg-emerald-500/10"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-400">Submit Your Project</p>
                  <p className="text-xs text-text-muted mt-0.5">Registration approved — ready to submit!</p>
                </div>
                <span className="text-emerald-500">→</span>
              </Link>
            )}
            {actionError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <span>⚠</span><span>{actionError}</span>
              </div>
            )}
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-colors disabled:opacity-50"
            >
              {leaving ? 'Leaving…' : 'Leave Team'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
