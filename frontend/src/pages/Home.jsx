import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CARDS = [
  { label: 'Hackathons',   desc: 'Browse & discover events',     to: '/hackathons' },
  { label: 'Teams',        desc: 'Form & manage your crew',       to: '/teams/create' },
  { label: 'Submissions',  desc: 'Submit & track projects',       to: '/login' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">

      {/* Subtle radial glow — purely decorative accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 w-full max-w-3xl text-center">

        {/* Wordmark */}
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-faint">HeckNest</p>

        {/* Hero heading */}
        <h1 className="text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          Build. Compete. Ship.
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-base text-text-muted">
          Manage hackathons, form teams, submit projects, and compete — all in one place.
        </p>

        {/* Feature cards */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CARDS.map(({ label, desc, to }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-border-strong hover:bg-elevated"
            >
              <p className="text-sm font-medium text-text-primary">{label}</p>
              <p className="mt-1 text-xs text-text-muted">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Auth CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          {user ? (
            <p className="text-sm text-text-muted">
              Signed in as <span className="text-text-primary font-medium">{user.name}</span>
              <span className="mx-1.5 text-text-faint">·</span>
              <span className="capitalize text-text-faint">{user.role}</span>
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text-primary"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-accent hover:bg-accent-hover px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
