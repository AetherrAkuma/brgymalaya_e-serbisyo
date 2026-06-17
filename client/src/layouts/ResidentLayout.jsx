import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Button, useTheme, useMediaQuery 
} from '@mui/material';

// Material UI Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 260;

export default function ResidentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  // Checks if the screen size is mobile/tablet
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    // 1. Destroy the security token
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    // 2. Kick the user back to the public login screen
    navigate('/login');
  };

  // Define the navigation menu items
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/resident/dashboard' },
    { text: 'My Requests', icon: <FolderIcon />, path: '/resident/requests' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/resident/profile' },
  ];

  // The actual visual sidebar component
  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sidebar Header / Logo Area */}
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white', py: 2 }}>
        <Box sx={{ width: 40, height: 40, bgcolor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
           <Typography variant="caption" color="primary.main" fontWeight="bold">LOGO</Typography>
        </Box>
        <Typography variant="h6" fontWeight="bold">
          E-Serbisyo
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Navigation Links */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false); // Auto-close on mobile
                }}
                sx={{
                  mx: 2,
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.light' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'rgba(0,0,0,0.04)',
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

      {/* Logout Button locked to the bottom */}
      <Box sx={{ p: 2 }}>
        <Button 
          fullWidth 
          variant="outlined" 
          color="error" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ py: 1.5, fontWeight: 'bold' }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* TOP APP BAR (Only visible on Mobile to show the hamburger menu) */}
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          display: { xs: 'block', md: 'none' }, // Hide on desktop
          bgcolor: 'white',
          color: 'primary.main'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" fontWeight="bold">
            Barangay Malaya
          </Typography>
        </Toolbar>
      </AppBar>

      {/* THE SIDEBAR (DRAWER) */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // Better mobile performance
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none', boxShadow: '4px 0 10px rgba(0,0,0,0.05)' } }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT AREA (Where the specific pages load) */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: { xs: 7, md: 0 } }}>
        <Outlet /> 
      </Box>

    </Box>
  );
}