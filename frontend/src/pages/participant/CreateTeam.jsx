import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function CreateTeam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get('hackathonId') ?? '';

  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) { setNameErr('Team name is required.'); return false; }
    if (!hackathonId) { setServerError('No hackathon selected. Go back and choose a hackathon first.'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setNameErr('');
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post('/teams', { name: name.trim(), hackathon: hackathonId });
      navigate(`/teams/${data._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Failed to create team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 ring-1 ring-purple-500/40">
            👥 HeckNest
          </span>
          <h1 className="mt-5 text-3xl font-extrabold text-white">Create Your Team</h1>
          <p className="mt-1 text-sm text-slate-400">
            {hackathonId
              ? 'Name your team and get started.'
              : 'Browse hackathons first to select one.'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {serverError && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <span className="mt-0.5">⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {!hackathonId && (
            <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              ⚠️ No hackathon ID found in URL. Please{' '}
              <Link to="/hackathons" className="underline hover:text-amber-200">browse hackathons</Link>
              {' '}and click &quot;Register / Create Team&quot; from a hackathon page.
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="teamName" className="mb-1.5 block text-sm font-medium text-slate-300">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                placeholder="e.g. Ctrl+Alt+Defeat"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameErr(''); }}
                className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition
                  focus:ring-2 focus:ring-purple-500
                  ${nameErr ? 'border-red-500/70' : 'border-white/10 focus:border-purple-500/50'}`}
              />
              {nameErr && <p className="mt-1 text-xs text-red-400">{nameErr}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !hackathonId}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition
                hover:from-purple-500 hover:to-pink-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating…
                </span>
              ) : (
                '👥 Create Team'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            <Link to="/participant/dashboard" className="text-purple-400 hover:text-purple-300 transition">
              ← Back to Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
