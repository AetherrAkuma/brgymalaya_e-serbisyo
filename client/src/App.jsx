import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentLayout from './layouts/ResidentLayout';
import PublicLayout from './layouts/PublicLayout'; // Import New Layout
import ResidentDashboard from './pages/ResidentDashboard';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

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
        {/* Note: We added "/dashboard" as the parent path to keep URLs clean */}
        <Route path="/dashboard" element={
            <ProtectedRoute>
              <ResidentLayout />
            </ProtectedRoute>
        }>
          
          {/* Default view when going to /dashboard */}
          <Route index element={<ResidentDashboard />} />
          
          <Route path="request" element={<div>Request Form</div>} />
          <Route path="history" element={<div>History</div>} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;