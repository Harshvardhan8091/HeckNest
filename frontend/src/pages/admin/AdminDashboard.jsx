import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch Data ──────────────────────────────────────────────────────────────
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
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleToggleBlock = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unblock' : 'block'} this user?`)) return;
    try {
      await api.put(`/users/${userId}/block`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle block status.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleDeleteHackathon = async (hackathonId, title) => {
    if (!window.confirm(`Are you sure you want to delete hackathon "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/hackathons/${hackathonId}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete hackathon.');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-semibold text-red-300 ring-1 ring-red-500/40">
              🛡️ HeckNest Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:block">
              {user?.name ?? user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-red-500/40 hover:text-white transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        
        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* ── Stats Overview ───────────────────────────────────────────────── */}
        {stats && (
          <section>
            <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
              📊 Platform Overview
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-400">Total Users</p>
                <p className="mt-1 text-3xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-400">Total Hackathons</p>
                <p className="mt-1 text-3xl font-bold text-purple-300">{stats.totalHackathons}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-400">Total Teams</p>
                <p className="mt-1 text-3xl font-bold text-sky-300">{stats.totalTeams}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-sm font-medium text-slate-400">Total Submissions</p>
                <p className="mt-1 text-3xl font-bold text-emerald-300">{stats.totalSubmissions}</p>
              </div>
            </div>
          </section>
        )}

        {/* ── User Management ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              👥 User Management
            </h2>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500 transition"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="organizer">Organizer</option>
              <option value="participant">Participant</option>
              <option value="judge">Judge</option>
            </select>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isBlocked ? (
                          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs text-red-300 ring-1 ring-red-500/30">Blocked</span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 ring-1 ring-emerald-500/30">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        {u._id !== user._id && (
                          <>
                            <button
                              onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                              className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                                u.isBlocked 
                                  ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' 
                                  : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                              }`}
                            >
                              {u.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Hackathon Management ─────────────────────────────────────────── */}
        <section>
          <h2 className="mb-4 text-lg font-bold text-white flex items-center gap-2">
            🏆 Hackathon Management
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-white/5 text-xs uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Organizer</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {hackathons.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 italic">No hackathons found.</td>
                  </tr>
                ) : (
                  hackathons.map((h) => (
                    <tr key={h._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium text-white">{h.title}</td>
                      <td className="px-6 py-4">{h.organizer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize text-slate-300">
                          {h.status || 'draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteHackathon(h._id, h.title)}
                          className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 transition"
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
