import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Score fields config ───────────────────────────────────────────────────────
const SCORE_FIELDS = [
  { key: 'innovation',          label: 'Innovation'           },
  { key: 'technicalComplexity', label: 'Technical Complexity' },
  { key: 'userInterface',       label: 'User Interface'       },
  { key: 'functionality',       label: 'Functionality'        },
  { key: 'scalability',         label: 'Scalability'          },
  { key: 'documentation',       label: 'Documentation'        },
  { key: 'presentation',        label: 'Presentation'         },
];

const EMPTY_SCORES = Object.fromEntries(SCORE_FIELDS.map(({ key }) => [key, 0]));

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const calcTotal = (scores) =>
  SCORE_FIELDS.reduce((sum, { key }) => sum + (Number(scores[key]) || 0), 0);

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

// ── Score row ─────────────────────────────────────────────────────────────────
function ScoreInput({ label, fieldKey, value, onChange }) {
  const pct = (value / 10) * 100;
  const colorCls = value >= 8 ? 'text-emerald-400' : value >= 5 ? 'text-accent' : value >= 3 ? 'text-amber-400' : 'text-text-faint';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm text-text-muted">{label}</label>
        <span className={`tabular-nums text-sm font-semibold ${colorCls}`}>
          {value}<span className="text-xs font-normal text-text-faint">/10</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-1.5 rounded-full bg-elevated">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="number"
          min="0" max="10" step="1"
          value={value}
          onChange={(e) => {
            const v = Math.min(10, Math.max(0, Number(e.target.value)));
            onChange(fieldKey, isNaN(v) ? 0 : v);
          }}
          className="w-14 rounded-lg border border-border bg-elevated px-2 py-1 text-center text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReviewSubmission() {
  const { submissionId } = useParams();
  const { user } = useAuth();

  const [submission,     setSubmission]     = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [scores,         setScores]         = useState(EMPTY_SCORES);
  const [comments,       setComments]       = useState('');
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [success,        setSuccess]        = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: sub } = await api.get(`/submissions/${submissionId}`);
      setSubmission(sub);

      try {
        const { data: reviews } = await api.get(`/reviews/submission/${submissionId}`);
        const mine = Array.isArray(reviews)
          ? reviews.find((r) => {
              const judgeId = r.judge?._id ?? r.judge;
              return judgeId?.toString() === user?._id?.toString();
            })
          : null;
        if (mine) {
          setExistingReview(mine);
          setScores({ ...EMPTY_SCORES, ...mine.scores });
          setComments(mine.comments ?? '');
        }
      } catch {
        // 404 = no review yet
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }, [submissionId, user?._id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleScoreChange = (key, val) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allZero = SCORE_FIELDS.every(({ key }) => (scores[key] ?? 0) === 0);
    if (allZero) {
      setError('Please score at least one criterion before submitting.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (existingReview) {
        await api.put(`/reviews/${existingReview._id}`, { scores, comments });
      } else {
        await api.post('/reviews', { submissionId, scores, comments });
      }
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to submit review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-text-muted">{error}</p>
        <Link to="/judge/dashboard" className="text-sm text-accent hover:text-accent-hover transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const sub   = submission;
  const total = calcTotal(scores);

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-2xl font-semibold text-emerald-400">
            {existingReview ? 'Review Updated' : 'Review Submitted'}
          </p>
          <p className="mt-2 text-sm text-text-muted max-w-xs">
            Your review for <span className="text-text-primary font-medium">{sub?.projectName}</span> was recorded
            with a total score of <span className="text-accent font-semibold">{total} / 70</span>.
          </p>
        </div>
        <Link
          to="/judge/dashboard"
          className="rounded-lg bg-accent hover:bg-accent-hover px-5 py-2 text-sm font-medium text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      <main className="mx-auto max-w-3xl px-6 py-8 space-y-5">
        <Link to="/judge/dashboard" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors">
          ← Back to Dashboard
        </Link>

        {/* Already-reviewed badge */}
        {existingReview && (
          <span className="inline-flex rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
            Editing existing review
          </span>
        )}

        {/* Submission details */}
        <div className="rounded-xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold text-text-primary">{sub.projectName}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-text-muted">
            {sub.team?.name && <span>Team: {sub.team.name}</span>}
            {sub.hackathon?.title && <span>{sub.hackathon.title}</span>}
            <span>Submitted {fmt(sub.createdAt)}</span>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            {sub.problemStatement && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-1">Problem Statement</p>
                <p className="text-text-muted leading-relaxed">{sub.problemStatement}</p>
              </div>
            )}
            {sub.solutionDescription && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-1">Solution</p>
                <p className="text-text-muted leading-relaxed">{sub.solutionDescription}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              {sub.githubRepo && (
                <a href={sub.githubRepo} target="_blank" rel="noreferrer"
                  className="text-accent hover:text-accent-hover underline underline-offset-2 text-sm transition-colors">
                  GitHub Repo
                </a>
              )}
              {sub.liveDemoUrl && (
                <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer"
                  className="text-accent hover:text-accent-hover underline underline-offset-2 text-sm transition-colors">
                  Live Demo
                </a>
              )}
              {sub.demoVideoLink && (
                <a href={sub.demoVideoLink} target="_blank" rel="noreferrer"
                  className="text-accent hover:text-accent-hover underline underline-offset-2 text-sm transition-colors">
                  Demo Video
                </a>
              )}
            </div>

            {sub.techStack?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-2">Tech Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {sub.techStack.map((t, i) => (
                    <span key={i} className="rounded-md border border-border bg-elevated px-2 py-0.5 text-xs text-text-muted">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scoring form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="rounded-xl border border-border bg-surface p-6">
            {/* Score header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Score this Submission</h2>
              <div className="text-right">
                <p className="text-xl font-semibold text-accent tabular-nums">{total}</p>
                <p className="text-xs text-text-faint">/ 70 total</p>
              </div>
            </div>

            {/* Total progress bar */}
            <div className="mb-6 h-1.5 w-full rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${(total / 70) * 100}%` }}
              />
            </div>

            {/* Score inputs */}
            <div className="space-y-5">
              {SCORE_FIELDS.map(({ key, label }) => (
                <ScoreInput
                  key={key}
                  fieldKey={key}
                  label={label}
                  value={scores[key]}
                  onChange={handleScoreChange}
                />
              ))}
            </div>

            {/* Comments */}
            <div className="mt-6">
              <label className="mb-1.5 block text-sm font-medium text-text-muted">
                Comments <span className="text-text-faint font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any notes or feedback for this project…"
                className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-faint outline-none resize-y focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <span>⚠</span><span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-lg bg-accent hover:bg-accent-hover px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineSpinner /> Saving…
                </span>
              ) : existingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
