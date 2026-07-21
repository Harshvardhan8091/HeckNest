import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARD = {
  admin: '/admin/dashboard',
  organizer: '/organizer/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

export default function Home() {
  const { user } = useAuth();
  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? '/') : '/';

  const CARDS = [
    {
      title: 'Hackathons',
      desc: 'Browse upcoming events, rules, deadlines, and prize pools.',
      to: '/hackathons',
    },
    {
      title: 'Teams',
      desc: 'Form teams with teammates and join competitions together.',
      to: user?.role === 'participant' ? '/teams/create' : '/hackathons',
    },
    {
      title: 'Submissions',
      desc: 'Submit repos, live demos, and presentation slides for review.',
      to: user ? dashboardPath : '/login',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-57px)] bg-base flex flex-col items-center justify-center px-4 py-16">
      
      {/* Subtle radial glow accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 10%, rgba(59,130,246,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-3xl text-center">
        
        {/* Wordmark pill */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-widest text-text-faint">
          <span>⚡ HeckNest Platform</span>
        </div>

        {/* Hero heading */}
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-5xl">
          Build teams, submit projects, and compete in world-class hackathons.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm text-text-muted sm:text-base leading-relaxed">
          The complete platform for hackathon organizers, participants, and judges. Seamlessly manage registrations, team building, submissions, and evaluations in one sleek workspace.
        </p>

        {/* Hero CTA buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Link
              to={dashboardPath}
              className="rounded-lg bg-accent hover:bg-accent-hover px-5 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <Link
              to="/signup"
              className="rounded-lg bg-accent hover:bg-accent-hover px-5 py-2.5 text-sm font-medium text-white transition-colors"
            >
              Get Started →
            </Link>
          )}

          <Link
            to="/hackathons"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
          >
            Browse Hackathons
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CARDS.map(({ title, desc, to }) => (
            <Link
              key={title}
              to={to}
              className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-border-strong hover:bg-elevated"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
                  {title}
                </p>
                <p className="mt-1.5 text-xs text-text-muted leading-relaxed">
                  {desc}
                </p>
              </div>
              <span className="mt-4 text-xs font-medium text-text-faint group-hover:text-accent transition-colors">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
