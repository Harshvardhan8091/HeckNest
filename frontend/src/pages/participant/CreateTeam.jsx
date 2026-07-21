import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

function InlineSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function CreateTeam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hackathonId = searchParams.get('hackathonId') ?? '';

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!name.trim()) { setNameError('Team name is required.'); return; }
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
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Back */}
        <Link
          to="/participant/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          ← Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">Create a Team</h1>
          <p className="mt-1 text-sm text-text-muted">Give your team a name to get started.</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-surface p-6">

          {serverError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="teamName" className="mb-1.5 block text-sm font-medium text-text-muted">
                Team name <span className="text-red-400">*</span>
              </label>
              <input
                id="teamName"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                placeholder="e.g. Binary Beavers"
                className={`w-full rounded-lg border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-faint outline-none focus:ring-1 focus:ring-accent transition-colors
                  ${nameError ? 'border-red-500' : 'border-border focus:border-accent'}`}
              />
              {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent hover:bg-accent-hover px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineSpinner /> Creating…
                </span>
              ) : 'Create Team'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
