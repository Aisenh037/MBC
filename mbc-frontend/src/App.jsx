// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";

// Core Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

// Layouts & Protected Routes
import Layout from "./components/Layout/layout.jsx";
import ProtectedRoute from "./components/Layout/ProtectedRoute";
import AdminLayout from "./features/admin/AdminLayout"; // A new layout for the admin section

// Dashboard Pages
import AdminDashboard from "./features/admin/dashboard/admin/AdminDashboard";
import TeacherDashboard from "./features/professors/dashboard/Professors/ProfessorDashboard";
import StudentDashboard from "./features/students/dashboard/Students/StudentDashboard";

// Management Pages (Admin)
import StudentManagement from "./features/admin/dashboard/admin/StudentManagement";
import ProfessorManagement from "./features/admin/dashboard/admin/ProfessorManagement";
import BranchManagement from "./features/admin/dashboard/admin/BranchManagement";
import NoticeManagement from "./features/admin/dashboard/admin/NoticeManagement";

// A component to handle redirection after login
function DashboardRedirect() {
  const { user } = useAuthStore();
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (user?.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/" replace />; // Fallback if role is unknown or user is null
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Main App Layout */}
      <Route element={<Layout />}>
        {/* Generic Dashboard Redirect */}
        <Route element={<ProtectedRoute />}>
           <Route path="/dashboard" element={<DashboardRedirect />} />
        </Route>
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="teachers" element={<ProfessorManagement />} />
            <Route path="branches" element={<BranchManagement />} />
            <Route path="notices" element={<NoticeManagement />} />
          </Route>
        </Route>

        {/* Teacher Route */}
        <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Route>

        {/* Student Route */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
      </Route>

      {/* Catch-all 404 Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}