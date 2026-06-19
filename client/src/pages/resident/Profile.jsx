import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Grid, Avatar, Divider, Button, 
  Card, CardContent, Chip, Alert, CircularProgress, Stack, IconButton
} from '@mui/material';

// Modern Icons
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';

import api from '../../utils/axios';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [idLoading, setIdLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/residents/me/profile');
        setProfile(res.data.data);
      } catch (err) {
        console.error("Profile Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    let activeUrl = null;
    const fetchIdProof = async () => {
      if (profile && profile.id_proof_image) {
        setIdLoading(true);
        try {
          const response = await api.get('/residents/me/id-proof', { responseType: 'blob' });
          const url = URL.createObjectURL(response.data);
          activeUrl = url;
          setPreviewUrl(url);
        } catch (err) {
          console.error("Failed to load resident ID proof:", err);
        } finally {
          setIdLoading(false);
        }
      }
    };
    fetchIdProof();
    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [profile]);

  const handleIdUpload = async (e) => {
    if (!e.target.files[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('id_proof_image', e.target.files[0]);

    try {
      const res = await api.put('/residents/me/update-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg({ type: 'success', text: 'ID Proof successfully submitted for verification.' });
      if (res.data.filename) {
        setProfile(prev => ({ ...prev, id_proof_image: res.data.filename }));
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to upload ID. Please check the file size and try again.' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 20 }}>
      <CircularProgress size={60} />
      <Typography sx={{ mt: 2 }} color="text.secondary">Loading your secure profile...</Typography>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: { xs: 2, md: 4 }, pb: 6 }}>
      
      {/* 1. HERO HEADER SECTION */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, 
          borderRadius: 4, 
          overflow: 'hidden', 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          mb: 4
        }}
      >
        <Box sx={{ height: 120, bgcolor: 'primary.main', backgroundImage: 'linear-gradient(45deg, #0d47a1 30%, #1976d2 90%)' }} />
        <Box sx={{ px: 4, pb: 4, mt: -5, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            <Avatar 
              sx={{ 
                width: 120, height: 120, 
                border: '4px solid white', 
                bgcolor: 'secondary.main', 
                fontSize: 48,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              {profile?.first_name[0]}
            </Avatar>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h4" fontWeight="800" color="text.primary">
                {profile?.first_name} {profile?.last_name}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={profile?.account_status} 
                  size="small"
                  color={profile?.account_status === 'Active' ? 'success' : 'warning'} 
                  sx={{ fontWeight: 'bold' }} 
                />
                <Typography variant="body2" color="text.secondary">Resident ID: #{profile?.resident_id || '----'}</Typography>
              </Stack>
            </Box>
          </Box>
          <Button variant="outlined" startIcon={<EditIcon />} sx={{ borderRadius: 20, mb: 1 }}>
            Edit Profile
          </Button>
        </Box>
      </Paper>

      {msg.text && <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 3 }}>{msg.text}</Alert>}

      <Grid container spacing={3}>
        
        {/* 2. PERSONAL DETAILS CARD */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <VerifiedUserOutlinedIcon color="primary" /> Basic Information
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Stack spacing={3} sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <EmailOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                    <Typography variant="body1" fontWeight="500">{profile?.email_address}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <LocalPhoneOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Contact Number (Verified)</Typography>
                    <Typography variant="body1" fontWeight="500">{profile?.contact_number}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <HomeOutlinedIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Residential Address</Typography>
                    <Typography variant="body1" fontWeight="500">{profile?.address_street}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. VERIFICATION & SECURITY SIDEBAR */}
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            
            {/* ID Proof Status Card */}
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Verification Status</Typography>
                
                {profile?.id_proof_image ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Your registered Identity verification document is stored securely. For security and compliance, this document cannot be modified or removed.
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 3, 
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 180
                      }}
                    >
                      {idLoading ? (
                        <Box sx={{ py: 4 }}>
                          <CircularProgress size={28} />
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            Decrypting secure ID proof...
                          </Typography>
                        </Box>
                      ) : previewUrl ? (
                        <>
                          <Box sx={{ width: '100%', maxHeight: 200, display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: 2 }}>
                            {profile.id_proof_image.toLowerCase().endsWith('.pdf') || profile.id_proof_image.toLowerCase().includes('.pdf') ? (
                              <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
                                <VerifiedUserOutlinedIcon sx={{ fontSize: 48, color: 'success.main' }} />
                                <Button 
                                  variant="outlined" 
                                  size="small" 
                                  href={previewUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                  View Submitted PDF ID
                                </Button>
                              </Stack>
                            ) : (
                              <img src={previewUrl} alt="Submitted ID Proof" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: '500' }}>
                            Official ID Document Submitted
                          </Typography>
                        </>
                      ) : (
                        <Box sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Identity Document verified.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Your ID proof is required to verify your residency and process documents.
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        p: 3, 
                        border: '2px dashed', 
                        borderColor: 'primary.light', 
                        borderRadius: 3, 
                        textAlign: 'center',
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Button 
                        component="label" 
                        variant="contained" 
                        disableElevation
                        startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                        disabled={uploading}
                        sx={{ borderRadius: 2 }}
                      >
                        {uploading ? 'Processing...' : 'Upload ID Proof'}
                        <input type="file" hidden accept="image/*,application/pdf" onChange={handleIdUpload} />
                      </Button>
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        JPG, PNG or PDF (Max 5MB)
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Account Security Card */}
            <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon fontSize="small" color="primary" /> Security
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Keep your account safe by updating your password regularly.
                </Typography>
                <Button variant="text" size="small" sx={{ fontWeight: 'bold' }}>
                  Change Password
                </Button>
              </CardContent>
            </Card>

          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}