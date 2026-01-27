import { Typography, Grid, Card, CardContent, Button, Container, Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { Link } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import Divider from '@mui/material/Divider';

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

                {/* 3. LATEST ANNOUNCEMENTS */}
                <Box
                sx={{
                    width: '100vw',
                    position: 'relative',
                    left: '50%',
                    right: '50%',
                    marginLeft: '-50vw',
                    marginRight: '-50vw',
                    backgroundColor: '#2e2e2e',
                    py: { xs: 4, sm: 6 },
                }}
                >
                <Box
                    sx={{
                    maxWidth: 1200,
                    mx: 'auto',
                    px: { xs: 2, sm: 3 },
                    }}
                >
                    {/* Centered Heading */}
                    <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h2"
                gutterBottom
                sx={{
                    textAlign: 'center',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                    mb: 1, // reduced margin-bottom to fit nicely with the subline
                    color: '#ffffff',
                }}
                >
                Announcements and Programs
                </Typography>

                <Typography
                variant="subtitle1"
                sx={{
                    textAlign: 'center',
                    color: '#bdbdbd',
                    fontSize: '1.3rem',
                    mb: 4, // space before the cards start
                }}
                >
                Stay informed with our community updates
                </Typography>


    {/* Flex container for cards */}
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }, // stacked on mobile, row on desktop
        gap: 3, // space between cards
        justifyContent: 'center',
        alignItems: 'stretch',
      }}
    >
      {/* 1st Card */}
      <Card
        sx={{
          flex: 1,
          maxWidth: 380,
          backgroundColor: '#2f2f2f',
          color: '#ffffff',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.35)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 30px rgba(0,0,0,0.45)',
          },
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800"
          alt="System Launch"
          sx={{ width: '100%', height: 180, objectFit: 'cover' }}
        />
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            System Launch: E-Serbisyo is Live!
          </Typography>
          <Divider sx={{ backgroundColor: '#555', mb: 1.5 }} />
          <Typography variant="caption" sx={{ display: 'block', color: '#bdbdbd', mb: 1.5 }}>
            January 24, 2026
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0', lineHeight: 1.6, mb: 3 }}>
            We are officially launching the new web portal. Please register your account to begin transacting with the Barangay Hall.
          </Typography>
          <Button fullWidth variant="contained" sx={{ fontSize: 16, borderRadius: 2, py: 1.2, fontWeight: 600, textTransform: 'none' }}>
            Read More
          </Button>
        </CardContent>
      </Card>

      {/* 2nd Card */}
      <Card
        sx={{
          flex: 1,
          maxWidth: 380,
          backgroundColor: '#2f2f2f',
          color: '#ffffff',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.35)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 30px rgba(0,0,0,0.45)',
          },
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=800"
          alt="Online Clearance"
          sx={{ width: '100%', height: 180, objectFit: 'cover' }}
        />
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Barangay Clearance Online Processing
          </Typography>
          <Divider sx={{ backgroundColor: '#555', mb: 1.5 }} />
          <Typography variant="caption" sx={{ display: 'block', color: '#bdbdbd', mb: 1.5 }}>
            February 2, 2026
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0', lineHeight: 1.6, mb: 3 }}>
            Residents can now request barangay clearance online with faster processing and real-time status updates.
          </Typography>
          <Button fullWidth variant="contained" sx={{ fontSize: 16, borderRadius: 2, py: 1.2, fontWeight: 600, textTransform: 'none' }}>
            Read More
          </Button>
        </CardContent>
      </Card>

      {/* 3rd Card */}
      <Card
        sx={{
          flex: 1,
          maxWidth: 380,
          backgroundColor: '#2f2f2f',
          color: '#ffffff',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0px 8px 24px rgba(0,0,0,0.35)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 30px rgba(0,0,0,0.45)',
          },
        }}
      >
        <Box
          component="img"
          src="https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=800"
          alt="Community Meeting"
          sx={{ width: '100%', height: 180, objectFit: 'cover' }}
        />
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Community Meeting Announcement
          </Typography>
          <Divider sx={{ backgroundColor: '#555', mb: 1.5 }} />
          <Typography variant="caption" sx={{ display: 'block', color: '#bdbdbd', mb: 1.5 }}>
            February 10, 2026
          </Typography>
          <Typography variant="body2" sx={{ color: '#e0e0e0', lineHeight: 1.6, mb: 3 }}>
            Join us for the monthly community meeting to discuss upcoming projects and public services improvements.
          </Typography>
          <Button fullWidth variant="contained" sx={{ fontSize: 16, borderRadius: 2, py: 1.2, fontWeight: 600, textTransform: 'none' }}>
            Read More
          </Button>
        </CardContent>
      </Card>
    </Box>
  </Box>
</Box>



            </Container>
        </Box>
    );
};

export default Home;