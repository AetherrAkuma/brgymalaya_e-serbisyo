import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, IconButton, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Button, useTheme, useMediaQuery 
} from '@mui/material';

// Material UI Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PaymentsIcon from '@mui/icons-material/Payments';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import HistoryIcon from '@mui/icons-material/History';
import GroupsIcon from '@mui/icons-material/Groups';
import BackupIcon from '@mui/icons-material/Backup';
import QrCodeIcon from '@mui/icons-material/QrCode';
import InputIcon from '@mui/icons-material/Input';
import ForcePasswordChange from '../pages/admin/ForcePasswordChange';

const drawerWidth = 260;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); 
  const [mobileOpen, setMobileOpen] = useState(false);

  const userRole = localStorage.getItem('role') || 'Official';
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('first_name');
    navigate('/login');
  };

  // --- DYNAMIC NAVIGATION LOGIC (GROUPED BY CATEGORY) ---
  const menuGroups = [
    {
      title: 'Operations',
      items: [
        { 
          text: 'Command Center', 
          icon: <DashboardIcon />, 
          path: '/admin/dashboard', 
          visible: true 
        },
        { 
          text: 'Master Queue', 
          icon: <AssignmentIcon />, 
          path: '/admin/requests', 
          visible: true 
        },
        { 
          text: 'Walk-In Desk', 
          icon: <InputIcon />, 
          path: '/admin/walkin', 
          visible: ['Super Admin', 'Captain', 'Secretary', 'Admin'].includes(userRole) 
        },
        { 
          text: 'Payments Desk', 
          icon: <PaymentsIcon />, 
          path: '/admin/payments', 
          visible: ['Super Admin', 'Treasurer', 'Captain'].includes(userRole) 
        },
        { 
          text: 'Verify QR Code', 
          icon: <QrCodeIcon />, 
          path: '/admin/verify', 
          visible: true 
        },
      ]
    },
    {
      title: 'Management',
      items: [
        { 
          text: 'Manage Residents', 
          icon: <PeopleAltIcon />, 
          path: '/admin/residents', 
          visible: ['Super Admin', 'Captain', 'Secretary', 'Admin'].includes(userRole) 
        },
        { 
          text: 'Broadcast Center', 
          icon: <CampaignIcon />, 
          path: '/admin/announcements', 
          visible: ['Super Admin', 'Captain', 'Secretary', 'Admin'].includes(userRole) 
        },
        { 
          text: 'Service Catalog', 
          icon: <FolderSpecialIcon />, 
          path: '/admin/documents', 
          visible: ['Super Admin', 'Admin', 'Secretary', 'Captain'].includes(userRole) 
        },
        { 
          text: 'Barangay Staff', 
          icon: <GroupsIcon />, 
          path: '/admin/officials', 
          visible: ['Super Admin', 'Captain'].includes(userRole) 
        },
      ]
    },
    {
      title: 'System & Security',
      items: [
        { 
          text: 'Forensic Logs', 
          icon: <HistoryIcon />, 
          path: '/admin/audit', 
          visible: ['Super Admin', 'Captain'].includes(userRole) 
        },
        { 
          text: 'Database Backups', 
          icon: <BackupIcon />, 
          path: '/admin/backups', 
          visible: ['Super Admin', 'Captain'].includes(userRole) 
        },
        { 
          text: 'System Settings', 
          icon: <AdminPanelSettingsIcon />, 
          path: '/admin/settings', 
          visible: ['Super Admin', 'Captain'].includes(userRole) 
        },
      ]
    },
    {
      title: 'Account',
      items: [
        { 
          text: 'My Account', 
          icon: <AccountCircleIcon />, 
          path: '/admin/profile', 
          visible: true 
        },
      ]
    }
  ];

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0f172a', color: '#94a3b8' }}>
      <Toolbar sx={{ bgcolor: '#1e293b', color: 'white', py: 3, display: 'flex', gap: 2 }}>
        <AdminPanelSettingsIcon color="primary" fontSize="large" />
        <Box>
          <Typography variant="subtitle1" fontWeight="900" color="white" lineHeight={1.2}>E-Serbisyo</Typography>
          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {userRole} PORTAL
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
      
      <List sx={{ flexGrow: 1, pt: 2, px: 2, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.3) transparent', '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.3)', borderRadius: '4px', '&:hover': { background: 'rgba(148,163,184,0.5)' } } }}>
        {menuGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.visible);
          if (visibleItems.length === 0) return null;
          
          return (
            <Box key={group.title} sx={{ mb: 2.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 2, 
                  color: 'rgba(255,255,255,0.3)', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em',
                  display: 'block',
                  mb: 1
                }}
              >
                {group.title}
              </Typography>
              {visibleItems.map((item) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton 
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) setMobileOpen(false);
                      }}
                      sx={{
                        borderRadius: 2,
                        bgcolor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        color: isActive ? 'white' : 'inherit',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.03)',
                          color: 'white',
                          '& .MuiListItemIcon-root': { color: 'white' }
                        },
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.text} 
                        primaryTypographyProps={{ 
                          fontWeight: isActive ? 'bold' : '500', 
                          fontSize: '0.85rem' 
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </Box>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Button 
          fullWidth variant="contained" color="error" startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            py: 1.2, 
            fontWeight: 'bold', 
            bgcolor: 'rgba(239, 68, 68, 0.1)', 
            color: '#f87171', 
            boxShadow: 'none', 
            '&:hover': { bgcolor: '#ef4444', color: 'white' } 
          }}
        >
          Logout Session
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <ForcePasswordChange />
      <AppBar 
        position="fixed" elevation={0}
        sx={{ 
          width: { md: `calc(100% - ${drawerWidth}px)` }, 
          ml: { md: `${drawerWidth}px` },
          display: { xs: 'block', md: 'none' },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          color: '#1e293b', 
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 52, sm: 64 } }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1.5 }}><MenuIcon /></IconButton>
          <Typography variant="h6" noWrap fontWeight="900" sx={{ letterSpacing: '-0.02em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Admin Portal</Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
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

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, width: { md: `calc(100% - ${drawerWidth}px)` }, mt: { xs: 7, md: 0 } }}>
        <Outlet /> 
      </Box>
    </Box>
    
  );
}