import { Outlet, useNavigate } from 'react-router-dom';
import { 
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
    Typography, AppBar, Toolbar, Button, Divider 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment'; 
import PeopleIcon from '@mui/icons-material/People'; 
import CampaignIcon from '@mui/icons-material/Campaign'; 
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const drawerWidth = 240;

const AdminLayout = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('user_role'); 

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
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                        <Typography variant="caption" display="block" color="textSecondary">CURRENTLY LOGGED IN AS</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#1a237e' }}>
                            {userRole?.toUpperCase() || 'ADMIN'}
                        </Typography>
                    </Box>

                    <List>
                        {/* A. DASHBOARD */}
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/admin/dashboard')}>
                                <ListItemIcon><DashboardIcon /></ListItemIcon>
                                <ListItemText primary="Overview" />
                            </ListItemButton>
                        </ListItem>
                        
                        {/* B. REQUEST QUEUE */}
                        <ListItem disablePadding>
                            <ListItemButton onClick={() => navigate('/admin/requests')}>
                                <ListItemIcon><AssignmentIcon /></ListItemIcon>
                                <ListItemText primary="Request Queue" />
                            </ListItemButton>
                        </ListItem>

                        <Divider />

                        {/* C. RESIDENT DB */}
                        {['Captain', 'Secretary', 'Treasurer'].includes(userRole) && (
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => navigate('/admin/residents')}>
                                    <ListItemIcon><PeopleIcon /></ListItemIcon>
                                    <ListItemText primary="Resident Database" />
                                </ListItemButton>
                            </ListItem>
                        )}

                        {/* D. ANNOUNCEMENTS */}
                        {['Captain', 'Secretary'].includes(userRole) && (
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => navigate('/admin/announcements')}>
                                    <ListItemIcon><CampaignIcon /></ListItemIcon>
                                    <ListItemText primary="Announcements" />
                                </ListItemButton>
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