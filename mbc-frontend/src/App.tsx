// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// LAZY-LOADED COMPONENTS
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/ResetPasswordPage'));
const AdminDashboard = lazy(() => import('./features/admin/pages/AdminDashboard'));
const StudentManagement = lazy(() => import('./features/admin/pages/StudentManagement'));
const ProfessorManagement = lazy(() => import('./features/admin/pages/ProfessorManagement'));
const BranchManagement = lazy(() => import('./features/admin/pages/BranchManagement'));

const CourseManagement = lazy(() => import('./features/admin/pages/CourseManagement'));
const AssignmentManagement = lazy(() => import('./features/admin/pages/AssignmentManagement'));
const AttendanceManagement = lazy(() => import('./features/admin/pages/AttendanceManagement'));
const NoticeManagement = lazy(() => import('./features/admin/pages/NoticeManagement'));
const DatasetAnalysis = lazy(() => import('./features/admin/pages/DatasetAnalysis'));
const ProfessorDashboard = lazy(() => import('./features/professors/dashboard/ProfessorDashboard'));
const StudentDashboard = lazy(() => import('./features/students/dashboard/StudentDashboard'));

const ProtectedRoute = lazy(() => import('./components/UI/ProtectedRoute'));
const LoadingSpinner = lazy(() => import('./components/UI/LoadingSpinner'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Helper component to redirect logged-in users
const HomeRedirector: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin': return <Navigate to="/admin" replace />;
    case 'professor': return <Navigate to="/professor/dashboard" replace />;
    case 'student': return <Navigate to="/student/dashboard" replace />;
    default: return <Navigate to="/unauthorized" replace />;
  }
};

const App: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage />}>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* This route handles what happens when a user visits the root URL */}
        <Route path="/" element={<ProtectedRoute><HomeRedirector /></ProtectedRoute>} />

        {/* ADMIN PROTECTED ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="professors" element={<ProfessorManagement />} />
            <Route path="branches" element={<BranchManagement />} />

            <Route path="courses" element={<CourseManagement />} />
            <Route path="assignments" element={<AssignmentManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="notices" element={<NoticeManagement />} />
            <Route path="dataset-analysis" element={<DatasetAnalysis />} />
          </Route>
        </Route>

        {/* PROFESSOR PROTECTED ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['professor']} />}>
          <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
        </Route>

        {/* STUDENT PROTECTED ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>

        {/* ERROR ROUTES */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default App;