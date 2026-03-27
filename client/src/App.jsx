import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import our Layouts
import PublicLayout from './layouts/PublicLayout';
import ResidentLayout from './layouts/ResidentLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/public/Login';
import Home from './pages/public/Home';
import ResidentDashboard from './pages/resident/Dashboard';
import RequestWizard from './pages/resident/RequestWizard';
import MyRequests from './pages/resident/MyRequests';
import Profile from './pages/resident/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import RequestsQueue from './pages/admin/RequestsQueue';
import PaymentsQueue from './pages/admin/PaymentsQueue';
import ManageResidents from './pages/admin/ManageResidents';
import Announcements from './pages/admin/ManageAnnouncements';

// --- TEMPORARY PLACEHOLDER PAGES ---
// We will replace these with real, styled components in the next steps
const VerifyQR = () => <h1>QR Document Verification Scanner</h1>;


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
          <Route path="verify" element={<VerifyQR />} />
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
        <Route path="profile" element={<h1>Admin Profile Placeholder</h1>} />
        <Route path="payments" element={<PaymentsQueue />} />      
      </Route>

        {/* Catch-All 404 Route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
    </BrowserRouter>
  );
}