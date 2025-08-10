import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";


import AdminDashboard from "./features/admin/dashboard/admin/AdminDashboard";
import AdminStudents from "./features/admin/dashboard/admin/StudentManagement";
import AdminTeachers from "./features/admin/dashboard/admin/ProfessorManagement";
import AdminBranches from "./features/admin/dashboard/admin/BranchManagement";
import AdminNotices from "./features/admin/dashboard/admin/NoticeManagement";


import TeacherDashboard from "./features/professors/dashboard/Professors/ProfessorDashboard";


import StudentDashboard from "./features/students/dashboard/Students/StudentDashboard";


import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/layout";
import ProtectedRoute from "./components/UI/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Shared Layout */}
        <Route element={<Layout />}>
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />}>
              <Route path="students" element={<AdminStudents />} />
              <Route path="teachers" element={<AdminTeachers />} />
              <Route path="branches" element={<AdminBranches />} />
              <Route path="notices" element={<AdminNotices />} />
            </Route>
          </Route>

          {/* Teacher Route */}
          <Route element={<ProtectedRoute allowedRoles={["professor"]} />}>
            <Route path="/teacher" element={<TeacherDashboard />} />
          </Route>

          {/* Student Route */}
          <Route element={<RequireAuth allowedRoles={["student"]} />}>
            <Route path="/student" element={<StudentDashboard />} />
          </Route>
        </Route>

        {/* Unauthorized and Not Found */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
