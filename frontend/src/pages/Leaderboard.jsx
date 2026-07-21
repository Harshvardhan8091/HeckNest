import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// ── Rank medal config ─────────────────────────────────────────────────────────
const RANK_CONFIG = {
  1: {
    medal:     '🥇',
    podiumCls: 'border-b-2 border-amber-400/60',
    rankCls:   'text-amber-400 font-semibold',
    scoreCls:  'text-amber-400',
  },
  2: {
    medal:     '🥈',
    podiumCls: 'border-b-2 border-[#8B92A5]/40',
    rankCls:   'text-text-muted font-semibold',
    scoreCls:  'text-text-muted',
  },
  3: {
    medal:     '🥉',
    podiumCls: 'border-b-2 border-orange-500/40',
    rankCls:   'text-orange-400 font-semibold',
    scoreCls:  'text-orange-400',
  },
};

function getRankConfig(rank) {
  return RANK_CONFIG[rank] ?? {
    medal:     null,
    podiumCls: '',
    rankCls:   'text-text-faint',
    scoreCls:  'text-text-muted',
  };
}

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
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-base/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to={`/hackathons/${id}`} className="text-sm text-text-muted hover:text-text-primary transition-colors">
            ← Back to hackathon
          </Link>
          <Link to="/" className="text-sm font-semibold text-text-primary">HeckNest</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-text-faint">Leaderboard</p>
          <h1 className="text-2xl font-semibold text-text-primary">{hackathonName}</h1>
          {!error && entries.length > 0 && (
            <p className="mt-1 text-sm text-text-muted">
              {entries.length} team{entries.length !== 1 ? 's' : ''} ranked
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="shrink-0">⚠</span><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm font-medium text-text-muted">No results yet</p>
            <p className="mt-1 text-xs text-text-faint">Check back after judging is complete.</p>
          </div>
        )}

        {/* Leaderboard */}
        {!error && entries.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">

            {/* Top-3 podium strip */}
            {entries.length >= 1 && (
              <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {entries.slice(0, Math.min(3, entries.length)).map((entry) => {
                  const cfg = getRankConfig(entry.rank);
                  return (
                    <div key={entry.submissionId}
                      className={`flex flex-col items-center gap-1 px-5 py-6 ${cfg.podiumCls}`}>
                      <span className="text-2xl">{cfg.medal}</span>
                      <p className="mt-1 text-xs uppercase tracking-wider text-text-faint">Rank {entry.rank}</p>
                      <p className="text-sm font-semibold text-text-primary text-center leading-tight">{entry.teamName}</p>
                      <p className="text-xs text-text-muted text-center truncate w-full px-2">{entry.projectName}</p>
                      <p className={`mt-2 text-lg font-semibold tabular-nums ${cfg.scoreCls}`}>
                        {entry.averageScore.toFixed(2)}
                        <span className="text-xs font-normal text-text-faint"> / 70</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full ranked table */}
            <div className="border-t border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-elevated text-xs uppercase tracking-wide text-text-faint">
                  <tr>
                    <th className="px-5 py-3 w-16">Rank</th>
                    <th className="px-5 py-3">Team</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Project</th>
                    <th className="px-5 py-3 text-right">Avg Score</th>
                    <th className="px-5 py-3 text-right hidden md:table-cell">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => {
                    const cfg = getRankConfig(entry.rank);
                    return (
                      <tr
                        key={entry.submissionId}
                        className="hover:bg-elevated transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className={`tabular-nums text-sm ${cfg.rankCls}`}>
                            {cfg.medal ?? `#${entry.rank}`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-text-primary">{entry.teamName}</p>
                          <p className="text-xs text-text-faint sm:hidden">{entry.projectName}</p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell text-text-muted text-sm">
                          {entry.projectName}
                        </td>
                        <td className={`px-5 py-3.5 text-right font-semibold tabular-nums ${cfg.scoreCls}`}>
                          {entry.averageScore.toFixed(2)}
                          <span className="text-xs font-normal text-text-faint"> / 70</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-text-faint hidden md:table-cell">
                          {entry.reviewCount} {entry.reviewCount === 1 ? 'review' : 'reviews'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
