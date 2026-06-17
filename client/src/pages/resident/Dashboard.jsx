import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Chip, 
  Stack, Divider, Paper, CircularProgress, IconButton, Dialog, 
  DialogTitle, DialogContent, CardMedia
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import api from '../../utils/axios';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0 });

  // State: Keeps track of which advisory was clicked for the popup
  const [selectedAdvisory, setSelectedAdvisory] = useState(null);

  const firstName = localStorage.getItem('first_name') || 'Resident';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [newsRes, docsRes, reqRes] = await Promise.all([
          api.get('/public/announcements'),
          api.get('/public/document-types'),
          api.get('/requests/resident/me') 
        ]);

        const parsedNews = (newsRes.data.data || []).map(news => {
          const parts = (news.content_body || '').split('|||LINK|||');
          return { 
            ...news, 
            display_text: parts[0] ? parts[0].trim() : '',
            external_link: parts[1] ? parts[1].trim() : ''
          };
        });
        const liveNews = parsedNews.filter(n => n.status && n.status.toLowerCase() === 'published');
        
        liveNews.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return b.is_pinned - a.is_pinned;
          return new Date(b.date_posted) - new Date(a.date_posted);
        });
        setAnnouncements(liveNews.slice(0, 3)); 

        setDocuments(docsRes.data.data || []);

        const userRequests = reqRes.data.data || [];
        const pendingCount = userRequests.filter(r => ['Pending', 'For Verification', 'For Payment', 'Processing'].includes(r.request_status)).length;
        const completedCount = userRequests.filter(r => ['Ready for Pickup', 'Issued'].includes(r.request_status)).length;
        
        setStats({ pending: pendingCount, completed: completedCount });

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" color="#0f172a" gutterBottom>
          Welcome, {firstName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your document requests and track their status here.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        
        {/* ==========================================
            LEFT COLUMN: Main Actions & Documents
            ========================================== */}
        <Grid item xs={12} md={8}>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ 
                p: 3, height: '100%', borderRadius: 3, 
                bgcolor: '#1d4ed8', color: 'white',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(29, 78, 216, 0.4)'
              }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Need a Document?</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  Start a new request for barangay clearance, indigency, and more.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddCircleIcon />}
                  onClick={() => navigate('/resident/requests')}
                  sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 'bold', '&:hover': { bgcolor: '#059669' } }}
                >
                  New Request
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff7ed', color: '#ea580c' }}>
                  <AccessTimeFilledIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="900" color="#0f172a">{stats.pending}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">Pending<br/>Requests</Typography>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={3}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf5', color: '#10b981' }}>
                  <CheckCircleIcon fontSize="large" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight="900" color="#0f172a">{stats.completed}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight="bold">Completed<br/>Documents</Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <DescriptionIcon color="primary" /> Available Documents
            </Typography>

            <Grid container spacing={2}>
              {documents.map((doc) => (
                <Grid item xs={12} sm={6} key={doc.doc_type_id}>
                  <Card elevation={0} sx={{ 
                    border: '1px solid #e2e8f0', borderRadius: 2, transition: '0.2s',
                    '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' }
                  }}>
                    <CardContent sx={{ p: 2.5, pb: "20px !important" }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FileCopyOutlinedIcon fontSize="small" sx={{ color: '#64748b' }} />
                          {doc.type_name}
                        </Typography>
                        <Chip 
                          label={doc.base_fee > 0 ? `₱${doc.base_fee}` : "FREE"} 
                          size="small" 
                          sx={{ bgcolor: doc.base_fee > 0 ? '#eff6ff' : '#ecfdf5', color: doc.base_fee > 0 ? '#1d4ed8' : '#047857', fontWeight: 'bold' }} 
                        />
                      </Box>
                      <Divider sx={{ my: 1.5 }} />
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 18, color: '#3b82f6', mt: 0.2 }} />
                        <Box>
                          <Typography variant="caption" fontWeight="bold" color="#475569" display="block">
                            Requirements:
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                            {doc.requirements || "No specific requirements listed. Proceed to request."}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {documents.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ width: '100%', textAlign: 'center', py: 3 }}>
                  No documents currently available.
                </Typography>
              )}
            </Grid>
          </Paper>

        </Grid>


        {/* ==========================================
            RIGHT COLUMN: Mini Bulletin Board
            ========================================== */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', overflow: 'hidden', height: '100%' 
          }}>
            <Box sx={{ bgcolor: '#f8fafc', p: 3, borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CampaignIcon sx={{ color: '#dc2626' }} /> Community Advisories
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Latest updates from the barangay hall.
              </Typography>
            </Box>

            {announcements.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No active announcements.</Typography>
              </Box>
            ) : (
              <Stack divider={<Divider />}>
                {announcements.map((news) => (
                  <Box 
                    key={news.announcement_id} 
                    onClick={() => setSelectedAdvisory(news)}
                    sx={{ 
                      p: 3, cursor: 'pointer', transition: 'all 0.2s', 
                      '&:hover': { bgcolor: '#eff6ff' } 
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      {news.is_pinned === 1 ? (
                        <Chip label="Priority" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold' }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                          {new Date(news.date_posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ lineHeight: 1.3, mb: 1 }}>
                      {news.title}
                    </Typography>

                    <Typography variant="body2" color="#475569" sx={{ 
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 
                    }}>
                      {news.display_text}
                    </Typography>
                    
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* THE ADVISORY POPUP MODAL */}
      <Dialog 
        open={Boolean(selectedAdvisory)} 
        onClose={() => setSelectedAdvisory(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedAdvisory && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, pt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                COMMUNITY ADVISORY
              </Typography>
              <IconButton onClick={() => setSelectedAdvisory(null)} size="small" sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 4 }}>
              
              {/* 📸 ALWAYS SHOW A PICTURE (Uses uploaded image, or a nice default fallback!) */}
              <CardMedia 
                component="img" 
                image={selectedAdvisory.image_path || 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=800&auto=format&fit=crop'} 
                alt="Advisory Image"
                sx={{ borderRadius: 2, mb: 3, maxHeight: 300, objectFit: 'cover', width: '100%', bgcolor: '#f1f5f9' }} 
              />

              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                 {selectedAdvisory.is_pinned === 1 && <Chip label="Priority" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 'bold', borderRadius: 1 }} />}
                 <Typography variant="caption" color="text.secondary" fontWeight="bold">
                   POSTED: {new Date(selectedAdvisory.date_posted).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                 </Typography>
              </Box>

              <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ lineHeight: 1.2, mb: 3 }}>
                {selectedAdvisory.title}
              </Typography>

              <Typography variant="body1" color="#475569" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, mb: 4 }}>
                {selectedAdvisory.display_text}
              </Typography>

              {selectedAdvisory.external_link && (
                <Button 
                  variant="outlined" 
                  disableElevation 
                  endIcon={<OpenInNewIcon />} 
                  href={formatUrl(selectedAdvisory.external_link)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  sx={{ textTransform: 'none', fontWeight: 'bold', borderRadius: 2, borderColor: '#cbd5e1', color: '#0f172a', width: '100%' }}
                >
                  Read Full Details or Access Link
                </Button>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>

      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
}