import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARD = {
  admin: '/admin/dashboard',
  organizer: '/organizer/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

const ROLE_LABEL = {
  admin: 'Admin',
  organizer: 'Organizer',
  participant: 'Participant',
  judge: 'Judge',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide full navbar on login and signup pages for a cleaner standalone card view
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const dashboardPath = user ? (ROLE_DASHBOARD[user.role] ?? '/') : '/';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#0A0E14]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        
        {/* Left Side: Brand & Main Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-base font-semibold tracking-tight text-text-primary hover:text-accent transition-colors">
            HeckNest
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            <Link
              to="/hackathons"
              className={`text-xs font-medium transition-colors ${
                location.pathname.startsWith('/hackathons')
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Hackathons
            </Link>

            {user && (
              <Link
                to={dashboardPath}
                className={`text-xs font-medium transition-colors ${
                  location.pathname.includes('/dashboard')
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {user.role === 'participant' && 'My Teams & Submissions'}
                {user.role === 'organizer' && 'Manage Hackathons'}
                {user.role === 'judge' && 'Assigned Reviews'}
                {user.role === 'admin' && 'Admin Console'}
              </Link>
            )}
          </nav>
        </div>

        {/* Right Side: Auth / Profile Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <span className="text-xs text-text-muted">{user.name}</span>
                <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-faint capitalize">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </div>

              <Link
                to={dashboardPath}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
              >
                Dashboard
              </Link>

              <button
                onClick={handleSignOut}
                className="rounded-lg bg-elevated border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-accent hover:bg-accent-hover px-3.5 py-1.5 text-xs font-medium text-white transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
