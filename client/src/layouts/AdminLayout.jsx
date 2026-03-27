import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Button, useTheme, useMediaQuery 
} from '@mui/material';

// Material UI Icons for Admins
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
// NEW: Import the Payments Icon
import PaymentsIcon from '@mui/icons-material/Payments';

const drawerWidth = 260;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const [mobileOpen, setMobileOpen] = useState(false);

  // Grab the official's specific role from local storage to display in the menu
  const userRole = localStorage.getItem('role') || 'Official';

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('first_name');
    navigate('/login');
  };

  // --- DYNAMIC NAVIGATION MENU ---
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    // Unified Master Queue for Verification and Payment
    { text: 'Requests & Collection', icon: <AssignmentIcon />, path: '/admin/requests' } 
  ];

  // Push the remaining global admin items
  menuItems.push(
    { text: 'Manage Residents', icon: <PeopleAltIcon />, path: '/admin/residents' },
    { text: 'Announcements', icon: <CampaignIcon />, path: '/admin/announcements' },
    { text: 'My Profile', icon: <AccountCircleIcon />, path: '/admin/profile' }
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1e1e2d', color: '#a2a3b7' }}>
      
      {/* Admin Branding Header */}
      <Toolbar sx={{ bgcolor: '#1b1b28', color: 'white', py: 2, display: 'flex', gap: 2 }}>
        <AdminPanelSettingsIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" color="white" lineHeight={1.2}>
            E-Serbisyo
          </Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {userRole} PORTAL
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      
      {/* Navigation Links */}
      <List sx={{ flexGrow: 1, pt: 3, px: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          
          // Add a special green color scheme if the tab is the Collection Desk
          const isFinancialTab = item.text === 'Collection Desk';

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive 
                    ? (isFinancialTab ? 'success.main' : 'primary.main') 
                    : 'transparent',
                  color: isActive ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: isActive 
                      ? (isFinancialTab ? 'success.main' : 'primary.main') 
                      : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' }
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? 'white' : 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout Button */}
      <Box sx={{ p: 2 }}>
        <Button 
          fullWidth 
          variant="contained" 
          color="error" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ py: 1.5, fontWeight: 'bold', bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#f44336', boxShadow: 'none', '&:hover': { bgcolor: '#d32f2f', color: 'white' } }}
        >
          System Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f8fa' }}>
      
      {/* Mobile Top App Bar */}
      <AppBar 
        position="fixed" 
        elevation={1}
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          display: { xs: 'block', md: 'none' },
          bgcolor: 'white',
          color: '#1e1e2d'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            Admin Portal
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: { xs: 7, md: 0 } }}>
        <Outlet /> 
      </Box>

    </Box>
  );
}