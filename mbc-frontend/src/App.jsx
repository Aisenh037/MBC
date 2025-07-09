import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import LoginPage from './features/auth/loginpage';
import AssignmentsPage from './features/assignments/AssignmentsPage';

import AdminDashboard from './features/dashboard/admin/AdminDashboard';
import StudentManagement from './features/dashboard/admin/StudentManagement';
import BranchManagement from './features/dashboard/admin/BranchManagement';
import ProfessorManagement from './features/dashboard/admin/ProfessorManagement';

import ProfessorDashboard from './features/dashboard/Professors/ProfessorDashboard';
import StudentDashboard from './features/dashboard/Students/StudentDashboard';

import Layout from './components/layout/layout'; //  Used only for professors/students/shared views
import BranchDashboard from './features/dashboard/admin/BranchDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*  Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 🛡 Admin Routes - No shared Layout */}
        <Route element={<RequireAuth allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/manage-branches" element={<BranchManagement />} />
          <Route path="/admin/manage-professors" element={<ProfessorManagement />} />
          <Route path="/admin/manage-students" element={<StudentManagement />} />
        </Route>

        {/* 🎓 Professor Routes - With Layout */}
        <Route element={<RequireAuth allowedRoles={['professor']} />}>
          <Route
            path="/professor/dashboard"
            element={
              <Layout>
                <ProfessorDashboard />
              </Layout>
            }
          />
        </Route>

        {/*  Student Routes - With Layout */}
        <Route element={<RequireAuth allowedRoles={['student']} />}>
          <Route
            path="/student/dashboard"
            element={
              <Layout>
                <StudentDashboard />
              </Layout>
            }
          />
        </Route>

        {/*  Shared Assignments Route - With Layout */}
        <Route element={<RequireAuth allowedRoles={['admin', 'student', 'professor']} />}>
          <Route
            path="/assignments"
            element={
              <Layout>
                <AssignmentsPage />
              </Layout>
            }
          />
        </Route>

        {/*  Fallback Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
