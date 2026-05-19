import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuthCheck } from './hooks/useAuthCheck';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminPage from './pages/admin/AdminPage';
import AdminLayout from './pages/admin/AdminLayout';
import UsersPage from './pages/admin/UsersPage';
import ExercisesPage from './pages/admin/ExercisesPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import ProfilePage from './pages/profile/ProfilePage';
import ProfileSetupPage from './pages/profile/ProfileSetupPage';
import WorkoutPlanPage from './pages/workout/WorkoutPlanPage';
import WorkoutDayPage from './pages/workout/WorkoutDayPage';
import ProgressDashboard from './pages/progress/ProgressDashboard';

export default function App() {
  useAuthCheck();

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<LandingPage />} />

        {/* Profile routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />

        {/* Workout routes (User only) */}
        <Route
          path="/workout"
          element={
            <RoleRoute requiredRole="User">
              <WorkoutPlanPage />
            </RoleRoute>
          }
        />
        <Route
          path="/workout/day/:weekNumber/:dayNumber"
          element={
            <RoleRoute requiredRole="User">
              <WorkoutDayPage />
            </RoleRoute>
          }
        />

        {/* Progress routes (User only) */}
        <Route
          path="/progress"
          element={
            <RoleRoute requiredRole="User">
              <ProgressDashboard />
            </RoleRoute>
          }
        />

        {/* Role-based routes (Admin only) */}
        <Route
          element={
            <RoleRoute requiredRole="Admin">
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/exercises" element={<ExercisesPage />} />
        </Route>

        {/* Error pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
