import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import UserPicker from '../../components/UserPicker';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

const STATUS_STYLE = {
  upcoming:  'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  ongoing:   'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  completed: 'text-slate-400 bg-slate-500/15 ring-slate-500/30',
};
const REG_STATUS_STYLE = {
  pending:  'text-amber-300 bg-amber-500/15 ring-amber-500/30',
  approved: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  rejected: 'text-red-300 bg-red-500/15 ring-red-500/30',
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

function InlineSpinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function SectionHeading({ icon, title, count }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {count != null && (
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-400">{count}</span>
      )}
    </div>
  );
}

// ── Registration row ──────────────────────────────────────────────────────────
function RegistrationRow({ reg, onStatusChange }) {
  const [busy, setBusy] = useState(false);

  const updateStatus = async (newStatus) => {
    setBusy(true);
    try {
      await api.put(`/registrations/${reg._id}/status`, { status: newStatus });
      onStatusChange(reg._id, newStatus);
    } catch {
      // silently fail — user can retry
    } finally {
      setBusy(false);
    }
  };

  const teamName   = reg.team?.name  ?? reg.team  ?? '—';
  const memberCount = Array.isArray(reg.team?.members) ? reg.team.members.length : '—';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-5 py-4">
      <div className="flex flex-col gap-1 min-w-0">
        <p className="font-semibold text-white truncate">{teamName}</p>
        <p className="text-xs text-slate-500">
          {memberCount !== '—' ? `${memberCount} member${memberCount !== 1 ? 's' : ''}` : 'Members unknown'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize
          ${REG_STATUS_STYLE[reg.status] ?? ''}`}>
          {reg.status}
        </span>

        {reg.status === 'pending' && (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => updateStatus('approved')}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-3 py-1.5 text-xs font-semibold text-emerald-300
                border border-emerald-500/30 hover:bg-emerald-600/30 transition disabled:opacity-50"
            >
              {busy ? <InlineSpinner /> : '✓'} Approve
            </button>
            <button
              disabled={busy}
              onClick={() => updateStatus('rejected')}
              className="flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-300
                border border-red-500/30 hover:bg-red-600/30 transition disabled:opacity-50"
            >
              {busy ? <InlineSpinner /> : '✕'} Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Submission row ────────────────────────────────────────────────────────────
function SubmissionRow({ sub }) {
  const [expanded, setExpanded] = useState(false);
  const teamName = sub.team?.name ?? sub.team ?? '—';

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-semibold text-white truncate">{sub.projectName}</p>
          <p className="text-xs text-slate-500">Team: {teamName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{fmt(sub.createdAt)}</span>
          <span className="text-slate-500 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/8 px-5 py-4 space-y-3 text-sm">
          {sub.problemStatement && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Problem Statement</p>
              <p className="text-slate-300">{sub.problemStatement}</p>
            </div>
          )}
          {sub.solutionDescription && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Solution</p>
              <p className="text-slate-300">{sub.solutionDescription}</p>
            </div>
          )}
          {sub.githubRepo && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">GitHub Repo</p>
              <a href={sub.githubRepo} target="_blank" rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline break-all">{sub.githubRepo}</a>
            </div>
          )}
          {sub.liveDemoUrl && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Live Demo</p>
              <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline break-all">{sub.liveDemoUrl}</a>
            </div>
          )}
          {sub.demoVideoLink && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Demo Video</p>
              <a href={sub.demoVideoLink} target="_blank" rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 underline break-all">{sub.demoVideoLink}</a>
            </div>
          )}
          {sub.techStack?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {sub.techStack.map((t, i) => (
                  <span key={i} className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-purple-300 ring-1 ring-purple-500/30">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ── Assign Judge form ─────────────────────────────────────────────────────────
function AssignJudgeForm({ hackathonId }) {
  const [judgeId, setJudgeId]   = useState('');
  const [busy, setBusy]         = useState(false);
  const [success, setSuccess]   = useState('');
  const [err, setErr]           = useState('');

  const handleAssign = async (e) => {
    e.preventDefault();
    setErr(''); setSuccess('');
    if (!judgeId.trim()) { setErr('Please enter a Judge User ID.'); return; }
    setBusy(true);
    try {
      await api.post('/reviews/assign', { judgeId: judgeId.trim(), hackathonId });
      setSuccess('Judge assigned successfully!');
      setJudgeId('');
    } catch (error) {
      setErr(error.response?.data?.message ?? 'Failed to assign judge.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleAssign} noValidate className="flex flex-wrap gap-3">
      <UserPicker
        role="judge"
        placeholder="Search for a judge..."
        value={judgeId}
        onChange={(val) => { setJudgeId(val); setErr(''); setSuccess(''); }}
      />
      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm
          font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-60"
      >
        {busy ? <InlineSpinner /> : '＋'} Assign Judge
      </button>
      {err     && <p className="w-full text-xs text-red-400">{err}</p>}
      {success && <p className="w-full text-xs text-emerald-400">{success}</p>}
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManageHackathon() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hackathon,     setHackathon]     = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [submissions,   setSubmissions]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [deleting,      setDeleting]      = useState(false);

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [hackRes, regRes, subRes] = await Promise.all([
        api.get(`/hackathons/${id}`),
        api.get(`/registrations/hackathon/${id}`).catch(() => ({ data: [] })),
        api.get(`/submissions/hackathon/${id}`).catch(() => ({ data: [] })),
      ]);
      setHackathon(hackRes.data);
      setRegistrations(Array.isArray(regRes.data) ? regRes.data : []);
      setSubmissions(Array.isArray(subRes.data) ? subRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load hackathon.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Registration status update ──────────────────────────────────────────────
  const handleRegStatusChange = (regId, newStatus) => {
    setRegistrations((prev) =>
      prev.map((r) => (r._id === regId ? { ...r, status: newStatus } : r))
    );
  };

  // ── Delete hackathon ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm(`Delete "${hackathon?.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/hackathons/${id}`);
      navigate('/organizer/dashboard');
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete hackathon.');
      setDeleting(false);
    }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-2xl font-bold text-white">Hackathon Not Found</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/organizer/dashboard"
          className="mt-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-purple-500/50 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const h = hackathon;
  const pendingRegs   = registrations.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* ── Back ──────────────────────────────────────────────────────────── */}
        <Link to="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition">
          ← Dashboard
        </Link>

        {/* ── Hackathon summary card ─────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          {/* Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {h.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 capitalize
                ${STATUS_STYLE[h.status] ?? ''}`}>
                {h.status}
              </span>
            )}
            {h.mode && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300 capitalize">
                {h.mode === 'online' ? '🌐' : '📍'} {h.mode}
              </span>
            )}
            {h.theme && (
              <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30">
                #{h.theme}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold text-white">{h.title}</h1>
          {h.description && <p className="mt-3 text-sm leading-relaxed text-slate-300">{h.description}</p>}

          {/* Stats grid */}
          <div className="mt-6 grid gap-3 rounded-xl border border-white/8 bg-white/3 p-5 sm:grid-cols-3 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-300">{registrations.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Registrations</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-300">{pendingRegs}</p>
              <p className="text-xs text-slate-500 mt-0.5">Pending Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-300">{submissions.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Submissions</p>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-400">
            <span>📅 <span className="text-slate-300">{fmt(h.startDate)}</span> → <span className="text-slate-300">{fmt(h.endDate)}</span></span>
            {h.registrationDeadline && <span>⏰ Reg. deadline: <span className="text-slate-300">{fmt(h.registrationDeadline)}</span></span>}
            {h.prizePool && <span>🏆 <span className="text-slate-300">{h.prizePool}</span></span>}
          </div>

          {/* Action buttons */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={`/organizer/hackathons/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium
                text-slate-300 hover:border-purple-500/40 hover:text-white transition"
            >
              ✏️ Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium
                text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition disabled:opacity-60"
            >
              {deleting ? <InlineSpinner /> : '🗑️'} Delete
            </button>
          </div>
        </div>

        {/* ── Registrations ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <SectionHeading icon="📋" title="Registrations" count={registrations.length} />

          {registrations.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {registrations.map((reg) => (
                <RegistrationRow
                  key={reg._id}
                  reg={reg}
                  onStatusChange={handleRegStatusChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Submissions ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <SectionHeading icon="💡" title="Submissions" count={submissions.length} />

          {submissions.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No submissions yet.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <SubmissionRow key={sub._id} sub={sub} />
              ))}
            </div>
          )}
        </div>

        {/* ── Judges ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <SectionHeading icon="⚖️" title="Judges" />

          {/* Currently assigned judges */}
          {h.assignedJudges?.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {h.assignedJudges.map((j) => {
                const judgeId = j?._id ?? j;
                const judgeName = j?.name;
                return (
                  <span key={judgeId}
                    className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30">
                    {judgeName ?? judgeId}
                  </span>
                );
              })}
            </div>
          )}

          <p className="mb-3 text-xs text-slate-500">
            Enter a judge's User ID to assign them to this hackathon.
          </p>
          <AssignJudgeForm hackathonId={id} />
        </div>

      </div>
    </div>
  );
}
