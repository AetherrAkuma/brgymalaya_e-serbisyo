import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import { Button, Container, Typography, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ResidentLayout from './layouts/ResidentLayout'; // Import Layout
import ResidentDashboard from './pages/ResidentDashboard'; // Import Dashboard
import ProtectedRoute from './components/ProtectedRoute'; // Import Security

// Simple Home Page Component
const Home = () => (
  <Container sx={{ mt: 10, textAlign: 'center' }}>
    <Typography variant="h3" gutterBottom>E-Serbisyo Portal</Typography>
    <Box>
      <Link to="/login" style={{ textDecoration: 'none', marginRight: '10px' }}>
        <Button variant="contained" size="large">Login</Button>
      </Link>
      <Link to="/register" style={{ textDecoration: 'none' }}>
        <Button variant="outlined" size="large">Register</Button>
      </Link>
    </Box>
  </Container>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Resident Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <ResidentLayout />
          </ProtectedRoute>
        }>
          {/* Index matches "/dashboard" */}
          <Route index element={<ResidentDashboard />} /> 
          
          {/* We will add these pages next */}
          <Route path="request" element={<div>Request Form Coming Soon</div>} />
          <Route path="history" element={<div>History Coming Soon</div>} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;