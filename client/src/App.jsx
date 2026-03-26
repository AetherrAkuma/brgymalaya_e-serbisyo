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

// --- TEMPORARY PLACEHOLDER PAGES ---
// We will replace these with real, styled components in the next steps
const VerifyQR = () => <h1>QR Document Verification Scanner</h1>;
const ResidentRequests = () => <h1>My Document Requests</h1>;

const AdminDashboard = () => <h1>Admin Operational Dashboard</h1>;
const AdminQueue = () => <h1>Document Requests Queue</h1>;

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
          {/* Automatically redirect /admin to /admin/dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="queue" element={<AdminQueue />} />
        </Route>

        {/* Catch-All 404 Route */}
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
    </BrowserRouter>
  );
}