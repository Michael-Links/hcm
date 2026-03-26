import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';
import AppShell from './layout/AppShell';
import Dashboard from './pages/Dashboard';
import OrgHierarchy from './pages/OrgHierarchy';
import OnboardWizard from './pages/OnboardWizard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import MyProfile from './pages/MyProfile';
import MyTeam from './pages/MyTeam';
import NotFound from './pages/NotFound';
import UserManagement from './pages/UserManagement';
import AuditLog from './pages/AuditLog';
import Directory from './pages/Directory';
import MyLeave from './pages/MyLeave';
import TeamLeave from './pages/TeamLeave';
import LeaveManagement from './pages/LeaveManagement';

function RoleHome() {
  const { role } = useAuth();
  if (role === 'HR') return <Dashboard />;
  if (role === 'MANAGER') return <Navigate to="/team" replace />;
  return <Navigate to="/profile" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<RoleHome />} />
        <Route path="org" element={<ProtectedRoute roles={['HR']}><OrgHierarchy /></ProtectedRoute>} />
        <Route path="onboard" element={<ProtectedRoute roles={['HR']}><OnboardWizard /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute roles={['HR']}><Employees /></ProtectedRoute>} />
        <Route path="employees/:id" element={<ProtectedRoute roles={['HR', 'MANAGER']}><EmployeeDetail /></ProtectedRoute>} />
        <Route path="users" element={<ProtectedRoute roles={['HR']}><UserManagement /></ProtectedRoute>} />
        <Route path="audit" element={<ProtectedRoute roles={['HR']}><AuditLog /></ProtectedRoute>} />
        <Route path="directory" element={<Directory />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="team" element={<ProtectedRoute roles={['MANAGER']}><MyTeam /></ProtectedRoute>} />
        <Route path="leave" element={<MyLeave />} />
        <Route path="team/leave" element={<ProtectedRoute roles={['MANAGER']}><TeamLeave /></ProtectedRoute>} />
        <Route path="leave-admin" element={<ProtectedRoute roles={['HR']}><LeaveManagement /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
