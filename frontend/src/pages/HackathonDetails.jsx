import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

const STATUS_COLOR = {
  upcoming: 'text-sky-300 bg-sky-500/15 ring-sky-500/30',
  ongoing: 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30',
  completed: 'text-slate-400 bg-slate-500/15 ring-slate-500/30',
};

const MODE_COLOR = {
  online: 'text-violet-300 bg-violet-500/15 ring-violet-500/30',
  offline: 'text-amber-300 bg-amber-500/15 ring-amber-500/30',
};

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-lg leading-none">{icon}</span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm text-slate-200">{value}</p>
      </div>
    </div>
  );
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HackathonDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/hackathons/${id}`);
        setHackathon(data);
      } catch (err) {
        setError(err.response?.data?.message ?? 'Failed to load hackathon.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-5xl">😕</span>
        <h1 className="text-2xl font-bold text-white">Hackathon Not Found</h1>
        <p className="text-sm text-slate-400">{error}</p>
        <Link
          to="/hackathons"
          className="mt-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-purple-500/50 hover:text-white transition"
        >
          ← Back to listings
        </Link>
      </div>
    );
  }

  const h = hackathon;
  const isParticipant = user?.role === 'participant';
  const isLoggedIn = !!user;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-12">
      <div className="mx-auto max-w-4xl">

        {/* Back link */}
        <Link
          to="/hackathons"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-purple-300 transition"
        >
          ← All hackathons
        </Link>

        {/* Hero card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">

          {/* Top badges */}
          <div className="mb-5 flex flex-wrap gap-2">
            {h.status && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 capitalize ${STATUS_COLOR[h.status] ?? ''}`}>
                {h.status}
              </span>
            )}
            {h.mode && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 capitalize ${MODE_COLOR[h.mode] ?? ''}`}>
                {h.mode === 'online' ? '🌐' : '📍'} {h.mode}
              </span>
            )}
            {h.theme && (
              <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/30">
                #{h.theme}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{h.title}</h1>

          {/* Organizer */}
          {h.organizer && (
            <p className="mt-2 text-sm text-slate-400">
              Organised by{' '}
              <span className="font-medium text-purple-300">{h.organizer.name}</span>
            </p>
          )}

          {/* Description */}
          {h.description && (
            <p className="mt-6 leading-relaxed text-slate-300">{h.description}</p>
          )}

          {/* Key details grid */}
          <div className="mt-8 grid gap-4 rounded-xl border border-white/8 bg-white/3 p-6 sm:grid-cols-2">
            <DetailRow icon="📅" label="Start Date" value={fmt(h.startDate)} />
            <DetailRow icon="🏁" label="End Date" value={fmt(h.endDate)} />
            <DetailRow icon="⏰" label="Registration Deadline" value={fmt(h.registrationDeadline)} />
            <DetailRow icon="👥" label="Max Team Size" value={h.maxTeamSize ? `${h.maxTeamSize} members` : null} />
            <DetailRow icon="📍" label="Venue" value={h.venue} />
            <DetailRow icon="🏆" label="Prize Pool" value={h.prizePool} />
          </div>

          {/* Rules */}
          {h.rules && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">📋 Rules</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{h.rules}</p>
            </div>
          )}

          {/* Judging criteria */}
          {h.judgingCriteria && h.judgingCriteria.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">⚖️ Judging Criteria</h2>
              <ul className="space-y-2">
                {h.judgingCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-purple-400">▸</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 border-t border-white/10 pt-8 flex flex-wrap items-center gap-3">
            {isParticipant ? (
              <Link
                to={`/teams/create?hackathonId=${h._id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg
                  hover:from-purple-500 hover:to-pink-500 transition active:scale-95"
              >
                👥 Register / Create Team
              </Link>
            ) : !isLoggedIn ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-purple-500/50 bg-purple-500/10 px-6 py-3 text-sm font-semibold text-purple-300
                  hover:bg-purple-500/20 transition active:scale-95"
              >
                🔐 Login to Register
              </Link>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Registration is available for participants.
              </p>
            )}

            {/* Leaderboard link — always visible */}
            <Link
              to={`/hackathons/${h._id}/leaderboard`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300
                hover:border-purple-500/40 hover:text-white transition active:scale-95"
            >
              🏆 View Leaderboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
