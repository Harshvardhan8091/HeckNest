import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

const ROLE_CLS = {
  admin:       'bg-red-500/10 text-red-400 border-red-500/20',
  organizer:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  participant: 'bg-elevated text-text-muted border-border',
  judge:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]         = useState(null);
  const [users, setUsers]         = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [actionError, setActionError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const roleQuery = roleFilter ? `?role=${roleFilter}` : '';
      const [statsRes, usersRes, hackathonsRes] = await Promise.all([
        api.get('/users/stats'),
        api.get(`/users${roleQuery}`),
        api.get('/hackathons'),
      ]);
      setStats(statsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setHackathons(Array.isArray(hackathonsRes.data) ? hackathonsRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleSignOut = () => { logout(); navigate('/login'); };

  const handleToggleBlock = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`)) return;
    setActionError('');
    try {
      await api.put(`/users/${userId}/block`);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to toggle block status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionError('');
    try {
      await api.delete(`/users/${userId}`);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleDeleteHackathon = async (hackathonId, title) => {
    if (!window.confirm(`Are you sure you want to delete hackathon "${title}"? This cannot be undone.`)) return;
    setActionError('');
    try {
      await api.delete(`/hackathons/${hackathonId}`);
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete hackathon.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-base">
      {/* Topbar */}
      <header className="sticky top-0 z-10 border-b border-border bg-base/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text-primary">HeckNest</span>
            <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-text-muted sm:block">{user?.name ?? user?.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Fetch error */}
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <span className="flex items-center gap-2"><span>⚠</span> {error}</span>
            <button
              onClick={fetchDashboardData}
              className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Action error banner */}
        {actionError && (
          <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            <span className="flex items-start gap-2"><span>⚠</span> {actionError}</span>
            <button onClick={() => setActionError('')} className="text-xs text-amber-400 hover:text-amber-200 transition-colors">✕</button>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-faint">Platform Overview</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Users',       value: stats.totalUsers,       color: 'text-text-primary' },
                { label: 'Total Hackathons',   value: stats.totalHackathons,  color: 'text-accent' },
                { label: 'Total Teams',        value: stats.totalTeams,       color: 'text-sky-400' },
                { label: 'Total Submissions',  value: stats.totalSubmissions, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs text-text-faint">{label}</p>
                  <p className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* User Management */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-faint">User Management</h2>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="organizer">Organizer</option>
              <option value="participant">Participant</option>
              <option value="judge">Judge</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-8 text-center text-xs text-text-faint">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-elevated transition-colors">
                      <td className="px-5 py-3.5 font-medium text-text-primary">{u.name}</td>
                      <td className="px-5 py-3.5 text-text-muted">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize ${ROLE_CLS[u.role] ?? 'bg-elevated text-text-faint border-border'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.isBlocked ? (
                          <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-400">Blocked</span>
                        ) : (
                          <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {u._id !== user._id && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors
                                ${u.isBlocked
                                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                  : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}
                            >
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Hackathon Management */}
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-faint">Hackathon Management</h2>
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-text-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Organizer</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {hackathons.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-xs text-text-faint">No hackathons found.</td>
                  </tr>
                ) : (
                  hackathons.map((h) => (
                    <tr key={h._id} className="hover:bg-elevated transition-colors">
                      <td className="px-5 py-3.5 font-medium text-text-primary">{h.title}</td>
                      <td className="px-5 py-3.5 text-text-muted">{h.organizer?.name || 'Unknown'}</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-xs text-text-faint capitalize">
                          {h.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteHackathon(h._id, h.title)}
                          className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
