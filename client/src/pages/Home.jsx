import { Typography, Grid, Card, CardContent, Button, Container, Box, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

const Home = () => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

            {/* 1. HERO SECTION (Full Width Banner) */}
            <Paper 
                sx={{ 
                    position: 'relative', 
                    backgroundColor: 'grey.800', 
                    color: '#fff', 
                    mb: 4, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    backgroundImage: 'url(https://source.unsplash.com/random/1600x900/?community)', // Placeholder Image
                    height: '400px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}
            >
                {/* Dark Overlay for text readability */}
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, backgroundColor: 'rgba(0,0,0,.5)' }} />
                
                <Box position="relative" textAlign="center" px={2}>
                    <Typography component="h1" variant="h2" color="inherit" gutterBottom>
                        Welcome to Barangay Malaya
                    </Typography>
                    <Typography variant="h5" color="inherit" paragraph>
                        Fast, Secure, and Convenient Document Requests
                    </Typography>
                    <Button variant="contained" size="large" component={Link} to="/register" sx={{ mt: 2 }}>
                        Get Started
                    </Button>
                </Box>
            </Paper>

            <Container maxWidth="lg">
                {/* 2. SERVICES SECTION */}
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Our Services
                    </Typography>
                    <Typography color="textSecondary" paragraph>
                        Skip the line. Request your documents online in 3 easy steps.
                    </Typography>
                    
                    <Grid container spacing={4} sx={{ mt: 2 }}>
                        {[
                            { icon: <DescriptionIcon fontSize="large"/>, title: 'Online Requests', desc: 'Request Clearance and Indigency certificates from home.' },
                            { icon: <SecurityIcon fontSize="large"/>, title: 'Secure Verification', desc: 'QR Code integration ensures all documents are authentic.' },
                            { icon: <SpeedIcon fontSize="large"/>, title: 'Real-time Tracking', desc: 'Monitor the status of your request instantly.' }
                        ].map((service, index) => (
                            <Grid item xs={12} md={4} key={index}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                                    <Box color="primary.main" mb={2}>{service.icon}</Box>
                                    <Typography variant="h6" component="h3" gutterBottom>{service.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">{service.desc}</Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* 3. LATEST ANNOUNCEMENTS */}
                <Box sx={{ mb: 6 }}>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ borderLeft: '5px solid #1976d2', pl: 2 }}>
                        Latest Announcements
                    </Typography>
                    <Grid container spacing={3}>
                        {/* Placeholder Announcement */}
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6">System Launch: E-Serbisyo is Live!</Typography>
                                    <Typography variant="caption" color="textSecondary">January 24, 2026</Typography>
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                        We are officially launching the new web portal. Please register your account to begin transacting with the Barangay Hall.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Container>
        </Box>
    );
};

export default Home;