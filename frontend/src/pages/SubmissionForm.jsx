import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const TECH_SUGGESTIONS = ['React', 'Node.js', 'Python', 'MongoDB', 'PostgreSQL', 'Docker', 'TensorFlow', 'Next.js', 'FastAPI', 'Flutter'];

const inputCls = (error) =>
  `w-full rounded-lg border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-faint outline-none focus:ring-1 focus:ring-accent transition-colors
   ${error ? 'border-red-500' : 'border-border focus:border-accent'}`;

function InlineSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function SectionLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-text-muted">
      {children}{required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

export default function SubmissionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId') ?? '';
  const hackathonId = searchParams.get('hackathonId') ?? '';

  const [form, setForm] = useState({
    projectName: '',
    problemStatement: '',
    solutionDescription: '',
    githubRepo: '',
    liveDemoUrl: '',
    demoVideoLink: '',
    presentationPdf: '',
  });
  const [techStack, setTechStack] = useState([]);
  const [techInput, setTechInput] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setServerError('');
  };

  const addTech = (tech) => {
    const t = tech.trim();
    if (t && !techStack.includes(t)) setTechStack((p) => [...p, t]);
    setTechInput('');
  };

  const removeTech = (t) => setTechStack((p) => p.filter((x) => x !== t));

  const validate = () => {
    const errs = {};
    if (!form.projectName.trim()) errs.projectName = 'Project name is required.';
    if (!form.githubRepo.trim()) errs.githubRepo = 'GitHub repo URL is required.';
    else if (!/^https?:\/\/.+/.test(form.githubRepo)) errs.githubRepo = 'Enter a valid URL starting with http(s)://';
    if (!teamId) errs._base = 'No team ID found.';
    if (!hackathonId) errs._base = 'No hackathon ID found.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await api.post('/submissions', {
        team: teamId,
        hackathon: hackathonId,
        projectName: form.projectName,
        problemStatement: form.problemStatement,
        solutionDescription: form.solutionDescription,
        githubRepo: form.githubRepo,
        liveDemoUrl: form.liveDemoUrl || undefined,
        demoVideoLink: form.demoVideoLink || undefined,
        presentationPdf: form.presentationPdf || undefined,
        techStack,
      });
      navigate(`/teams/${teamId}`, { state: { submitted: true } });
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-base/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link to={`/teams/${teamId}`} className="text-sm text-text-muted hover:text-text-primary transition-colors">
            ← Back to Team
          </Link>
          <span className="text-sm font-semibold text-text-primary">HeckNest</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">Submit Project</h1>
          <p className="mt-1 text-sm text-text-muted">Fill in your project details below.</p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="shrink-0">⚠</span><span>{serverError}</span>
          </div>
        )}
        {errors._base && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            <span className="shrink-0">⚠</span><span>{errors._base}</span>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Project Name */}
            <div>
              <SectionLabel required>Project Name</SectionLabel>
              <input id="projectName" name="projectName" type="text" placeholder="My Awesome Project"
                value={form.projectName} onChange={handleChange} className={inputCls(errors.projectName)} />
              {errors.projectName && <p className="mt-1 text-xs text-red-400">{errors.projectName}</p>}
            </div>

            {/* Problem Statement */}
            <div>
              <SectionLabel>Problem Statement</SectionLabel>
              <textarea id="problemStatement" name="problemStatement" rows={3}
                placeholder="What problem are you solving?"
                value={form.problemStatement} onChange={handleChange}
                className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none" />
            </div>

            {/* Solution Description */}
            <div>
              <SectionLabel>Solution Description</SectionLabel>
              <textarea id="solutionDescription" name="solutionDescription" rows={4}
                placeholder="Describe your solution in detail…"
                value={form.solutionDescription} onChange={handleChange}
                className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none" />
            </div>

            {/* GitHub */}
            <div>
              <SectionLabel required>GitHub Repository</SectionLabel>
              <input id="githubRepo" name="githubRepo" type="url" placeholder="https://github.com/yourteam/project"
                value={form.githubRepo} onChange={handleChange} className={inputCls(errors.githubRepo)} />
              {errors.githubRepo && <p className="mt-1 text-xs text-red-400">{errors.githubRepo}</p>}
            </div>

            {/* Live Demo + Video */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <SectionLabel>Live Demo URL</SectionLabel>
                <input id="liveDemoUrl" name="liveDemoUrl" type="url" placeholder="https://..."
                  value={form.liveDemoUrl} onChange={handleChange} className={inputCls(errors.liveDemoUrl)} />
              </div>
              <div>
                <SectionLabel>Demo Video Link</SectionLabel>
                <input id="demoVideoLink" name="demoVideoLink" type="url" placeholder="YouTube / Loom URL"
                  value={form.demoVideoLink} onChange={handleChange} className={inputCls(errors.demoVideoLink)} />
              </div>
            </div>

            {/* Presentation PDF */}
            <div>
              <SectionLabel>Presentation PDF URL</SectionLabel>
              <input id="presentationPdf" name="presentationPdf" type="url" placeholder="https://..."
                value={form.presentationPdf} onChange={handleChange} className={inputCls(errors.presentationPdf)} />
            </div>

            {/* Tech Stack */}
            <div>
              <SectionLabel>Tech Stack</SectionLabel>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a technology…"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput); } }}
                  className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder-text-faint outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                />
                <button type="button" onClick={() => addTech(techInput)}
                  className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-muted hover:border-border-strong hover:text-text-primary transition-colors">
                  Add
                </button>
              </div>

              {/* Quick-add suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TECH_SUGGESTIONS.filter((t) => !techStack.includes(t)).map((t) => (
                  <button key={t} type="button" onClick={() => addTech(t)}
                    className="rounded-md border border-border bg-elevated px-2 py-0.5 text-xs text-text-faint hover:border-border-strong hover:text-text-muted transition-colors">
                    + {t}
                  </button>
                ))}
              </div>

              {/* Selected tags */}
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {techStack.map((t) => (
                    <span key={t} className="flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">
                      {t}
                      <button type="button" onClick={() => removeTech(t)} className="hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !teamId || !hackathonId}
              className="mt-1 w-full rounded-lg bg-accent hover:bg-accent-hover px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineSpinner /> Submitting…
                </span>
              ) : 'Submit Project'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
