import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  { icon: '🏆', label: 'Hackathons', desc: 'Browse & discover events', to: '/hackathons' },
  { icon: '👥', label: 'Teams', desc: 'Form & manage your crew', to: '/teams/create' },
  { icon: '📦', label: 'Submissions', desc: 'Submit & track projects', to: '/login' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center px-4">
      {/* Badge */}
      <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 ring-1 ring-purple-500/40">
        🚀 Hackathon Management Platform
      </span>

      {/* Heading */}
      <h1 className="text-center text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
        Welcome to{' '}
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          HeckNest
        </span>
      </h1>

      <p className="mt-5 max-w-xl text-center text-lg text-slate-400">
        Build teams, submit projects, and compete in world-class hackathons — all in one place.
      </p>

      {/* Feature cards — each is a real link */}
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {CARDS.map(({ icon, label, desc, to }) => (
          <Link
            key={label}
            to={to}
            className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm transition
              hover:border-purple-500/50 hover:bg-white/10 hover:-translate-y-0.5 duration-200"
          >
            <span className="text-3xl">{icon}</span>
            <h2 className="mt-3 text-base font-semibold text-white">{label}</h2>
            <p className="mt-1 text-sm text-slate-400">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Auth + nav */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <p className="text-sm text-slate-500">
          {user
            ? `Signed in as ${user.name} · ${user.role}`
            : 'Not signed in'}
        </p>
        {!user && (
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-purple-500/50 hover:text-white transition"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition"
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
