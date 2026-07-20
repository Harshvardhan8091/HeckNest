import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// ── Rank medal config ─────────────────────────────────────────────────────────
const RANK_CONFIG = {
  1: {
    medal:  '🥇',
    row:    'bg-amber-500/10 border-l-2 border-amber-400/60',
    rank:   'text-amber-300 font-extrabold',
    score:  'text-amber-300',
  },
  2: {
    medal:  '🥈',
    row:    'bg-slate-400/5 border-l-2 border-slate-400/40',
    rank:   'text-slate-300 font-bold',
    score:  'text-slate-300',
  },
  3: {
    medal:  '🥉',
    row:    'bg-orange-600/5 border-l-2 border-orange-600/40',
    rank:   'text-orange-300 font-bold',
    score:  'text-orange-300',
  },
};

function getRankConfig(rank) {
  return RANK_CONFIG[rank] ?? {
    medal: null,
    row:   '',
    rank:  'text-slate-500',
    score: 'text-slate-300',
  };
}

// ── Spinner ───────────────────────────────────────────────────────────────────
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const { id } = useParams();

  const [hackathonName, setHackathonName] = useState('');
  const [entries, setEntries]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/leaderboard/${id}`);
        setHackathonName(data.hackathon ?? 'Hackathon');
        setEntries(Array.isArray(data.leaderboard) ? data.leaderboard : []);
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-4xl">

        {/* Back link */}
        <Link
          to={`/hackathons/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition"
        >
          ← Back to hackathon
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30">
            🏆 Leaderboard
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {hackathonName}
          </h1>
          {!error && entries.length > 0 && (
            <p className="mt-1 text-sm text-slate-400">
              {entries.length} team{entries.length !== 1 ? 's' : ''} ranked
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300 flex items-start gap-3">
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
            <span className="text-5xl mb-4">🏁</span>
            <h2 className="text-xl font-bold text-white mb-2">No results yet</h2>
            <p className="text-sm text-slate-400">
              No submissions have been reviewed yet. Check back after judging is complete.
            </p>
          </div>
        )}

        {/* ── Leaderboard table ──────────────────────────────────────────────── */}
        {!error && entries.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">

            {/* Top-3 podium strip */}
            {entries.length >= 1 && (
              <div className="grid grid-cols-1 gap-px border-b border-white/10 sm:grid-cols-3 bg-white/5">
                {entries.slice(0, Math.min(3, entries.length)).map((entry) => {
                  const cfg = getRankConfig(entry.rank);
                  return (
                    <div key={entry.submissionId}
                      className={`flex flex-col items-center gap-1 px-5 py-6 ${cfg.row}`}>
                      <span className="text-3xl">{cfg.medal}</span>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-1">
                        Rank {entry.rank}
                      </p>
                      <p className="text-base font-bold text-white text-center leading-tight">
                        {entry.teamName}
                      </p>
                      <p className="text-xs text-slate-400 text-center truncate w-full px-2">
                        {entry.projectName}
                      </p>
                      <p className={`mt-2 text-xl font-extrabold tabular-nums ${cfg.score}`}>
                        {entry.averageScore.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500"> / 70</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full ranked table */}
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3 w-16">Rank</th>
                  <th className="px-6 py-3">Team</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Project</th>
                  <th className="px-6 py-3 text-right">Avg Score</th>
                  <th className="px-6 py-3 text-right hidden md:table-cell">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {entries.map((entry) => {
                  const cfg = getRankConfig(entry.rank);
                  return (
                    <tr
                      key={entry.submissionId}
                      className={`hover:bg-white/5 transition ${entry.rank <= 3 ? cfg.row.split(' ').filter(c => c.startsWith('border-l')).join(' ') : ''}`}
                    >
                      {/* Rank */}
                      <td className="px-6 py-4">
                        <span className={`text-base tabular-nums ${cfg.rank}`}>
                          {cfg.medal ?? `#${entry.rank}`}
                        </span>
                      </td>

                      {/* Team */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{entry.teamName}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{entry.projectName}</p>
                      </td>

                      {/* Project (hidden on mobile — shown in team cell) */}
                      <td className="px-6 py-4 hidden sm:table-cell text-slate-300">
                        {entry.projectName}
                      </td>

                      {/* Score */}
                      <td className={`px-6 py-4 text-right font-bold tabular-nums ${cfg.score}`}>
                        {entry.averageScore.toFixed(2)}
                        <span className="text-xs font-normal text-slate-500"> / 70</span>
                      </td>

                      {/* Review count */}
                      <td className="px-6 py-4 text-right text-slate-500 hidden md:table-cell">
                        {entry.reviewCount} {entry.reviewCount === 1 ? 'review' : 'reviews'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
