import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Link, Stack, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import api from '../../utils/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMsg(null);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMsg({ type: 'success', text: response.data.message || 'Password reset link sent successfully.' });
    } catch (err) {
      console.error(err);
      setMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to send password reset request. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '80vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        px: 2 
      }}
    >
      <Paper 
        elevation={4} 
        sx={{ 
          p: 4, 
          maxWidth: 450, 
          width: '100%', 
          borderRadius: 3, 
          bgcolor: 'white',
          border: '1px solid #e2e8f0'
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/login')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <ArrowBackIcon fontSize="small" /> Back to Login
            </Link>
          </Box>

          <Box text-align="center">
            <Typography variant="h5" fontWeight="900" color="text.primary" gutterBottom>
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your registered email address and we'll send you instructions to reset your password.
            </Typography>
          </Box>

          {msg && <Alert severity={msg.type} sx={{ borderRadius: 2 }}>{msg.text}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter your registered email"
                required
                InputProps={{
                  startAdornment: (
                    <MailOutlineIcon color="action" sx={{ mr: 1, my: 0.5 }} />
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  fontWeight: 'bold', 
                  borderRadius: 2, 
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' } 
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
