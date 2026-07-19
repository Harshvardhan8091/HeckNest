import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Score fields config ───────────────────────────────────────────────────────
const SCORE_FIELDS = [
  { key: 'innovation',           label: 'Innovation',            icon: '💡' },
  { key: 'technicalComplexity',  label: 'Technical Complexity',  icon: '⚙️' },
  { key: 'userInterface',        label: 'User Interface',         icon: '🎨' },
  { key: 'functionality',        label: 'Functionality',          icon: '✅' },
  { key: 'scalability',          label: 'Scalability',            icon: '📈' },
  { key: 'documentation',        label: 'Documentation',          icon: '📄' },
  { key: 'presentation',         label: 'Presentation',           icon: '🎤' },
];

const EMPTY_SCORES = Object.fromEntries(SCORE_FIELDS.map(({ key }) => [key, 0]));

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

const calcTotal = (scores) =>
  SCORE_FIELDS.reduce((sum, { key }) => sum + (Number(scores[key]) || 0), 0);

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
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Score slider row ──────────────────────────────────────────────────────────
function ScoreInput({ icon, label, fieldKey, value, onChange }) {
  const pct = (value / 10) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <span>{icon}</span>{label}
        </label>
        <span className={`tabular-nums text-sm font-bold ${
          value >= 8 ? 'text-emerald-400' :
          value >= 5 ? 'text-purple-400' :
          value >= 3 ? 'text-amber-400' : 'text-slate-500'
        }`}>
          {value}<span className="text-xs text-slate-500 font-normal">/10</span>
        </span>
      </div>

      {/* Visual score bar + number input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 h-2 rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="number"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={(e) => {
            const v = Math.min(10, Math.max(0, Number(e.target.value)));
            onChange(fieldKey, isNaN(v) ? 0 : v);
          }}
          className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white
            outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition"
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReviewSubmission() {
  const { submissionId } = useParams();
  const { user } = useAuth();

  // Submission data
  const [submission,   setSubmission]   = useState(null);
  // Existing review (if already reviewed by this judge)
  const [existingReview, setExistingReview] = useState(null);

  // Form state
  const [scores,   setScores]   = useState(EMPTY_SCORES);
  const [comments, setComments] = useState('');

  // UI state
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  // ── Fetch submission + own review ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch submission details
      const { data: sub } = await api.get(`/submissions/${submissionId}`);
      setSubmission(sub);

      // Try fetching our own review (returns [review] or 404 if none)
      try {
        const { data: reviews } = await api.get(`/reviews/submission/${submissionId}`);
        // Backend returns array; judge only sees their own
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
        // 404 = no review yet — that's fine, leave form blank
      }
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to load submission.');
    } finally {
      setLoading(false);
    }
  }, [submissionId, user?._id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Score change handler ──────────────────────────────────────────────────
  const handleScoreChange = (key, val) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  // ── Submit / Update ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (existingReview) {
        // UPDATE existing review
        await api.put(`/reviews/${existingReview._id}`, { scores, comments });
      } else {
        // CREATE new review
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-2xl font-bold text-white">Submission Not Found</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <Link to="/judge/dashboard"
          className="mt-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-purple-500/50 hover:text-white transition">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const sub = submission;
  const total = calcTotal(scores);

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="rounded-full bg-emerald-500/20 p-6 ring-2 ring-emerald-500/40">
          <span className="text-5xl">✓</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          {existingReview ? 'Review Updated!' : 'Review Submitted!'}
        </h1>
        <p className="max-w-sm text-sm text-slate-400">
          Your review for <span className="text-white font-medium">{sub?.projectName}</span> has been{' '}
          {existingReview ? 'updated' : 'recorded'} with a total score of{' '}
          <span className="text-purple-300 font-bold">{total} / 70</span>.
        </p>
        <Link
          to="/judge/dashboard"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3
            text-sm font-semibold text-white shadow-lg hover:from-violet-500 hover:to-purple-500 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <Link
          to="/judge/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition"
        >
          ← Dashboard
        </Link>

        {/* ── Submission details card ─────────────────────────────────────── */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {/* Status badge */}
          {existingReview && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
              ✓ Already Reviewed — editing your score
            </span>
          )}

          <h1 className="text-2xl font-extrabold text-white mb-1">{sub.projectName}</h1>

          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
            {sub.team?.name && (
              <span>👥 <span className="text-slate-300">{sub.team.name}</span></span>
            )}
            {sub.hackathon?.title && (
              <span>🏆 <span className="text-slate-300">{sub.hackathon.title}</span></span>
            )}
            <span>📅 Submitted {fmt(sub.createdAt)}</span>
          </div>

          <div className="mt-6 space-y-4 text-sm">
            {sub.problemStatement && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Problem Statement</p>
                <p className="text-slate-300 leading-relaxed">{sub.problemStatement}</p>
              </div>
            )}
            {sub.solutionDescription && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Solution</p>
                <p className="text-slate-300 leading-relaxed">{sub.solutionDescription}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-1">
              {sub.githubRepo && (
                <a href={sub.githubRepo} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 underline underline-offset-2 transition">
                  🔗 GitHub Repo
                </a>
              )}
              {sub.liveDemoUrl && (
                <a href={sub.liveDemoUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 underline underline-offset-2 transition">
                  🌐 Live Demo
                </a>
              )}
              {sub.demoVideoLink && (
                <a href={sub.demoVideoLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300 underline underline-offset-2 transition">
                  🎬 Demo Video
                </a>
              )}
            </div>

            {sub.techStack?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {sub.techStack.map((t, i) => (
                    <span key={i}
                      className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs text-purple-300 ring-1 ring-purple-500/30">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Scoring form ────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

            {/* Header row with live total */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Score this Submission</h2>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-purple-300 tabular-nums">{total}</p>
                <p className="text-xs text-slate-500">/ 70 total</p>
              </div>
            </div>

            {/* Total progress bar */}
            <div className="mb-8 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${(total / 70) * 100}%` }}
              />
            </div>

            {/* Score inputs */}
            <div className="space-y-6">
              {SCORE_FIELDS.map(({ key, label, icon }) => (
                <ScoreInput
                  key={key}
                  fieldKey={key}
                  label={label}
                  icon={icon}
                  value={scores[key]}
                  onChange={handleScoreChange}
                />
              ))}
            </div>

            {/* Comments */}
            <div className="mt-8">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Comments <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any notes or feedback for this project…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white
                  placeholder-slate-500 outline-none resize-y focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <span className="mt-0.5">⚠️</span><span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold
                text-white shadow-lg transition hover:from-violet-500 hover:to-purple-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineSpinner /> Saving…
                </span>
              ) : existingReview ? (
                '💾 Update Review'
              ) : (
                '⚖️ Submit Review'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
