import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentLayout from './layouts/ResidentLayout';
import PublicLayout from './layouts/PublicLayout';
import ResidentDashboard from './pages/ResidentDashboard';
import RequestDocument from './pages/RequestDocument';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import TransactionHistory from './pages/TransactionHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminRequest from './pages/admin/AdminRequest';
import Announcements from './pages/Announcements';
import DocumentTypes from './pages/DocumentTypes';
import QRVerification from './pages/QRVerification';
import AdminDocumentTypes from './pages/admin/AdminDocumentTypes';
import AdminPayments from './pages/admin/AdminPayments';

// Admin Route Wrapper Component
const AdminRouteWrapper = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  
  if (!['Super Admin', 'Secretary', 'Treasurer', 'Captain'].includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        
        {/* === PUBLIC LAYOUT (Home, Login, Register) === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/document-types" element={<DocumentTypes />} />
          <Route path="/verify/:qrHash" element={<QRVerification />} />
        </Route>

        {/* === PRIVATE RESIDENT LAYOUT === */}
        <Route element={
          <ProtectedRoute>
            <ResidentLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<ResidentDashboard />} />
          <Route path="/request" element={<RequestDocument />} />
          <Route path="/history" element={<TransactionHistory />} />
        </Route>

        {/* === ADMIN PORTAL === */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route element={<AdminRouteWrapper />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="requests" element={<AdminRequest />} />
            <Route path="document-types" element={<AdminDocumentTypes />} />
            <Route path="payments" element={<AdminPayments />} />
          </Route>
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
