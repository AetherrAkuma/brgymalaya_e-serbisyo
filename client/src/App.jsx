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



      </Routes>
    </BrowserRouter>
  );
}

export default App;