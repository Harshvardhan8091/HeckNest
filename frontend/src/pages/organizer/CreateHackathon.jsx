import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputBase =
  'w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:ring-2 focus:ring-purple-500';
const inputNormal  = `${inputBase} border-white/10 focus:border-purple-500/50`;
const inputError   = `${inputBase} border-red-500/70`;
const labelClass   = 'mb-1.5 block text-sm font-medium text-slate-300';

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className={labelClass}>
        {label}{required && <span className="ml-0.5 text-pink-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="mt-8 mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 border-b border-white/8 pb-2">
      {children}
    </h2>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CreateHackathon() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    theme: '',
    mode: '',
    venue: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    bannerImage: '',
    prizePool: '',
    maxTeamSize: '4',
    rules: '',
    judgingCriteria: '',
  });

  const [errors, setErrors]           = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]         = useState(false);

  // ── Field helpers ──────────────────────────────────────────────────────────
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: '' }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.title.trim())                   errs.title = 'Title is required.';
    if (!form.description.trim())             errs.description = 'Description is required.';
    if (!form.startDate)                      errs.startDate = 'Start date is required.';
    if (!form.endDate)                        errs.endDate = 'End date is required.';
    if (!form.registrationDeadline)           errs.registrationDeadline = 'Registration deadline is required.';
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate))
      errs.endDate = 'End date must be after start date.';
    if (form.registrationDeadline && form.startDate && new Date(form.registrationDeadline) > new Date(form.startDate))
      errs.registrationDeadline = 'Registration deadline must be on or before start date.';
    if (form.maxTeamSize && (isNaN(Number(form.maxTeamSize)) || Number(form.maxTeamSize) < 1))
      errs.maxTeamSize = 'Must be a positive number.';
    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const payload = {
        title:                form.title.trim(),
        description:          form.description.trim(),
        startDate:            form.startDate,
        endDate:              form.endDate,
        registrationDeadline: form.registrationDeadline,
        ...(form.theme       && { theme: form.theme.trim() }),
        ...(form.mode        && { mode: form.mode }),
        ...(form.venue       && { venue: form.venue.trim() }),
        ...(form.bannerImage && { bannerImage: form.bannerImage.trim() }),
        ...(form.prizePool   && { prizePool: form.prizePool.trim() }),
        ...(form.rules       && { rules: form.rules.trim() }),
        maxTeamSize: Number(form.maxTeamSize) || 4,
        judgingCriteria: form.judgingCriteria
          ? form.judgingCriteria.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const { data } = await api.post('/hackathons', payload);
      navigate(`/organizer/hackathons/${data._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Failed to create hackathon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-2xl">

        {/* Back */}
        <Link
          to="/organizer/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 ring-1 ring-purple-500/40">
            🚀 HeckNest
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-white">Create a Hackathon</h1>
          <p className="mt-1 text-sm text-slate-400">Fill in the details below to launch your event.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {/* Server error */}
          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span className="mt-0.5">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* ─ Basic info ─────────────────────────────────────────────────── */}
            <SectionTitle>Basic Info</SectionTitle>

            <Field label="Title" required error={errors.title}>
              <input id="title" type="text" placeholder="e.g. CodeSprint 2025"
                value={form.title} onChange={set('title')}
                className={errors.title ? inputError : inputNormal} />
            </Field>

            <Field label="Description" required error={errors.description}>
              <textarea id="description" rows={4} placeholder="What is this hackathon about?"
                value={form.description} onChange={set('description')}
                className={`${errors.description ? inputError : inputNormal} resize-y`} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Theme" error={errors.theme}>
                <input id="theme" type="text" placeholder="e.g. AI, Web3, Health"
                  value={form.theme} onChange={set('theme')}
                  className={errors.theme ? inputError : inputNormal} />
              </Field>

              <Field label="Mode" error={errors.mode}>
                <select id="mode" value={form.mode} onChange={set('mode')}
                  className={`${errors.mode ? inputError : inputNormal} bg-slate-800`}>
                  <option value="">Select mode…</option>
                  <option value="online">🌐 Online</option>
                  <option value="offline">📍 Offline</option>
                </select>
              </Field>
            </div>

            <Field label="Venue" error={errors.venue}>
              <input id="venue" type="text" placeholder="City / Address (leave blank for online)"
                value={form.venue} onChange={set('venue')}
                className={errors.venue ? inputError : inputNormal} />
            </Field>

            {/* ─ Dates ──────────────────────────────────────────────────────── */}
            <SectionTitle>Dates</SectionTitle>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Start Date" required error={errors.startDate}>
                <input id="startDate" type="date"
                  value={form.startDate} onChange={set('startDate')}
                  className={`${errors.startDate ? inputError : inputNormal} [color-scheme:dark]`} />
              </Field>

              <Field label="End Date" required error={errors.endDate}>
                <input id="endDate" type="date"
                  value={form.endDate} onChange={set('endDate')}
                  className={`${errors.endDate ? inputError : inputNormal} [color-scheme:dark]`} />
              </Field>

              <Field label="Registration Deadline" required error={errors.registrationDeadline}>
                <input id="registrationDeadline" type="date"
                  value={form.registrationDeadline} onChange={set('registrationDeadline')}
                  className={`${errors.registrationDeadline ? inputError : inputNormal} [color-scheme:dark]`} />
              </Field>
            </div>

            {/* ─ Details ────────────────────────────────────────────────────── */}
            <SectionTitle>Additional Details</SectionTitle>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prize Pool" error={errors.prizePool}>
                <input id="prizePool" type="text" placeholder="e.g. ₹1,00,000"
                  value={form.prizePool} onChange={set('prizePool')}
                  className={errors.prizePool ? inputError : inputNormal} />
              </Field>

              <Field label="Max Team Size" error={errors.maxTeamSize}>
                <input id="maxTeamSize" type="number" min="1" placeholder="4"
                  value={form.maxTeamSize} onChange={set('maxTeamSize')}
                  className={errors.maxTeamSize ? inputError : inputNormal} />
              </Field>
            </div>

            <Field label="Banner Image URL" error={errors.bannerImage}>
              <input id="bannerImage" type="url" placeholder="https://…"
                value={form.bannerImage} onChange={set('bannerImage')}
                className={errors.bannerImage ? inputError : inputNormal} />
            </Field>

            <Field label="Rules" error={errors.rules}>
              <textarea id="rules" rows={4} placeholder="Event rules and guidelines…"
                value={form.rules} onChange={set('rules')}
                className={`${errors.rules ? inputError : inputNormal} resize-y`} />
            </Field>

            <Field label="Judging Criteria" error={errors.judgingCriteria}>
              <input id="judgingCriteria" type="text"
                placeholder="e.g. Innovation, Feasibility, Presentation (comma-separated)"
                value={form.judgingCriteria} onChange={set('judgingCriteria')}
                className={errors.judgingCriteria ? inputError : inputNormal} />
              <p className="mt-1 text-xs text-slate-500">Separate each criterion with a comma.</p>
            </Field>

            {/* ─ Submit ─────────────────────────────────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold
                text-white shadow-lg transition hover:from-purple-500 hover:to-pink-500 active:scale-95
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Creating…
                </span>
              ) : (
                '🚀 Create Hackathon'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
