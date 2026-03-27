import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, CardMedia, 
  Button, Chip, IconButton, Stack, Paper, Divider, useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LoginIcon from '@mui/icons-material/Login';
import VerifiedIcon from '@mui/icons-material/Verified';

import api from '../../utils/axios';

export default function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [services, setServices] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [newsRes, docsRes] = await Promise.all([
          api.get('/public/announcements'),
          api.get('/public/document-types')
        ]);

        const parsedNews = newsRes.data.data.map(news => {
          const parts = (news.content_body || '').split('|||LINK|||');
          return {
            ...news,
            display_text: parts[0] ? parts[0].trim() : '',
            external_link: parts[1] ? parts[1].trim() : ''
          };
        });

        setAnnouncements(parsedNews);
        setServices(docsRes.data.data);
      } catch (error) {
        console.error("Error fetching public data:", error);
      }
    };
    fetchPublicData();
  }, []);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % announcements.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  const formatExternalUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % announcements.length);
  const handlePrevSlide = () => setActiveSlide((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));

  return (
    <Box sx={{ bgcolor: '#FFFFFF', minHeight: '100vh', scrollBehavior: 'smooth' }}>
      
      {/* --- PREMIUM HERO SECTION --- */}
      <Box sx={{ 
        position: 'relative',
        bgcolor: '#0A192F', // Deep Navy Civic Blue
        color: 'white', 
        pt: { xs: 12, md: 20 }, 
        pb: { xs: 10, md: 15 },
        overflow: 'hidden',
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
            zIndex: 1
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7} sx={{ animation: 'fadeInLeft 0.8s ease-out' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <VerifiedIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                    <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 'bold', color: '#3b82f6' }}>
                        Official Government Portal
                    </Typography>
                </Stack>
              <Typography variant="h1" fontWeight="900" sx={{ fontSize: { xs: '2.5rem', md: '4.5rem' }, lineHeight: 1.1, mb: 3 }}>
                Modernizing Our <br/> <span style={{ color: '#3b82f6' }}>Community Services.</span>
              </Typography>
              <Typography variant="h6" sx={{ mb: 5, color: '#94A3B8', maxWidth: '550px', fontWeight: 400 }}>
                Barangay Malaya's E-Serbisyo platform provides residents with a streamlined way to request documents and stay informed.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button 
                    variant="contained" 
                    onClick={() => navigate('/login')} 
                    sx={{ 
                        bgcolor: '#3b82f6', px: 4, py: 1.8, borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem',
                        '&:hover': { bgcolor: '#2563eb' }
                    }}
                >
                    Get Started
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={() => document.getElementById('announcements').scrollIntoView({ behavior: 'smooth' })}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)', px: 4, py: 1.8, borderRadius: '12px', fontWeight: 'bold' }}
                >
                    View News
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* --- ANNOUNCEMENTS SLIDER --- */}
      <Container id="announcements" maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 10, pb: 10 }}>
        <Paper elevation={20} sx={{ borderRadius: '24px', overflow: 'hidden', bgcolor: 'white' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <CampaignOutlinedIcon color="primary" />
                    <Typography variant="h6" fontWeight="800">Latest Advisories</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={handlePrevSlide} size="small" sx={{ border: '1px solid #e2e8f0' }}><ArrowBackIosNewIcon fontSize="inherit" /></IconButton>
                    <IconButton onClick={handleNextSlide} size="small" sx={{ border: '1px solid #e2e8f0' }}><ArrowForwardIosIcon fontSize="inherit" /></IconButton>
                </Stack>
            </Box>

            <Box sx={{ position: 'relative', minHeight: '350px' }}>
                {announcements.length > 0 ? (
                    <Box sx={{ display: 'flex', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(-${activeSlide * 100}%)` }}>
                        {announcements.map((news) => (
                            <Box key={news.announcement_id} sx={{ minWidth: '100%', p: { xs: 3, md: 6 } }}>
                                <Grid container spacing={4} alignItems="center">
                                    {news.image_path && (
                                        <Grid item xs={12} md={5}>
                                            <CardMedia component="img" image={news.image_path} sx={{ borderRadius: '16px', height: '280px', objectFit: 'cover' }} />
                                        </Grid>
                                    )}
                                    <Grid item xs={12} md={news.image_path ? 7 : 12}>
                                        <Stack spacing={2}>
                                            <Box>
                                                {news.is_pinned === 1 && <Chip label="Priority" size="small" color="error" sx={{ mr: 1, fontWeight: 'bold', borderRadius: '4px' }} />}
                                                <Typography variant="caption" color="text.secondary" fontWeight="600">{new Date(news.date_posted).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Typography>
                                            </Box>
                                            <Typography variant="h4" fontWeight="800" color="#0F172A">{news.title}</Typography>
                                            <Typography variant="body1" color="#475569" sx={{ lineHeight: 1.8 }}>{news.display_text}</Typography>
                                            {news.external_link && (
                                                <Button 
                                                    endIcon={<OpenInNewIcon />} 
                                                    href={formatExternalUrl(news.external_link)} 
                                                    target="_blank"
                                                    sx={{ alignSelf: 'start', fontWeight: '700', textTransform: 'none', p: 0 }}
                                                >
                                                    Click here for details
                                                </Button>
                                            )}
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{ p: 10, textAlign: 'center' }}><Typography color="text.secondary">No active advisories.</Typography></Box>
                )}
            </Box>
        </Paper>
      </Container>

      {/* --- SERVICES GRID --- */}
      <Container maxWidth="lg" sx={{ pb: 15 }}>
        <Stack spacing={1} sx={{ mb: 6, textAlign: 'center' }}>
            <Typography variant="h3" fontWeight="900" color="#0F172A">Online Services</Typography>
            <Typography variant="body1" color="text.secondary">Select a document to begin your digital application</Typography>
        </Stack>
        
        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.doc_type_id}>
              <Card sx={{ 
                height: '100%', display: 'flex', flexDirection: 'column', p: 1,
                borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: 'none',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-10px)', borderColor: '#3b82f6', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ bgcolor: '#F1F5F9', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                        <DescriptionOutlinedIcon color="primary" />
                    </Box>
                    <Typography variant="h6" fontWeight="800" gutterBottom>{service.type_name}</Typography>
                    <Typography variant="body2" color="#64748B" sx={{ mb: 3, minHeight: '45px' }}>{service.description || "Standard official document request."}</Typography>
                    <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">PROCESSING FEE</Typography>
                        <Typography variant="subtitle2" fontWeight="900" color={service.base_fee > 0 ? 'primary' : 'success.main'}>
                            {service.base_fee > 0 ? `₱${service.base_fee}` : "GRATIS"}
                        </Typography>
                    </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* --- FOOTER CTA --- */}
      <Box sx={{ bgcolor: '#F8FAFC', py: 10, borderTop: '1px solid #E2E8F0' }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="800" gutterBottom>Ready to request?</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Log in to your account to submit and track your document requests in real-time.</Typography>
            <Button variant="contained" size="large" startIcon={<LoginIcon />} onClick={() => navigate('/login')} sx={{ px: 6, borderRadius: '12px', fontWeight: 'bold' }}>
                Access Portal
            </Button>
          </Container>
      </Box>

      <style>
        {`
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-50px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
    </Box>
  );
}