import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import TutorDashboard from './pages/TutorDashboard.jsx';
import SuperTutorDashboard from './pages/SuperTutorDashboard.jsx';
import QuizTaking from './pages/QuizTaking.jsx';
import QuizDetail from './pages/QuizDetail.jsx';
import QuizResults from './pages/QuizResults.jsx';
import QuestionManagement from './pages/QuestionManagement.jsx';
import UserManagement from './pages/UserManagement.jsx';
import FeedbackManagement from './pages/FeedbackManagement.jsx';
import StudentProgress from './pages/StudentProgress.jsx';
import Loading from './components/Loading.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'student':
        return <Navigate to={`/student/${user.id}`} replace />;
      case 'tutor':
        return <Navigate to="/tutor" replace />;
      case 'super_tutor':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'student':
      return <Navigate to={`/student/${user.id}`} replace />;
    case 'tutor':
      return <Navigate to="/tutor" replace />;
    case 'super_tutor':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Unauthorized Page
const UnauthorizedPage = () => (
  <div className="container">
    <div className="main-content">
      <div className="card">
        <div className="card-body text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Dashboard Router */}
            <Route path="/" element={<DashboardRouter />} />

            {/* Student Routes */}
            <Route
              path="/student/:studentId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:studentId/quiz-detail/:categoryId/:difficultyId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:studentId/quiz/:categoryId/:difficultyId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QuizTaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/:studentId/quiz-results/:attemptId"
              element={
                <ProtectedRoute allowedRoles={['student', 'tutor', 'super_tutor']}>
                  <QuizResults />
                </ProtectedRoute>
              }
            />

            {/* Tutor Routes */}
            <Route
              path="/tutor"
              element={
                <ProtectedRoute allowedRoles={['tutor', 'super_tutor']}>
                  <TutorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questions"
              element={
                <ProtectedRoute allowedRoles={['tutor', 'super_tutor']}>
                  <QuestionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute allowedRoles={['tutor', 'super_tutor']}>
                  <FeedbackManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-progress/:studentId"
              element={
                <ProtectedRoute allowedRoles={['tutor', 'super_tutor']}>
                  <StudentProgress />
                </ProtectedRoute>
              }
            />

            {/* Super Tutor Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['super_tutor']}>
                  <SuperTutorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['super_tutor']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* Error Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="*"
              element={
                <div className="container">
                  <div className="main-content">
                    <div className="card">
                      <div className="card-body text-center">
                        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
                        <p className="text-gray-600 mb-6">
                          The page you're looking for doesn't exist.
                        </p>
                        <a href="/" className="btn btn-primary">
                          Go Home
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;