import { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Grid, Paper, TextField, Button, 
  Avatar, Divider, Chip, Stack, Alert, CircularProgress 
} from '@mui/material';

// Icons
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import BadgeIcon from '@mui/icons-material/Badge';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

import api from '../../utils/axios';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/admin/profile');
      setProfile(res.data.data);
    } catch (err) {
      console.error("Profile fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setMessage({ type: 'error', text: 'New passwords do not match' });
    }
    try {
      await api.put('/admin/profile/password', {
        current_password: passwords.current,
        new_password: passwords.new
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password' });
    }
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" fontWeight="800" sx={{ mb: 4, color: '#0f172a' }}>
        Account Settings
      </Typography>

      <Grid container spacing={4}>
        {/* LEFT COLUMN: Profile Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px solid #e2e8f0' }}>
            <Avatar 
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2.5rem' }}
            >
              {profile?.full_name?.charAt(0)}
            </Avatar>
            <Typography variant="h6" fontWeight="bold">{profile?.full_name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>@{profile?.username}</Typography>
            <Chip 
              label={profile?.role} 
              color="primary" 
              size="small" 
              sx={{ mt: 1, fontWeight: 'bold', textTransform: 'uppercase' }} 
            />
            <Divider sx={{ my: 3 }} />
            <Stack spacing={1} sx={{ textAlign: 'left' }}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">OFFICIAL ID</Typography>
              <Typography variant="body2" fontWeight="500">{profile?.official_id}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mt: 1 }}>ACCOUNT STATUS</Typography>
              <Typography variant="body2" color="success.main" fontWeight="bold">{profile?.account_status}</Typography>
            </Stack>
          </Paper>
        </Grid>

        {/* RIGHT COLUMN: Forms */}
        <Grid item xs={12} md={8}>
          <Stack spacing={4}>
            
            {/* PERSONAL INFO CARD */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BadgeIcon color="primary" /> Official Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Full Name" value={profile?.full_name} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Official Email" value={profile?.email_official} InputProps={{ readOnly: true }} variant="filled" />
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Official identity details are managed by the Super Admin. Please contact them for corrections.
                  </Alert>
                </Grid>
              </Grid>
            </Paper>

            {/* SECURITY CARD */}
            <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" /> Security & Password
              </Typography>
              
              {message.text && (
                <Alert severity={message.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setMessage({ type: '', text: '' })}>
                  {message.text}
                </Alert>
              )}

              <form onSubmit={handlePasswordChange}>
                <Stack spacing={3}>
                  <TextField 
                    fullWidth type="password" label="Current Password" required
                    value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                  />
                  <Divider />
                  <TextField 
                    fullWidth type="password" label="New Password" required
                    value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                  />
                  <TextField 
                    fullWidth type="password" label="Confirm New Password" required
                    value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                  />
                  <Button 
                    type="submit" variant="contained" 
                    startIcon={<VpnKeyIcon />} 
                    sx={{ alignSelf: 'flex-start', px: 4, py: 1.2, borderRadius: 2, fontWeight: 'bold' }}
                  >
                    Update Password
                  </Button>
                </Stack>
              </form>
            </Paper>

          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}