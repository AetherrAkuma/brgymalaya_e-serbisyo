import { Typography, Grid, Card, CardContent, Button, Container, Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

const Home = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

            {/* 1. HERO SECTION */}
            <Paper
                sx={{
                    position: 'relative',
                    backgroundColor: 'grey.800',
                    color: '#fff',
                    mb: { xs: 4, sm: 5, md: 6 },
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: 'url(https://source.unsplash.com/random/1600x900/?community)',
                    height: { xs: '300px', sm: '350px', md: '400px', lg: '450px' },
                    minHeight: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    [theme.breakpoints.down('sm')]: {
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center 30%'
                    }
                }}
            >
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    left: 0,
                    backgroundColor: 'rgba(0,0,0,.5)',
                    [theme.breakpoints.down('sm')]: { backgroundColor: 'rgba(0,0,0,.6)' }
                }} />

                <Box position="relative" textAlign="center" px={{ xs: 1, sm: 2, md: 3 }}>
                    <Typography
                        component="h1"
                        variant={isMobile ? "h3" : isTablet ? "h4" : "h2"}
                        color="inherit"
                        gutterBottom
                        sx={{ fontWeight: 700, fontSize: { xs: '2rem', sm: '3rem' } }}
                    >
                        Welcome to Barangay Malaya
                    </Typography>
                    <Typography
                        variant={isMobile ? "h6" : "h5"}
                        color="inherit"
                        paragraph
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                        Fast, Secure, and Convenient Document Requests
                    </Typography>
                    <Button
                        variant="contained"
                        size={isMobile ? "medium" : "large"}
                        component={Link}
                        to="/register"
                        sx={{ mt: 2, padding: { xs: '8px 16px', sm: '10px 20px' } }}
                    >
                        Get Started
                    </Button>
                </Box>
            </Paper>

            <Container maxWidth="lg">
                {/* 2. SERVICES SECTION */}
                <Box sx={{
                    mb: { xs: 4, sm: 5, md: 6 },
                    textAlign: 'center',
                    px: { xs: 1, sm: 2 }
                }}>
                    <Typography
                        variant={isMobile ? "h5" : "h4"}
                        component="h2"
                        gutterBottom
                        sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
                    >
                        Our Services
                    </Typography>
                    <Typography
                        color="textSecondary"
                        paragraph
                        sx={{
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            px: { xs: 0, sm: 4, md: 6 },
                            mb: 4 
                        }}
                    >
                        Skip the line. Request your documents online in 3 easy steps.
                    </Typography>

                    <Grid 
                        container 
                        spacing={4} 
                        justifyContent="center" 
                        alignItems="stretch"    
                    >
                        {[
                            { icon: <DescriptionIcon fontSize="large"/>, title: 'Online Requests', desc: 'Request Clearance and Indigency certificates from home.' },
                            { icon: <SecurityIcon fontSize="large"/>, title: 'Secure Verification', desc: 'QR Code integration ensures all documents are authentic.' },
                            { icon: <SpeedIcon fontSize="large"/>, title: 'Real-time Tracking', desc: 'Monitor the status of your request instantly.' }
                        ].map((service, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index} sx={{ display: 'flex' }}>
                                <Card sx={{
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: { xs: 2, sm: 3 },
                                    boxShadow: 3,
                                    transition: 'transform 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-5px)'
                                    }
                                }}>
                                    <Box color="primary.main" mb={2} sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
                                        {service.icon}
                                    </Box>
                                    <Typography
                                        variant={isMobile ? "subtitle1" : "h6"}
                                        component="h3"
                                        gutterBottom
                                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                                    >
                                        {service.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                    >
                                        {service.desc}
                                    </Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* 3. LATEST ANNOUNCEMENTS (This is the section that needed fixing) */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 6 }, px: { xs: 1, sm: 0 } }}>
                    
                    {/* Centered Heading */}
                    <Typography
                        variant={isMobile ? "h5" : "h4"}
                        component="h2"
                        gutterBottom
                        sx={{
                            textAlign: 'center',
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                            mb: 3
                        }}
                    >
                        Latest Announcements
                    </Typography>

                    <Grid container spacing={{ xs: 2, sm: 3 }}>
                        {/* xs={12} ensures full width. */}
                        <Grid item xs={12}>
                            <Card variant="outlined" sx={{ 
                                width: '100%',
                                boxShadow: 2, 
                                transition: 'box-shadow 0.3s ease', 
                                '&:hover': { boxShadow: 4 } 
                            }}>
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                        System Launch: E-Serbisyo is Live!
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                        January 24, 2026
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 2 }}>
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