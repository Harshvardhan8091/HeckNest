import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import HackathonListing from './pages/HackathonListing';
import HackathonDetails from './pages/HackathonDetails';
import Leaderboard      from './pages/Leaderboard';

// Participant pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Organizer pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateHackathon    from './pages/organizer/CreateHackathon';
import ManageHackathon   from './pages/organizer/ManageHackathon';

// Judge pages
import JudgeDashboard    from './pages/judge/JudgeDashboard';
import ReviewSubmission  from './pages/judge/ReviewSubmission';
import CreateTeam from './pages/participant/CreateTeam';
import TeamDetail from './pages/TeamDetail';
import SubmissionForm from './pages/SubmissionForm';

// Dashboard placeholders (will be replaced with real pages)
const DashboardPlaceholder = ({ role }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex flex-col items-center justify-center gap-4">
    <span className="rounded-full bg-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-300 ring-1 ring-purple-500/40">
      🚀 HeckNest
    </span>
    <h1 className="text-3xl font-bold text-white capitalize">{role} Dashboard</h1>
    <p className="text-slate-400 text-sm">Coming soon — your workspace will appear here.</p>
    <button
      onClick={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }}
      className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-purple-500/50 hover:text-white transition"
    >
      Sign out
    </button>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────────── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/hackathons" element={<HackathonListing />} />
          <Route path="/hackathons/:id" element={<HackathonDetails />} />
          <Route path="/hackathons/:id/leaderboard" element={<Leaderboard />} />

          {/* ── Admin ───────────────────────────────────────────────────── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Organizer ───────────────────────────────────────────────── */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute roles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/hackathons/create"
            element={
              <ProtectedRoute roles={['organizer']}>
                <CreateHackathon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/hackathons/:id"
            element={
              <ProtectedRoute roles={['organizer']}>
                <ManageHackathon />
              </ProtectedRoute>
            }
          />

          {/* ── Participant ────────────────────────────────────────────────── */}
          <Route
            path="/participant/dashboard"
            element={
              <ProtectedRoute roles={['participant']}>
                <ParticipantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/create"
            element={
              <ProtectedRoute roles={['participant']}>
                <CreateTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:id"
            element={
              <ProtectedRoute>
                <TeamDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions/create"
            element={
              <ProtectedRoute roles={['participant']}>
                <SubmissionForm />
              </ProtectedRoute>
            }
          />

          {/* ── Judge ───────────────────────────────────────────────── */}
          <Route
            path="/judge/dashboard"
            element={
              <ProtectedRoute roles={['judge']}>
                <JudgeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/judge/review/:submissionId"
            element={
              <ProtectedRoute roles={['judge']}>
                <ReviewSubmission />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all ───────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
