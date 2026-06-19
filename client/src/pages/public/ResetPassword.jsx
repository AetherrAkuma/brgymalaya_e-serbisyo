import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Stack, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../../utils/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !email) {
      setMsg({ type: 'error', text: 'Missing required reset token or email address.' });
      return;
    }

    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const response = await api.post('/auth/reset-password', {
        email,
        token,
        new_password: newPassword
      });

      setMsg({ type: 'success', text: response.data.message || 'Password reset successful!' });
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      setMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to reset password. The link may have expired.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Box sx={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Paper elevation={4} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 450, width: '100%', borderRadius: 3, textStyle: 'center', border: '1px solid #e2e8f0' }}>
          <Stack spacing={3} alignItems="center" textAlign="center">
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h5" fontWeight="900" color="text.primary">Password Reset Success!</Typography>
            <Typography variant="body2" color="text.secondary">
              Your password has been successfully updated. You can now log in using your new credentials.
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/login')}
              sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2, boxShadow: 'none' }}
            >
              Go to Login
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Paper elevation={4} sx={{ p: { xs: 2.5, sm: 4 }, maxWidth: 450, width: '100%', borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="text.primary" gutterBottom>
              Create New Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set a new, strong password for your E-Serbisyo account.
            </Typography>
          </Box>

          {(!token || !email) && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Invalid or incomplete password reset link. Please request a new link.
            </Alert>
          )}

          {msg && <Alert severity={msg.type} sx={{ borderRadius: 2 }}>{msg.text}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="at least 8 characters"
                required
                disabled={!token || !email || loading}
                InputProps={{
                  startAdornment: <LockOutlinedIcon color="action" sx={{ mr: 1, my: 0.5 }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="re-type new password"
                required
                disabled={!token || !email || loading}
                InputProps={{
                  startAdornment: <LockOutlinedIcon color="action" sx={{ mr: 1, my: 0.5 }} />
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!token || !email || loading}
                sx={{ 
                  py: 1.5, 
                  fontWeight: 'bold', 
                  borderRadius: 2, 
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none' }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
