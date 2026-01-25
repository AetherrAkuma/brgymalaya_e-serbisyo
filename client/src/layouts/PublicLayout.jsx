import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';

const PublicLayout = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* 1. Public Navbar (No Sidebar) */}
            <AppBar position="static">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        {/* Logo / Title */}
                        <Typography
                            variant="h6"
                            noWrap
                            component={Link}
                            to="/"
                            sx={{
                                mr: 2,
                                display: 'flex',
                                flexGrow: 1,
                                fontWeight: 700,
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            E-SERBISYO: BARANGAY MALAYA
                        </Typography>

                        {/* Navigation Buttons */}
                        <Box>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/login" 
                                startIcon={<LoginIcon />}
                                sx={{ mr: 1 }}
                            >
                                Login
                            </Button>
                            <Button 
                                variant="outlined" 
                                color="inherit" 
                                component={Link} 
                                to="/register"
                                startIcon={<HowToRegIcon />}
                            >
                                Register
                            </Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* 2. Page Content (Full Width) */}
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Outlet />
            </Box>

            {/* 3. Simple Footer */}
            <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    © 2026 Barangay Malaya. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
};

export default PublicLayout;