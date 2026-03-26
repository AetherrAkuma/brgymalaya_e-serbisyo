import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Later: Admin Collapsible Sidebar goes here */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {/* Later: Admin Top App Bar goes here */}
        <Outlet /> {/* The Admin Dashboard, Queue, or Audit Trail appears here */}
      </Box>
    </Box>
  );
}