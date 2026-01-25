import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
          
          {/* Now these paths are at the "Root" level but still have the Sidebar */}
          <Route path="/dashboard" element={<ResidentDashboard />} />
          <Route path="/request" element={<RequestDocument />} />
          <Route path="/history" element={<TransactionHistory />} /> 

        </Route>

        {/* === ADMIN LOGIN ROUTE === */}
        {/* === ADMIN PORTAL (Protected by Layout) === */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="requests" element={<div>Request Queue (Coming Soon)</div>} />
            <Route path="residents" element={<div>Resident DB (Coming Soon)</div>} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="requests" element={<div>Request Queue (Coming Soon)</div>} />
            <Route path="residents" element={<div>Resident Database (Coming Soon)</div>} />
            <Route path="announcements" element={<div>Manage Announcements (Coming Soon)</div>} /> {/* <--- ADDED */}
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;