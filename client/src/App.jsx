import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import our Layouts
import PublicLayout from './layouts/PublicLayout';
import ResidentLayout from './layouts/ResidentLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/public/Login';
import Home from './pages/public/Home';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import ResidentDashboard from './pages/resident/Dashboard';
import RequestWizard from './pages/resident/RequestWizard';
import MyRequests from './pages/resident/MyRequests';
import Profile from './pages/resident/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import RequestsQueue from './pages/admin/RequestsQueue';
import PaymentsQueue from './pages/admin/PaymentsQueue';
import ManageResidents from './pages/admin/ManageResidents';
import Announcements from './pages/admin/ManageAnnouncements';
import MyProfile from './pages/admin/MyProfile';
import ManageDocuments from './pages/admin/ManageDocuments';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';
import ManageOfficials from './pages/admin/ManageOfficials';
import AuditLogs from './pages/admin/AuditLogs';
import SystemSettings from './pages/admin/SystemSettings';
import BackupManagement from './pages/admin/BackupManagement';

import VerifyQR from './pages/public/VerifyQR';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* ============================== */}
        {/* 1. PUBLIC ROUTES               */}
        {/* ============================== */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="verify/:hash?" element={<VerifyQR />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        {/* ============================== */}
        {/* 2. RESIDENT PROTECTED ROUTES   */}
        {/* ============================== */}
        <Route path="/resident" element={<ResidentLayout />}>
          {/* Automatically redirect /resident to /resident/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ResidentDashboard />} />
          <Route path="wizard" element={<RequestWizard />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* ============================== */}
        {/* 3. ADMIN PROTECTED ROUTES      */}
        {/* ============================== */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="requests" element={<RequestsQueue />} />
        <Route path="residents" element={<ManageResidents />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<MyProfile />} />
        <Route path="payments" element={<PaymentsQueue />} />  
        <Route path="documents" element={<ManageDocuments />} />   
        <Route path="superadmin" element={<SuperAdminDashboard />} /> 
        <Route path="officials" element={<ManageOfficials />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="backups" element={<BackupManagement />} />
      </Route>

        {/* Catch-All 404 Route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
    </BrowserRouter>
  );
}