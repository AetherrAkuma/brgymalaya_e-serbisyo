import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Chip, 
  Stack, Divider, Paper, CircularProgress, IconButton, Dialog, 
  DialogTitle, DialogContent, CardMedia, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import DescriptionIcon from '@mui/icons-material/Description';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

import api from '../../utils/axios';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0 });
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
        setStats({ pending: pendingCount, completed: completedCount, total: userRequests.length });

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

  const resolveImageUrl = (imgPath) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '');
    return `${base}${imgPath}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: '#3b82f6' }} />
        <Typography variant="body2" color="text.secondary" sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Loading your dashboard...</Typography>
        <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 1, md: 0 } }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes countIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <Box sx={{ mb: 4, animation: 'fadeUp 0.5s ease-out' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Avatar sx={{ bgcolor: '#3b82f6', width: 44, height: 44, fontWeight: 'bold', fontSize: '1.2rem' }}>
            {firstName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="800" color="#0f172a" sx={{ lineHeight: 1.2 }}>
              Welcome back, {firstName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Here's your barangay request overview.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Box sx={{ animation: 'fadeUp 0.5s ease-out 0.1s both' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <Paper elevation={0} sx={{
                    p: 3, borderRadius: 3, height: '100%',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    color: 'white', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', position: 'relative', overflow: 'hidden'
                  }}>
                    <RocketLaunchIcon sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 100, opacity: 0.1 }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight="700" sx={{ opacity: 0.9, mb: 0.5 }}>
                        E-SERBISYO PORTAL
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                        Request barangay documents online — clearance, indigency, and more.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained" size="large"
                      startIcon={<AddCircleIcon />}
                      onClick={() => navigate('/resident/wizard')}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', fontWeight: 'bold', borderRadius: 2, textTransform: 'none', alignSelf: 'flex-start', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                    >
                      New Request
                    </Button>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3.5}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#fff7ed', width: 36, height: 36 }}>
                        <AccessTimeFilledIcon sx={{ color: '#ea580c', fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ lineHeight: 1, animation: 'countIn 0.4s ease-out 0.3s both' }}>
                          {stats.pending}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">Pending</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Awaiting review or payment
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} sm={3.5}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, height: '100%', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#ecfdf5', width: 36, height: 36 }}>
                        <CheckCircleIcon sx={{ color: '#10b981', fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ lineHeight: 1, animation: 'countIn 0.4s ease-out 0.4s both' }}>
                          {stats.completed}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600">Completed</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Ready or already issued
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ animation: 'fadeUp 0.5s ease-out 0.2s both' }}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon sx={{ color: '#3b82f6', fontSize: 22 }} /> Available Documents
                  </Typography>
                  {documents.length > 0 && (
                    <Chip
                      label={`${documents.length} Services Online`}
                      size="small"
                      sx={{ fontWeight: 'bold', bgcolor: '#ecfdf5', color: '#047857', borderRadius: 1 }}
                    />
                  )}
                </Box>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={2}>
                    {documents.map((doc) => (
                      <Grid item xs={12} sm={6} key={doc.doc_type_id}>
                        <Card elevation={0} sx={{
                          border: '1px solid #e2e8f0', borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': { borderColor: '#3b82f6', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' }
                        }}>
                          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Typography variant="subtitle2" fontWeight="700" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ReceiptLongOutlinedIcon sx={{ color: '#64748b', fontSize: 18 }} />
                                {doc.type_name}
                              </Typography>
                              <Chip
                                label={doc.base_fee > 0 ? `₱${doc.base_fee}` : "FREE"}
                                size="small"
                                sx={{ height: 22, fontSize: '0.7rem', bgcolor: doc.base_fee > 0 ? '#eff6ff' : '#ecfdf5', color: doc.base_fee > 0 ? '#1d4ed8' : '#047857', fontWeight: '700' }}
                              />
                            </Box>
                            <Divider sx={{ mb: 1.5 }} />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <InfoOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8', mt: 0.3, flexShrink: 0 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                {doc.requirements || "No specific requirements listed."}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                    {documents.length === 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                          No documents currently available.
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Paper>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ animation: 'slideInRight 0.5s ease-out 0.3s both', height: '100%' }}>
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CampaignIcon sx={{ color: '#dc2626', fontSize: 22 }} /> Advisories
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest from the barangay hall.
                </Typography>
              </Box>

              {announcements.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <CampaignIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1.5 }} />
                  <Typography variant="body2" color="text.secondary">No active announcements.</Typography>
                </Box>
              ) : (
                <Stack divider={<Divider />} sx={{ flexGrow: 1 }}>
                  {announcements.map((news) => (
                    <Box
                      key={news.announcement_id}
                      onClick={() => setSelectedAdvisory(news)}
                      sx={{
                        p: 2.5, cursor: 'pointer', transition: 'all 0.15s ease',
                        '&:hover': { bgcolor: '#f1f5f9' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        {news.is_pinned === 1 ? (
                          <Chip label="PRIORITY" size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#fee2e2', color: '#991b1b', fontWeight: '800' }} />
                        ) : (
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ fontSize: '0.65rem' }}>
                            {new Date(news.date_posted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight="700" color="#0f172a" sx={{ lineHeight: 1.3, mb: 0.5 }}>
                        {news.title}
                      </Typography>
                      <Typography variant="caption" color="#64748b" sx={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5
                      }}>
                        {news.display_text}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <Dialog open={Boolean(selectedAdvisory)} onClose={() => setSelectedAdvisory(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
              {resolveImageUrl(selectedAdvisory.image_path) ? (
                <CardMedia
                  component="img"
                  image={resolveImageUrl(selectedAdvisory.image_path)}
                  alt="Advisory Image"
                  sx={{ borderRadius: 2, mb: 3, maxHeight: 300, objectFit: 'cover', width: '100%', bgcolor: '#f1f5f9' }}
                />
              ) : null}
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
                  Read Full Details
                </Button>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}