import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import { Button, Container, Typography, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';


// Simple Home Page Component
const Home = () => (
  <Container sx={{ mt: 10, textAlign: 'center' }}>
    <Typography variant="h3" gutterBottom>E-Serbisyo Portal</Typography>
    <Box>
      <Link to="/register" style={{ textDecoration: 'none' }}>
        <Button variant="contained" size="large">Register Resident</Button>
      </Link>
      <Link to="/login" style={{ textDecoration: 'none', marginLeft: '15px' }}>
        <Button variant="contained" startIcon={<SendIcon />} size="large">Login</Button>
      </Link>
    </Box>
  </Container>
);

// Placeholder Login Page
// const Login = () => (
//     <Container sx={{ mt: 10, textAlign: 'center' }}>
//         <Typography variant="h4">Login Page (Coming Soon)</Typography>
//     </Container>
// );

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;