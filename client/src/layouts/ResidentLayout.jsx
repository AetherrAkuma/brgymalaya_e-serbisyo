import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
    ListItem, ListItemButton, ListItemIcon, ListItemText, 
    IconButton, Avatar, Menu, MenuItem 
} from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    Description as DescriptionIcon, 
    History as HistoryIcon,
    Menu as MenuIcon,
    Logout as LogoutIcon
} from '@mui/icons-material';

const drawerWidth = 240;

const ResidentLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [anchorEl, setAnchorEl] = useState(null);
    
    // Get user data from local storage (saved during login)
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

const menuItems = [
        { text: 'Home', icon: <DashboardIcon />, path: '/' }, // Public Home
        
        // Show these only if logged in
        ...(user ? [
            { text: 'My Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
            { text: 'Request Document', icon: <DescriptionIcon />, path: '/request' },
            { text: 'My Transactions', icon: <HistoryIcon />, path: '/history' },
        ] : [])
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Top Navigation Bar */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1,  backgroundColor: '#10e03d' }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        E-Serbisyo: Barangay Malaya
                    </Typography>
                    
                    {/* User Profile Dropdown */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                            {user.name || 'Resident'}
                        </Typography>
                        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
                            <Avatar sx={{ width: 32, height: 32 }} />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                        >
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                                Logout
                            </MenuItem>
                        </Menu>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton 
                                    selected={location.pathname === item.path}
                                    onClick={() => navigate(item.path)}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar /> {/* Spacer for AppBar */}
                <Outlet /> {/* This is where the child pages will render */}
            </Box>
        </Box>
    );
};

export default ResidentLayout;