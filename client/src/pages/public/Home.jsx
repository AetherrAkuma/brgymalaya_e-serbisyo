import { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';

export default function Home() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [services, setServices] = useState([]);

  // Fetch data from our Node.js backend when the page loads
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [newsRes, docsRes] = await Promise.all([
          api.get('/public/announcements'),
          api.get('/public/document-types')
        ]);
        setAnnouncements(newsRes.data.data);
        setServices(docsRes.data.data);
      } catch (error) {
        console.error("Error fetching public data:", error);
      }
    };
    fetchPublicData();
  }, []);

  return (
    <Box>
      {/* HERO SECTION */}
      <Box sx={{ bgcolor: 'primary.dark', color: 'white', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            Welcome to Barangay Malaya
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, fontWeight: 300, opacity: 0.9 }}>
            Fast, secure, and accessible digital services for every resident. Request your official documents online today.
          </Typography>
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/login')} sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}>
            Request a Document Now
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        
        {/* SERVICES GRID */}
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <DescriptionIcon sx={{ mr: 2, color: 'primary.main', fontSize: 36 }} /> E-Serbisyo Offerings
        </Typography>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.doc_type_id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{service.type_name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{service.description}</Typography>
                  <Chip label={`Fee: ₱${service.base_fee}`} color={service.base_fee > 0 ? "primary" : "success"} size="small" />
                </CardContent>
              </Card>
            </Grid>
          ))}
          {services.length === 0 && <Typography color="text.secondary" sx={{ ml: 3 }}>Loading services or no services available...</Typography>}
        </Grid>

        {/* ANNOUNCEMENTS GRID */}
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <CampaignIcon sx={{ mr: 2, color: 'secondary.main', fontSize: 36 }} /> Barangay Announcements
        </Typography>
        <Grid container spacing={3}>
          {announcements.map((news) => (
            <Grid item xs={12} md={6} key={news.announcement_id}>
              <Card sx={{ borderLeft: news.is_pinned ? '4px solid #D32F2F' : '4px solid #0D47A1' }}>
                <CardContent>
                  {news.is_pinned && <Chip label="Important" color="error" size="small" sx={{ mb: 1 }} />}
                  <Typography variant="h6" fontWeight="bold">{news.title}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Posted: {new Date(news.date_posted).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>{news.content_body}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {announcements.length === 0 && <Typography color="text.secondary" sx={{ ml: 3 }}>No active announcements at this time.</Typography>}
        </Grid>

      </Container>
    </Box>
  );
}