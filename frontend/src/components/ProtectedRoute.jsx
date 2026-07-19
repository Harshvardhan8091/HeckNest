import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so only authenticated users (and optionally specific roles) can access it.
 *
 * Props:
 *  - children   : the page component to render
 *  - roles      : optional array of allowed roles, e.g. ['admin', 'organizer']
 *                 if omitted, any logged-in user is allowed
 *  - redirectTo : where to send unauthenticated users (defaults to /login)
 */
export default function ProtectedRoute({ children, roles, redirectTo = '/login' }) {
  const { user, loading } = useAuth();

  // While restoring session from localStorage, show nothing (avoids flash)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) return <Navigate to={redirectTo} replace />;

  // Logged in but wrong role → redirect to their own dashboard
  if (roles && !roles.includes(user.role)) {
    const ROLE_HOME = {
      admin: '/admin/dashboard',
      organizer: '/organizer/dashboard',
      participant: '/participant/dashboard',
      judge: '/judge/dashboard',
    };
    return <Navigate to={ROLE_HOME[user.role] ?? '/'} replace />;
  }

  return children;
}
