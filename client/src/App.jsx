import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentLayout from './layouts/ResidentLayout'; // Sidebar Layout
import PublicLayout from './layouts/PublicLayout'; // Navbar Layout
import ResidentDashboard from './pages/ResidentDashboard';
import RequestDocument from './pages/RequestDocument';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import TransactionHistory from './pages/TransactionHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === PUBLIC LAYOUT (Home, Login, Register) === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* === PRIVATE RESIDENT LAYOUT (Sidebar Enabled) === */}
        {/* WE REMOVED path="/dashboard" here to make sub-routes simpler */}
        <Route element={
            <ProtectedRoute>
              <ResidentLayout />
            </ProtectedRoute>
        }>
          {/* <Route path="/admin" element={<Navigate to="/admin/login" replace />} /> */}
          <Route element={<ProtectedAdminRoute />}>
          {/* Now these paths are at the "Root" level but still have the Sidebar */}
          <Route path="/dashboard" element={<ResidentDashboard />} />
          <Route path="/request" element={<RequestDocument />} />
          <Route path="/history" element={<TransactionHistory />} /> 
          </Route>

        </Route>

        {/* =========================================================
          ADMIN PORTAL SECURITY ZONE
      ========================================================= */}

      {/* 1. PUBLIC: The Login Door (Must be OUTSIDE the guard) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 2. PROTECTED: Everything inside this wrapper requires a Token */}
      <Route element={<ProtectedAdminRoute />}>

          {/* All these paths are checked by the Bouncer */}
          <Route path="/admin" element={<AdminLayout />}>

              {/* Redirect /admin to /admin/login */}
              <Route index element={<Navigate to="/admin/login" replace />} />

              <Route path="dashboard" element={<AdminDashboard />} />

              {/* Placeholders */}
              <Route path="residents" element={<div>Residents DB</div>} />
              <Route path="announcements" element={<div>Announcements</div>} />
          </Route>

      </Route>
      {/* ========================================================= */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;