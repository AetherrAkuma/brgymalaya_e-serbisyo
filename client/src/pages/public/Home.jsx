import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, CardMedia, 
  Button, Chip, IconButton, Stack, Paper, Dialog, DialogContent, Avatar, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import PhoneInTalkIcon from '@mui/icons-material/PhoneInTalk';
import PeopleIcon from '@mui/icons-material/People';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SecurityIcon from '@mui/icons-material/Security';

import api from '../../utils/axios';

const officialsData = [
  { 
    id: 1, name: 'Juan dela Cruz', role: 'Barangay Captain', 
    image: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?q=80&w=250&auto=format&fit=crop', 
    bio: 'Serving as the chief executive of the barangay, leading community development and enforcing peace and order.',
    email: 'captain.juan@malaya.gov.ph'
  },
  { 
    id: 2, name: 'Maria Santos', role: 'Barangay Secretary', 
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&auto=format&fit=crop', 
    bio: 'Keeper of all official records, responsible for the issuance of certifications and barangay clearances.',
    email: 'secretary.maria@malaya.gov.ph'
  },
  { 
    id: 3, name: 'Roberto Garcia', role: 'Barangay Treasurer', 
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&auto=format&fit=crop', 
    bio: 'Manages the financial assets, collections, and disbursements of the barangay funds.',
    email: 'treasurer.roberto@malaya.gov.ph'
  },
  { 
    id: 4, name: 'Ana Reyes', role: 'Barangay Kagawad', 
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=250&auto=format&fit=crop', 
    bio: 'Chairman of the Committee on Health and Public Safety, ensuring the well-being of all residents.',
    email: 'kagawad.ana@malaya.gov.ph'
  },
  { 
    id: 5, name: 'Miguel Torres', role: 'Barangay Kagawad', 
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop', 
    bio: 'Chairman of the Committee on Sports and Youth Development, organizing grassroots programs.',
    email: 'kagawad.miguel@malaya.gov.ph'
  },
  { 
    id: 6, name: 'Carlos Mendoza', role: 'Barangay Kagawad', 
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=250&auto=format&fit=crop', 
    bio: 'Chairman of the Committee on Peace and Order, coordinating with local tanods for community security.',
    email: 'kagawad.carlos@malaya.gov.ph'
  },
  { 
    id: 7, name: 'Elena Villanueva', role: 'Barangay Kagawad', 
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=250&auto=format&fit=crop', 
    bio: 'Chairman of the Committee on Education and Women\'s Affairs, spearheading livelihood seminars.',
    email: 'kagawad.elena@malaya.gov.ph'
  }
];

export default function Home() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  
  // Announcement Slide State
  const [activeSlide, setActiveSlide] = useState(0);

  // Live Weather & Air Quality State
  const [weatherData, setWeatherData] = useState({
    temp: 31,
    condition: 'Sunny',
    aqi: 42,
    heatIndex: 36
  });

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.6760&longitude=121.0437&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code');
        const data = await response.json();
        
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const heatIndex = Math.round(data.current.apparent_temperature);
          const code = data.current.weather_code;
          
          let condition = 'Sunny';
          if (code === 0) condition = 'Sunny';
          else if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
          else if (code >= 51 && code <= 67) condition = 'Rainy';
          else if (code >= 80 && code <= 82) condition = 'Rain Showers';
          else if (code >= 95) condition = 'Thunderstorm';
          else condition = 'Cloudy';

          let aqi = 42;
          try {
            const aqiRes = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=14.6760&longitude=121.0437&current=us_aqi');
            const aqiData = await aqiRes.json();
            if (aqiData && aqiData.current) {
              aqi = Math.round(aqiData.current.us_aqi);
            }
          } catch (aqiErr) {
            console.error("AQI fetch failed:", aqiErr);
          }

          setWeatherData({
            temp,
            condition,
            aqi,
            heatIndex
          });
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
      }
    };

    const fetchPublicData = async () => {
      try {
        const [newsRes, docsRes] = await Promise.all([
          api.get('/public/announcements'),
          api.get('/public/document-types')
        ]);

        const parsedNews = (newsRes.data.data || []).map(news => {
          const rawContent = news.content_body || '';
          const parts = rawContent.split('|||LINK|||');
          return {
            ...news,
            display_text: parts[0] ? parts[0].trim() : '',
            external_link: parts[1] ? parts[1].trim() : ''
          };
        });

        const liveNews = parsedNews.filter(n => n.status === 'Published');
        setAnnouncements(liveNews);
        setServices(docsRes.data.data || []);
      } catch (error) {
        console.error("Error fetching public data:", error);
      }
    };

    fetchWeather();
    fetchPublicData();
  }, []);

  // Manual Slide Controls (Replaces Auto-Play)
  const handleNextSlide = () => setActiveSlide((prev) => (prev + 1) % announcements.length);
  const handlePrevSlide = () => setActiveSlide((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const resolveImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    return `${base}${imgPath}`;
  };

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* =========================================
          CONTAINER 1: HERO SECTION & REAL-TIME WIDGETS
          ========================================= */}
      <Box sx={{ 
        bgcolor: '#0f172a', color: 'white', py: { xs: 6, md: 10 }, textAlign: 'center',
        borderBottom: '5px solid #2563eb', position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, animation: 'fadeInUp 0.8s ease-out' }}>
          
          {/* Real-time Community Indicators (QC-Style Widgets) */}
          <Grid container spacing={2} sx={{ mb: { xs: 4, md: 6 }, justifyContent: 'center' }}>
            {[
              { icon: <WbSunnyIcon sx={{ color: '#fbbf24' }} />, label: 'Weather', value: `${weatherData.temp}°C ${weatherData.condition}`, desc: 'Quezon City, PH' },
              { 
                icon: <AirIcon sx={{ color: weatherData.aqi <= 50 ? '#34d399' : weatherData.aqi <= 100 ? '#facc15' : '#f87171' }} />, 
                label: 'Air Quality', 
                value: `${weatherData.aqi} AQI`, 
                desc: weatherData.aqi <= 50 ? 'Good / Healthy' : weatherData.aqi <= 100 ? 'Moderate' : 'Unhealthy' 
              },
              { 
                icon: <ThermostatIcon sx={{ color: weatherData.heatIndex < 38 ? '#facc15' : '#f87171' }} />, 
                label: 'Heat Index', 
                value: `${weatherData.heatIndex}°C`, 
                desc: weatherData.heatIndex < 27 ? 'Comfortable' : weatherData.heatIndex < 33 ? 'Caution' : weatherData.heatIndex < 40 ? 'Extreme Caution' : 'Danger' 
              },
              { icon: <PhoneInTalkIcon sx={{ color: '#60a5fa' }} />, label: 'Emergency Hotline', value: 'Dial 122', desc: '24/7 Response Desk' },
            ].map((widget, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box sx={{
                  p: 1.5, borderRadius: 3, 
                  bgcolor: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  height: '100%',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }
                }}>
                  {widget.icon}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                      {widget.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
                      {widget.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.55rem' }}>
                      {widget.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          <AccountBalanceIcon sx={{ fontSize: { xs: 40, md: 54 }, color: '#3b82f6', mb: 1.5 }} />
          <Typography variant="h2" fontWeight="900" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' }, letterSpacing: '-1px', lineHeight: 1.1 }}>
            Barangay Malaya
          </Typography>
          <Typography variant="body1" sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' }, mb: 4, fontWeight: 400, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 650, mx: 'auto' }}>
            The official E-Serbisyo portal. Request clearances, track your applications, 
            and stay updated with the latest community advisories securely online.
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button 
              variant="contained" size="large" disableElevation endIcon={<SendIcon />}
              onClick={() => navigate('/login')} 
              sx={{ bgcolor: '#2563eb', color: 'white', px: 4, py: 1.5, fontSize: '0.95rem', fontWeight: 'bold', borderRadius: 2.5, textTransform: 'none', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Access Services Portal
            </Button>
            <Button 
              variant="outlined" size="large"
              onClick={() => navigate('/verify')} 
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', px: 4, py: 1.5, fontSize: '0.95rem', fontWeight: 'bold', borderRadius: 2.5, textTransform: 'none', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}
            >
              Verify Secure Document
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* =========================================
          REAL-TIME ANNOUNCEMENT TICKER (QC-STYLE)
          ========================================= */}
      <Box sx={{ 
        bgcolor: '#1e293b', 
        color: 'white', 
        py: 2, 
        borderBottom: '1px solid rgba(226, 232, 240, 0.1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        textAlign: 'center',
        px: 2
      }}>
        <Container maxWidth="lg">
          <Typography 
            variant="body2" 
            fontWeight="700" 
            sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.875rem' }, 
              letterSpacing: '0.01em',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1,
              lineHeight: 1.4
            }}
          >
            <Box component="span" sx={{ color: '#fbbf24', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ANNOUNCEMENT :
            </Box>
            {announcements.length > 0 ? (
              <Box component="span" sx={{ color: '#cbd5e1' }}>
                {announcements[0].title} – {new Date(announcements[0].date_posted).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Box>
            ) : (
              <Box component="span" sx={{ color: '#cbd5e1' }}>
                Welcome to Barangay Malaya E-Serbisyo Portal. Clearances, residency certificates, and indigency proofs can now be requested online.
              </Box>
            )}
          </Typography>
        </Container>
      </Box>

      {/* =========================================
          CONTAINER 2: ANNOUNCEMENTS & ADVISORIES
          ========================================= */}
      <Box sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <CampaignOutlinedIcon sx={{ mr: 1.5, color: '#ef4444', fontSize: 32 }} /> 
                Official Advisories
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Latest announcements and public notices from the barangay hall.
              </Typography>
            </Box>
            
            {/* Slide Indicator */}
            {announcements.length > 0 && (
              <Chip 
                label={`Advisory ${activeSlide + 1} of ${announcements.length}`} 
                size="small" 
                sx={{ fontWeight: 'bold', bgcolor: '#eff6ff', color: '#1d4ed8' }} 
              />
            )}
          </Box>

          {announcements.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', border: '1px solid #e2e8f0', bgcolor: 'white', borderRadius: 3 }}>
              <CampaignOutlinedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
              <Typography color="text.secondary" fontWeight="bold">No active announcements at this time.</Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ 
              borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', 
              bgcolor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', position: 'relative'
            }}>
              <Box sx={{ display: 'flex', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${activeSlide * 100}%)` }}>
                {announcements.map((news) => (
                  <Box key={news.announcement_id} sx={{ minWidth: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                    
                    {/* Left Side: The Image */}
                    <Box sx={{ width: { xs: '100%', md: '50%' }, bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {resolveImageUrl(news.image_path) ? (
                        <CardMedia 
                          component="img" 
                          image={resolveImageUrl(news.image_path)}
                          alt={news.title}
                          sx={{ height: '100%', minHeight: { xs: 250, md: 450 }, maxHeight: 450, objectFit: 'cover' }} 
                        />
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#475569', p: 4, minHeight: { xs: 250, md: 450 } }}>
                          <CampaignOutlinedIcon sx={{ fontSize: 64, opacity: 0.2 }} />
                          <Typography variant="caption" sx={{ opacity: 0.4 }}>No image attached</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Right Side: The Description Box & Controls */}
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 3, sm: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      
                      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {news.is_pinned === 1 && <Chip label="Priority" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', borderRadius: 1 }} />}
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          POSTED: {new Date(news.date_posted).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' }, lineHeight: 1.2, mb: 2 }}>
                        {news.title}
                      </Typography>
                      
                      <Typography variant="body2" color="#475569" sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' }, lineHeight: 1.6, mb: 3, flexGrow: 1, maxHeight: 180, overflowY: 'auto' }}>
                        {news.display_text}
                      </Typography>

                      {news.external_link && (
                        <Box sx={{ mb: 3 }}>
                          <Button variant="outlined" disableElevation endIcon={<OpenInNewIcon />} href={formatUrl(news.external_link)} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: 2, borderColor: '#cbd5e1', color: '#0f172a', py: 1 }}>
                            Read Full Details
                          </Button>
                        </Box>
                      )}

                      {/* Prominent Next/Prev Arrow Controls */}
                      {announcements.length > 1 && (
                        <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #e2e8f0' }}>
                          <IconButton 
                            onClick={handlePrevSlide} 
                            sx={{ border: '1px solid #e2e8f0', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' } }}
                          >
                            <ArrowBackIcon />
                          </IconButton>
                          <Button 
                            onClick={handleNextSlide}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ flexGrow: 1, bgcolor: '#0f172a', color: 'white', fontWeight: 'bold', borderRadius: 2, py: 1.2, '&:hover': { bgcolor: '#1e293b' } }}
                          >
                            Next Advisory
                          </Button>
                        </Stack>
                      )}

                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Container>
      </Box>

      {/* =========================================
          CONTAINER 3: SERVICES CATALOG
          ========================================= */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f1f5f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <DescriptionOutlinedIcon sx={{ color: '#10b981', fontSize: 36 }} /> 
              Online E-Services Catalog
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
              Request official barangay clearances, indigency certificates, and residency papers online. Secure, fast, and fully automated processing.
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.doc_type_id}>
                <Card 
                  elevation={0} 
                  sx={{ 
                    borderRadius: 3, 
                    border: '1px solid #e2e8f0', 
                    bgcolor: 'white',
                    height: '100%',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer',
                    '&:hover': { 
                      borderColor: '#10b981', 
                      boxShadow: '0 8px 24px rgba(16,185,129,0.08)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                  onClick={() => navigate('/login')}
                >
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.08)', color: '#10b981', width: 44, height: 44 }}>
                        <DescriptionOutlinedIcon />
                      </Avatar>
                      <Chip 
                        label={service.base_fee > 0 ? `₱${service.base_fee}` : "FREE"} size="small" 
                        sx={{ bgcolor: service.base_fee > 0 ? '#eff6ff' : '#ecfdf5', color: service.base_fee > 0 ? '#1d4ed8' : '#047857', fontWeight: '800', borderRadius: 1.5 }} 
                      />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ mb: 1, lineHeight: 1.2 }}>
                      {service.type_name}
                    </Typography>
                    <Typography variant="body2" color="#64748b" sx={{ lineHeight: 1.5, mb: 2 }}>
                      {service.description || "Official document available for secure online request."}
                    </Typography>
                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
                      <Typography variant="caption" color="primary.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Request Certificate <ArrowForwardIcon sx={{ fontSize: 14 }} />
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {services.length === 0 && (
               <Grid item xs={12}>
                 <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
                   <Typography color="text.secondary">Loading available services...</Typography>
                 </Paper>
               </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* =========================================
          CONTAINER 4: OFFICIALS
          ========================================= */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
              Barangay Malaya Council
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Meet our dedicated leaders serving the community with transparency and integrity.
            </Typography>
          </Box>
          
          <Grid container spacing={3} justifyContent="center">
            {officialsData.map((official) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={official.id}>
                <Card 
                  elevation={0} 
                  onClick={() => setSelectedOfficial(official)}
                  sx={{ 
                    height: '100%',
                    borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc',
                    cursor: 'pointer', transition: 'all 0.3s ease', overflow: 'hidden',
                    '&:hover': { transform: 'translateY(-6px)', borderColor: '#2563eb', boxShadow: '0 12px 24px rgba(37,99,235,0.06)', bgcolor: 'white' }
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar 
                      src={official.image} 
                      alt={official.name} 
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid #eff6ff', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }} 
                    />
                    <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ lineHeight: 1.2 }}>
                      {official.name}
                    </Typography>
                    <Typography variant="caption" color="#2563eb" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5, display: 'block' }}>
                      {official.role}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* =========================================
          CONTAINER 5: FOOTER & CONTACT (QC-Style)
          ========================================= */}
      <Box sx={{ bgcolor: '#0f172a', color: '#94a3b8', pt: 8, pb: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <AccountBalanceIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                <Typography variant="h6" fontWeight="bold" color="white">
                  Barangay Malaya
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 3 }}>
                Providing accessible, responsive, and secure electronic services to our community. Committed to raising the standard of local governance in the digital era.
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <EmailIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                <Typography variant="caption" color="#cbd5e1">
                  support@barangaymalaya.gov.ph
                </Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" color="white" fontWeight="bold" sx={{ mb: 2 }}>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Typography variant="caption" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }} onClick={() => navigate('/login')}>E-Serbisyo Portal</Typography>
                <Typography variant="caption" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }} onClick={() => navigate('/register')}>Register Resident Account</Typography>
                <Typography variant="caption" sx={{ cursor: 'pointer', '&:hover': { color: 'white' } }} onClick={() => navigate('/verify')}>Document Verification</Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="subtitle2" color="white" fontWeight="bold" sx={{ mb: 2 }}>
                Emergency Contacts
              </Typography>
              <Stack spacing={1.5}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" color="white" fontWeight="bold" display="block">QC Emergency Hotline</Typography>
                  <Typography variant="body2" color="#f87171" fontWeight="bold">Dial 122</Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" color="white" fontWeight="bold" display="block">Barangay Desk Hotline</Typography>
                  <Typography variant="body2" color="#60a5fa" fontWeight="bold">(02) 8924-1234</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
          
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 4 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <Typography variant="caption">
              © {new Date().getFullYear()} Barangay Malaya E-Serbisyo. All Rights Reserved.
            </Typography>
            <Typography variant="caption">
              In accordance with RA 10173 (Data Privacy Act of 2012)
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* --- THE OFFICIALS MODAL --- */}
      <Dialog open={!!selectedOfficial} onClose={() => setSelectedOfficial(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}>
        {selectedOfficial && (
          <Box>
            <Box sx={{ height: 100, bgcolor: '#0f172a', position: 'relative' }}>
              <IconButton onClick={() => setSelectedOfficial(null)} sx={{ position: 'absolute', top: 8, right: 8, color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <DialogContent sx={{ px: 4, pb: 5, textAlign: 'center', mt: '-60px' }}>
              <Avatar src={selectedOfficial.image} alt={selectedOfficial.name} sx={{ width: 120, height: 120, mx: 'auto', mb: 2, border: '5px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
              <Typography variant="h5" fontWeight="900" color="#0f172a">{selectedOfficial.name}</Typography>
              <Chip label={selectedOfficial.role} sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 'bold', mt: 1, mb: 3 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2, lineHeight: 1.6 }}>"{selectedOfficial.bio}"</Typography>
              <Button variant="outlined" startIcon={<EmailIcon />} href={`mailto:${selectedOfficial.email}`} sx={{ borderRadius: 2.5, fontWeight: 'bold', textTransform: 'none', color: '#0f172a', borderColor: '#cbd5e1' }}>Contact via Email</Button>
            </DialogContent>
          </Box>
        )}
      </Dialog>
      
      <style>{`
        @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Box>
  );
}