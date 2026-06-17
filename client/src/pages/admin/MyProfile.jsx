import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, TextField, Button, 
  Avatar, Divider, Chip, Stack, Alert, CircularProgress 
} from '@mui/material';

// Icons
import SecurityIcon from '@mui/icons-material/Security';
import BadgeIcon from '@mui/icons-material/Badge';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'; // Signature Icon
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import api from '../../utils/axios';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Signature States
  const [sigPreview, setSigPreview] = useState(null);
  const [uploadingSig, setUploadingSig] = useState(false);

  const userRole = localStorage.getItem('role') || 'Official';
  const isCaptainOrSA = ['Super Admin', 'Captain'].includes(userRole);

  useEffect(() => {
    fetchProfile();
    if (isCaptainOrSA) fetchSignature();
  }, [isCaptainOrSA]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/admin/profile');
      setProfile(res.data.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const fetchSignature = async () => {
    try {
      const res = await api.get('/admin/signatures/me');
      if (res.data.data?.signature_blob) {
        // Fetch and decrypt the binary image
        const imgRes = await api.get(`/admin/view-file/${res.data.data.signature_blob}`, { responseType: 'blob' });
        setSigPreview(URL.createObjectURL(imgRes.data));
      }
    } catch (err) { console.error("Signature load error", err); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return setMessage({ type: 'error', text: 'Passwords do not match' });
    try {
      await api.put('/admin/profile/password', { current_password: passwords.current, new_password: passwords.new });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.error || 'Failed' }); }
  };

  // --- THE RAW BINARY UPLOADER ---
  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'image/png') return alert("Please upload a transparent PNG signature.");

    setUploadingSig(true);
    try {
      // Step 1: Read file as ArrayBuffer for binary transmission
      const buffer = await file.arrayBuffer();

      // Step 2: Post raw binary to match Endpoint 30's express.raw requirement
      await api.post('/admin/signatures/upload', buffer, {
        headers: { 'Content-Type': 'image/png' }
      });

      setMessage({ type: 'success', text: 'Digital Signature securely vaulted.' });
      fetchSignature(); // Refresh preview
    } catch (err) {
      alert("Upload failed. Ensure the file is a PNG under 2MB.");
    } finally {
      setUploadingSig(false);
    }
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 4, color: '#0f172a' }}>Account Settings</Typography>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem' }}>{profile?.full_name?.charAt(0)}</Avatar>
            <Typography variant="h6" fontWeight="bold">{profile?.full_name}</Typography>
            <Chip label={profile?.role} color="primary" size="small" sx={{ mt: 1, fontWeight: 'bold' }} />
            
            <Divider sx={{ my: 3 }} />

            {/* SIGNATURE VAULT (Captain/SA Only) */}
            {isCaptainOrSA && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <HistoryEduIcon fontSize="small" color="primary" /> Signature Vault
                </Typography>
                
                <Box sx={{ 
                  my: 2, p: 2, height: 120, border: '2px dashed #cbd5e1', borderRadius: 3, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc', overflow: 'hidden' 
                }}>
                  {sigPreview ? (
                    <img src={sigPreview} alt="Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">No Active Signature</Typography>
                  )}
                </Box>

                <Button 
                  component="label" variant="outlined" fullWidth size="small" 
                  disabled={uploadingSig} startIcon={uploadingSig ? <CircularProgress size={16}/> : <CloudUploadIcon />}
                >
                  {sigPreview ? 'Replace Signature' : 'Upload Signature'}
                  <input type="file" hidden accept="image/png" onChange={handleSignatureUpload} />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Requires transparent PNG</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: Forms */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}><BadgeIcon color="primary" /> Official Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name" value={profile?.full_name} InputProps={{ readOnly: true }} variant="filled" /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={profile?.email_official} InputProps={{ readOnly: true }} variant="filled" /></Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}><SecurityIcon color="primary" /> Security</Typography>
              {message.text && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>}
              <form onSubmit={handlePasswordChange}>
                <Stack spacing={3}>
                  <TextField fullWidth type="password" label="Current Password" required value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
                  <Divider />
                  <TextField fullWidth type="password" label="New Password" required value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                  <TextField fullWidth type="password" label="Confirm New Password" required value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                  <Button type="submit" variant="contained" startIcon={<VpnKeyIcon />} sx={{ alignSelf: 'flex-start', px: 4, py: 1.2, borderRadius: 2 }}>Update Password</Button>
                </Stack>
              </form>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}