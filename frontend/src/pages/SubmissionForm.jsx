import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const TECH_SUGGESTIONS = ['React', 'Node.js', 'Python', 'MongoDB', 'PostgreSQL', 'Docker', 'TensorFlow', 'Next.js', 'FastAPI', 'Flutter'];

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
      const { data } = await api.post('/submissions', {
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

  const fieldCls = (name) =>
    `w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition
     focus:ring-2 focus:ring-purple-500
     ${errors[name] ? 'border-red-500/70' : 'border-white/10 focus:border-purple-500/50'}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-2xl">

        <Link to={`/teams/${teamId}`} className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition">
          ← Back to Team
        </Link>

        {/* Header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 ring-1 ring-purple-500/40">
            📦 Submit Project
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-white">Project Submission</h1>
          <p className="mt-1 text-sm text-slate-400">Fill in your project details below. Required fields are marked.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {serverError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span className="mt-0.5">⚠️</span><span>{serverError}</span>
            </div>
          )}
          {errors._base && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              <span className="mt-0.5">⚠️</span><span>{errors._base}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* Project Name */}
            <div>
              <label htmlFor="projectName" className="mb-1.5 block text-sm font-medium text-slate-300">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input id="projectName" name="projectName" type="text" placeholder="My Awesome Project" value={form.projectName} onChange={handleChange} className={fieldCls('projectName')}/>
              {errors.projectName && <p className="mt-1 text-xs text-red-400">{errors.projectName}</p>}
            </div>

            {/* Problem Statement */}
            <div>
              <label htmlFor="problemStatement" className="mb-1.5 block text-sm font-medium text-slate-300">Problem Statement</label>
              <textarea id="problemStatement" name="problemStatement" rows={3} placeholder="What problem are you solving?" value={form.problemStatement} onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500 resize-none"/>
            </div>

            {/* Solution Description */}
            <div>
              <label htmlFor="solutionDescription" className="mb-1.5 block text-sm font-medium text-slate-300">Solution Description</label>
              <textarea id="solutionDescription" name="solutionDescription" rows={4} placeholder="Describe your solution in detail…" value={form.solutionDescription} onChange={handleChange}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500 resize-none"/>
            </div>

            {/* GitHub */}
            <div>
              <label htmlFor="githubRepo" className="mb-1.5 block text-sm font-medium text-slate-300">
                GitHub Repository <span className="text-red-400">*</span>
              </label>
              <input id="githubRepo" name="githubRepo" type="url" placeholder="https://github.com/yourteam/project" value={form.githubRepo} onChange={handleChange} className={fieldCls('githubRepo')}/>
              {errors.githubRepo && <p className="mt-1 text-xs text-red-400">{errors.githubRepo}</p>}
            </div>

            {/* Live Demo + Video */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="liveDemoUrl" className="mb-1.5 block text-sm font-medium text-slate-300">Live Demo URL</label>
                <input id="liveDemoUrl" name="liveDemoUrl" type="url" placeholder="https://..." value={form.liveDemoUrl} onChange={handleChange} className={fieldCls('liveDemoUrl')}/>
              </div>
              <div>
                <label htmlFor="demoVideoLink" className="mb-1.5 block text-sm font-medium text-slate-300">Demo Video Link</label>
                <input id="demoVideoLink" name="demoVideoLink" type="url" placeholder="YouTube / Loom URL" value={form.demoVideoLink} onChange={handleChange} className={fieldCls('demoVideoLink')}/>
              </div>
            </div>

            {/* Presentation PDF */}
            <div>
              <label htmlFor="presentationPdf" className="mb-1.5 block text-sm font-medium text-slate-300">Presentation PDF URL</label>
              <input id="presentationPdf" name="presentationPdf" type="url" placeholder="https://..." value={form.presentationPdf} onChange={handleChange} className={fieldCls('presentationPdf')}/>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tech Stack</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a technology…"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(techInput); }}}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500 transition"
                />
                <button type="button" onClick={() => addTech(techInput)} className="rounded-lg bg-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/15 transition">
                  Add
                </button>
              </div>
              {/* Quick-add suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TECH_SUGGESTIONS.filter((t) => !techStack.includes(t)).map((t) => (
                  <button key={t} type="button" onClick={() => addTech(t)}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400 hover:border-purple-500/40 hover:text-slate-200 transition">
                    + {t}
                  </button>
                ))}
              </div>
              {/* Selected tags */}
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {techStack.map((t) => (
                    <span key={t} className="flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300 ring-1 ring-purple-500/30">
                      {t}
                      <button type="button" onClick={() => removeTech(t)} className="hover:text-red-300 transition">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !teamId || !hackathonId}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition
                hover:from-purple-500 hover:to-pink-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Submitting…
                </span>
              ) : (
                '🚀 Submit Project'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
