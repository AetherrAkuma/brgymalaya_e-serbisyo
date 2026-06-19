import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Card, CardContent, CardMedia, 
  Button, Chip, IconButton, Stack, Paper, Dialog, DialogContent, Avatar 
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

  useEffect(() => {
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
          CONTAINER 1: HERO SECTION
          ========================================= */}
      <Box sx={{ 
        bgcolor: '#0f172a', color: 'white', py: { xs: 8, md: 12 }, textAlign: 'center',
        borderBottom: '5px solid #2563eb', position: 'relative'
      }}>
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, animation: 'fadeInUp 0.8s ease-out' }}>
          <AccountBalanceIcon sx={{ fontSize: 60, color: '#3b82f6', mb: 2 }} />
          <Typography variant="h2" fontWeight="900" gutterBottom sx={{ letterSpacing: '-1px' }}>
            Barangay Malaya
          </Typography>
          <Typography variant="h6" sx={{ mb: 5, fontWeight: 400, color: '#cbd5e1', lineHeight: 1.6 }}>
            The official E-Serbisyo portal. Request clearances, track your documents, 
            and stay updated with the latest community advisories securely online.
          </Typography>
          <Button 
            variant="contained" size="large" disableElevation endIcon={<SendIcon />}
            onClick={() => navigate('/login')} 
            sx={{ bgcolor: '#2563eb', color: 'white', px: 5, py: 1.8, fontSize: '1.1rem', fontWeight: 'bold', borderRadius: 2, '&:hover': { bgcolor: '#1d4ed8' } }}
          >
            Access Services Portal
          </Button>
        </Container>
      </Box>

      {/* =========================================
          CONTAINER 2: ANNOUNCEMENTS (YOUR IDEA)
          ========================================= */}
      <Box sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
            <Typography variant="h5" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center' }}>
              <CampaignOutlinedIcon sx={{ mr: 1.5, color: '#2563eb', fontSize: 32 }} /> 
              Official Advisories
            </Typography>
            
            {/* Slide Indicator */}
            {announcements.length > 0 && (
              <Typography variant="body2" fontWeight="bold" color="text.secondary">
                Advisory {activeSlide + 1} of {announcements.length}
              </Typography>
            )}
          </Box>

          {announcements.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid #e2e8f0', bgcolor: 'white', borderRadius: 3 }}>
              <Typography color="text.secondary">No active announcements at this time.</Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ 
              borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0', 
              bgcolor: 'white', position: 'relative'
            }}>
              <Box sx={{ display: 'flex', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${activeSlide * 100}%)` }}>
                {announcements.map((news) => (
                  <Box key={news.announcement_id} sx={{ minWidth: '100%', display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                    
                    {/* Left Side: The Image */}
                    <Box sx={{ width: { xs: '100%', md: '50%' }, bgcolor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {resolveImageUrl(news.image_path) ? (
                        <CardMedia 
                          component="img" 
                          image={resolveImageUrl(news.image_path)}
                          alt={news.title}
                          sx={{ height: '100%', minHeight: { xs: 250, md: 450 }, objectFit: 'cover' }} 
                        />
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#475569', p: 4, minHeight: { xs: 250, md: 450 } }}>
                          <CampaignOutlinedIcon sx={{ fontSize: 64, opacity: 0.2 }} />
                          <Typography variant="caption" sx={{ opacity: 0.4 }}>No image attached</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Right Side: The Description Box & Controls */}
                    <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {news.is_pinned === 1 && <Chip label="Priority" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', borderRadius: 1 }} />}
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          POSTED: {new Date(news.date_posted).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </Typography>
                      </Box>
                      
                      <Typography variant="h3" fontWeight="900" color="#0f172a" sx={{ lineHeight: 1.1, mb: 3 }}>
                        {news.title}
                      </Typography>
                      
                      <Typography variant="body1" color="#475569" sx={{ lineHeight: 1.8, mb: 4, flexGrow: 1 }}>
                        {news.display_text}
                      </Typography>

                      {news.external_link && (
                        <Box sx={{ mb: 4 }}>
                          <Button variant="outlined" disableElevation endIcon={<OpenInNewIcon />} href={formatUrl(news.external_link)} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: 2, borderColor: '#cbd5e1', color: '#0f172a' }}>
                            Read Full Details
                          </Button>
                        </Box>
                      )}

                      {/* Prominent Next/Prev Arrow Controls */}
                      {announcements.length > 1 && (
                        <Stack direction="row" spacing={2} sx={{ mt: 'auto', pt: 3, borderTop: '1px solid #e2e8f0' }}>
                          <IconButton 
                            onClick={handlePrevSlide} 
                            sx={{ border: '2px solid #e2e8f0', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' } }}
                          >
                            <ArrowBackIcon />
                          </IconButton>
                          <Button 
                            onClick={handleNextSlide}
                            endIcon={<ArrowForwardIcon />}
                            sx={{ flexGrow: 1, bgcolor: '#0f172a', color: 'white', fontWeight: 'bold', borderRadius: 2, py: 1.5, '&:hover': { bgcolor: '#1e293b' } }}
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
          CONTAINER 3: OFFICIALS (Crisp White)
          ========================================= */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
              Barangay Malaya Council
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Meet our dedicated leaders serving the community.
            </Typography>
          </Box>
          
          <Grid container spacing={4} justifyContent="center">
            {officialsData.map((official) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={official.id}>
                <Card 
                  elevation={0} 
                  onClick={() => setSelectedOfficial(official)}
                  sx={{ 
                    height: '280px', 
                    display: 'flex', flexDirection: 'column', 
                    borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc',
                    cursor: 'pointer', transition: 'all 0.3s ease', overflow: 'hidden',
                    '&:hover': { transform: 'translateY(-8px)', borderColor: '#3b82f6', boxShadow: '0 12px 25px -5px rgba(0,0,0,0.1)', bgcolor: 'white' }
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Avatar 
                      src={official.image} 
                      alt={official.name} 
                      sx={{ width: 100, height: 100, mx: 'auto', mb: 2, border: '3px solid #eff6ff' }} 
                    />
                    <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ lineHeight: 1.2 }}>
                      {official.name}
                    </Typography>
                    <Typography variant="body2" color="#2563eb" fontWeight="bold" sx={{ mt: 0.5 }}>
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
          CONTAINER 4: SERVICES (Slate/Default)
          ========================================= */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Typography variant="h5" fontWeight="900" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4, color: '#0f172a' }}>
            <DescriptionOutlinedIcon sx={{ mr: 1.5, color: '#10b981', fontSize: 32 }} /> 
            E-Serbisyo Documents
          </Typography>
          
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.doc_type_id}>
                <Card elevation={0} sx={{ 
                  height: '240px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: 3, 
                  border: '1px solid #e2e8f0', 
                  bgcolor: 'white',
                  overflow: 'hidden'
                }}>
                  <CardContent sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, minHeight: '48px' }}>
                      <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ lineHeight: 1.2, pr: 1 }}>
                        {service.type_name}
                      </Typography>
                      <Chip 
                        label={service.base_fee > 0 ? `₱${service.base_fee}` : "FREE"} size="small" 
                        sx={{ bgcolor: service.base_fee > 0 ? '#eff6ff' : '#ecfdf5', color: service.base_fee > 0 ? '#1d4ed8' : '#047857', fontWeight: 'bold', borderRadius: 1 }} 
                      />
                    </Box>
                    <Typography variant="body2" color="#64748b" sx={{ 
                      lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {service.description || "Official document available for secure online request."}
                    </Typography>
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
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: 2, lineHeight: 1.6 }}>"{selectedOfficial.bio}"</Typography>
              <Button variant="outlined" startIcon={<EmailIcon />} href={`mailto:${selectedOfficial.email}`} sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', color: '#0f172a', borderColor: '#cbd5e1' }}>Contact via Email</Button>
            </DialogContent>
          </Box>
        )}
      </Dialog>

      <style>{`@keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }`}</style>
    </Box>
  );
}