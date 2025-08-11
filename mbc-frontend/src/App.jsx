// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";

// Core Pages & Layouts
import LoginPage from "./pages/Login.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/layout/layout.jsx";
import AdminLayout from "./features/admin/AdminLayout.jsx";

// Admin Pages
import AdminDashboard from "./features/admin/pages/AdminDashboard.jsx";
import StudentManagement from "./features/admin/pages/StudentManagement.jsx";
import ProfessorManagement from "./features/admin/pages/ProfessorManagement.jsx";
import BranchManagement from "./features/admin/pages/BranchManagement.jsx";
import NoticeManagement from "./features/admin/pages/NoticeManagement.jsx";

// Teacher & Student Pages (can be uncommented when you build them)
// import TeacherDashboard from "./features/teachers/TeacherDashboard.jsx";
// import StudentDashboard from "./features/students/StudentDashboard.jsx";

/**
 * A small component to automatically redirect users to their correct
 * dashboard after they log in.
 */
function DashboardRedirect() {
  const { user } = useAuthStore();
  
  // Navigate based on the user's role
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  // if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  // if (user?.role === 'student') return <Navigate to="/student" replace />;
  
  // If the role is unknown or the user is not logged in, go back to the login page.
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ====================================================== */}
      {/* Public Routes (Accessible to everyone)                */}
      {/* ====================================================== */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ====================================================== */}
      {/* Protected Routes (Require user to be logged in)      */}
      {/* ====================================================== */}
      <Route element={<ProtectedRoute />}>
        {/* This route handles the main redirection after login */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        {/* Routes specifically for the 'admin' role */}
        <Route path="/admin/*" element={<AdminRoutes />} />
        
        {/* You can add routes for teachers and students here later */}
        {/* <Route path="/teacher/*" element={<TeacherRoutes />} /> */}
        {/* <Route path="/student/*" element={<StudentRoutes />} /> */}
      </Route>

      {/* This is a "catch-all" route for any URL that doesn't match */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/**
 * A dedicated component for all routes accessible by an admin.
 * This keeps the main App component cleaner.
 */
function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="teachers" element={<ProfessorManagement />} />
          <Route path="branches" element={<BranchManagement />} />
          <Route path="notices" element={<NoticeManagement />} />
        </Route>
      </Route>
    </Routes>
  );
}