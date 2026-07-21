import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import UserPicker from '../../components/UserPicker';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const STATUS_CLS = {
  upcoming:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  ongoing:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  completed: 'bg-elevated text-text-faint border-border',
};
const REG_STATUS_CLS = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
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

function InlineSpinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function SectionTitle({ children, count }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="text-sm font-semibold text-text-primary">{children}</h2>
      {count != null && (
        <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-xs text-text-faint">{count}</span>
      )}
    </div>
  );
}

// ── Registration row ──────────────────────────────────────────────────────────
function RegistrationRow({ reg, onStatusChange }) {
  const [busy, setBusy] = useState(false);
  const [rowErr, setRowErr] = useState('');

  const updateStatus = async (newStatus) => {
    setBusy(true);
    setRowErr('');
    try {
      await api.put(`/registrations/${reg._id}/status`, { status: newStatus });
      onStatusChange(reg._id, newStatus);
    } catch (err) {
      setRowErr(err.response?.data?.message ?? 'Failed to update status. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const teamName    = reg.team?.name  ?? reg.team  ?? '—';
  const memberCount = Array.isArray(reg.team?.members) ? reg.team.members.length : '—';

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-elevated">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{teamName}</p>
          <p className="text-xs text-text-faint">
            {memberCount !== '—' ? `${memberCount} member${memberCount !== 1 ? 's' : ''}` : 'Members unknown'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize ${REG_STATUS_CLS[reg.status] ?? ''}`}>
            {reg.status}
          </span>

          {reg.status === 'pending' && (
            <div className="flex gap-1.5">
              <button
                disabled={busy} onClick={() => updateStatus('approved')}
                className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                {busy ? <InlineSpinner /> : '✓'} Approve
              </button>
              <button
                disabled={busy} onClick={() => updateStatus('rejected')}
                className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {busy ? <InlineSpinner /> : '✕'} Reject
              </button>
            </div>
          )}
        </div>
      </div>
      {rowErr && (
        <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          ⚠ {rowErr}
        </div>
      )}
    </div>
  );
}

// ── Submission row ────────────────────────────────────────────────────────────
function SubmissionRow({ sub }) {
  const [expanded, setExpanded] = useState(false);
  const teamName = sub.team?.name ?? sub.team ?? '—';

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-elevated">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#1A1F2B] transition-colors"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{sub.projectName}</p>
          <p className="text-xs text-text-faint">Team: {teamName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-faint">{fmt(sub.createdAt)}</span>
          <span className="text-text-faint text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-3 text-sm">
          {sub.problemStatement && (
            <div>
              <p className="text-xs font-medium text-text-faint uppercase tracking-wide mb-1">Problem Statement</p>
              <p className="text-text-muted text-sm">{sub.problemStatement}</p>
            </div>
          )}
          {sub.solutionDescription && (
            <div>
              <p className="text-xs font-medium text-text-faint uppercase tracking-wide mb-1">Solution</p>
              <p className="text-text-muted text-sm">{sub.solutionDescription}</p>
            </div>
          )}
          {sub.githubRepo && (
            <div>
              <p className="text-xs font-medium text-text-faint uppercase tracking-wide mb-1">GitHub Repo</p>
              <a href={sub.githubRepo} target="_blank" rel="noreferrer"
                className="text-accent hover:text-accent-hover underline text-sm break-all transition-colors">{sub.githubRepo}</a>
            </div>
          )}
          {sub.liveDemoUrl && (
            <div>
              <p className="text-xs font-medium text-text-faint uppercase tracking-wide mb-1">Live Demo</p>
              <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer"
                className="text-accent hover:text-accent-hover underline text-sm break-all transition-colors">{sub.liveDemoUrl}</a>
            </div>
          )}
          {sub.demoVideoLink && (
            <div>
              <p className="text-xs font-medium text-text-faint uppercase tracking-wide mb-1">Demo Video</p>
              <a href={sub.demoVideoLink} target="_blank" rel="noreferrer"
                className="text-accent hover:text-accent-hover underline text-sm break-all transition-colors">{sub.demoVideoLink}</a>
            </div>
          )}
          {sub.techStack?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-faint uppercase tracking-wide mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {sub.techStack.map((t, i) => (
                  <span key={i} className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-text-muted">{t}</span>
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
  const [judgeId, setJudgeId] = useState('');
  const [busy, setBusy]       = useState(false);
  const [success, setSuccess] = useState('');
  const [err, setErr]         = useState('');

  const handleAssign = async (e) => {
    e.preventDefault();
    setErr(''); setSuccess('');
    if (!judgeId.trim()) { setErr('Please select a judge.'); return; }
    setBusy(true);
    try {
      await api.post('/reviews/assign', { judgeId: judgeId.trim(), hackathonId });
      setSuccess('Judge assigned successfully.');
      setJudgeId('');
    } catch (error) {
      setErr(error.response?.data?.message ?? 'Failed to assign judge.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleAssign} noValidate className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <UserPicker
          role="judge"
          placeholder="Search for a judge..."
          value={judgeId}
          onChange={(val) => { setJudgeId(val); setErr(''); setSuccess(''); }}
        />
        <button
          type="submit" disabled={busy}
          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {busy ? <InlineSpinner /> : '+'} Assign Judge
        </button>
      </div>
      {err     && <p className="text-xs text-red-400">⚠ {err}</p>}
      {success && <p className="text-xs text-emerald-400">✓ {success}</p>}
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

  const handleRegStatusChange = (regId, newStatus) => {
    setRegistrations((prev) => prev.map((r) => (r._id === regId ? { ...r, status: newStatus } : r)));
  };

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
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-text-muted">{error}</p>
        <Link to="/organizer/dashboard" className="text-sm text-accent hover:text-accent-hover transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const h = hackathon;
  const pendingRegs = registrations.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-base">
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-5">
        <Link to="/organizer/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Hackathon summary */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {h.status && (
              <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize ${STATUS_CLS[h.status] ?? ''}`}>
                {h.status}
              </span>
            )}
            {h.mode && (
              <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-xs text-text-muted capitalize">
                {h.mode}
              </span>
            )}
            {h.theme && (
              <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-xs text-text-muted">
                #{h.theme}
              </span>
            )}
          </div>

          <h1 className="text-xl font-semibold text-text-primary">{h.title}</h1>
          {h.description && <p className="mt-2 text-sm text-text-muted leading-relaxed">{h.description}</p>}

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-lg border border-border bg-elevated p-4 text-center">
            <div>
              <p className="text-lg font-semibold text-text-primary tabular-nums">{registrations.length}</p>
              <p className="text-xs text-text-faint mt-0.5">Registrations</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-400 tabular-nums">{pendingRegs}</p>
              <p className="text-xs text-text-faint mt-0.5">Pending</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary tabular-nums">{submissions.length}</p>
              <p className="text-xs text-text-faint mt-0.5">Submissions</p>
            </div>
          </div>

          {/* Dates */}
          <div className="mt-4 flex flex-wrap gap-5 text-xs text-text-muted">
            <span>{fmt(h.startDate)} → {fmt(h.endDate)}</span>
            {h.registrationDeadline && <span>Reg. deadline: {fmt(h.registrationDeadline)}</span>}
            {h.prizePool && <span>Prize: {h.prizePool}</span>}
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to={`/organizer/hackathons/${id}/edit`}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50"
            >
              {deleting ? <InlineSpinner /> : 'Delete'}
            </button>
          </div>
        </div>

        {/* Registrations */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <SectionTitle count={registrations.length}>Registrations</SectionTitle>
          {registrations.length === 0 ? (
            <p className="text-sm text-text-faint">No registrations yet.</p>
          ) : (
            <div className="space-y-2">
              {registrations.map((reg) => (
                <RegistrationRow key={reg._id} reg={reg} onStatusChange={handleRegStatusChange} />
              ))}
            </div>
          )}
        </div>

        {/* Submissions */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <SectionTitle count={submissions.length}>Submissions</SectionTitle>
          {submissions.length === 0 ? (
            <p className="text-sm text-text-faint">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => <SubmissionRow key={sub._id} sub={sub} />)}
            </div>
          )}
        </div>

        {/* Judges */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <SectionTitle>Judges</SectionTitle>
          {h.assignedJudges?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {h.assignedJudges.map((j) => {
                const judgeId   = j?._id ?? j;
                const judgeName = j?.name;
                return (
                  <span key={judgeId}
                    className="rounded-md border border-border bg-elevated px-2.5 py-1 text-xs text-text-muted">
                    {judgeName ?? judgeId}
                  </span>
                );
              })}
            </div>
          )}
          <p className="mb-3 text-xs text-text-faint">Search and assign a judge to this hackathon.</p>
          <AssignJudgeForm hackathonId={id} />
        </div>

      </main>
    </div>
  );
}
