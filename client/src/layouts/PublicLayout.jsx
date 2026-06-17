import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import PublicNavbar from '../components/common/PublicNavBar';

export default function PublicLayout() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* The new Navigation Bar */}
      <PublicNavbar /> 
      
      {/* The main content (Home, Login, etc.) */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet /> 
      </Box>
    </Box>
  );
}