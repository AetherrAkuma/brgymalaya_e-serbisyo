import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, Button, Divider } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Requests
import PeopleIcon from '@mui/icons-material/People'; // Resident DB
import CampaignIcon from '@mui/icons-material/Campaign'; // Announcements
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 240;

const AdminLayout = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('user_role'); // e.g., "Captain", "Treasurer"

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user_role');
        navigate('/admin/login');
    };

    return (
        <Box sx={{ display: 'flex' }}>
            {/* TOP BAR */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#1a237e' }}>
                <Toolbar>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        Barangay E-Serbisyo: <strong>OFFICIAL PORTAL</strong>
                    </Typography>
                    <Button color="inherit" onClick={handleLogout} startIcon={<ExitToAppIcon />}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            {/* SIDEBAR */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar /> {/* Spacer */}
                <Box sx={{ overflow: 'auto' }}>
                    <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid #ddd', bgcolor: '#f5f5f5' }}>
                        <Typography variant="subtitle2" color="textSecondary">LOGGED IN AS</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1a237e' }}>
                            {userRole?.toUpperCase()}
                        </Typography>
                    </Box>

                    <List>
                        {/* 1. DASHBOARD (Everyone) */}
                        <ListItem button onClick={() => navigate('/admin/dashboard')}>
                            <ListItemIcon><DashboardIcon /></ListItemIcon>
                            <ListItemText primary="Overview" />
                        </ListItem>
                        
                        {/* 2. REQUEST QUEUE (Everyone needs to see tasks) */}
                        <ListItem button onClick={() => navigate('/admin/requests')}>
                            <ListItemIcon><AssignmentIcon /></ListItemIcon>
                            <ListItemText primary="Request Queue" />
                        </ListItem>

                        {/* 3. RESIDENT DATABASE (Captain, Secretary, AND Treasurer) */}
                        {['Captain', 'Secretary', 'Treasurer'].includes(userRole) && (
                            <ListItem button onClick={() => navigate('/admin/residents')}>
                                <ListItemIcon><PeopleIcon /></ListItemIcon>
                                <ListItemText primary="Resident Database" />
                            </ListItem>
                        )}

                        <Divider />

                        {/* 4. ANNOUNCEMENTS (Captain & Secretary Only) */}
                        {['Captain', 'Secretary'].includes(userRole) && (
                            <ListItem button onClick={() => navigate('/admin/announcements')}>
                                <ListItemIcon><CampaignIcon /></ListItemIcon>
                                <ListItemText primary="Announcements" />
                            </ListItem>
                        )}
                    </List>
                </Box>
            </Drawer>

            {/* MAIN CONTENT */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f4f6f8', minHeight: '100vh' }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;