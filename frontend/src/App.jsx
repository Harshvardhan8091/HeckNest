import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

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

// Dashboard placeholders (fallback placeholder)
const DashboardPlaceholder = ({ role }) => (
  <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-4 px-4 text-center">
    <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">HeckNest</p>
    <h1 className="text-2xl font-semibold text-text-primary capitalize">{role} Dashboard</h1>
    <p className="text-text-muted text-sm">Coming soon — your workspace will appear here.</p>
    <button
      onClick={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }}
      className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
    >
      Sign out
    </button>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
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
