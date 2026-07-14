import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import {
  Box, Paper, Typography, Button, CircularProgress, Alert, Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

export default function VerifyEmail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(!!token);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    if (token && email) {
      const verify = async () => {
        try {
          const res = await api.post('/auth/verify-email', { token, email });
          setStatus('success');
          setAlreadyVerified(res.data.already_verified === true);
          setMessage(res.data.message || 'Email verified successfully!');
          setSearchParams({ email }, { replace: true });
        } catch (err) {
          setStatus('error');
          setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
        } finally {
          setLoading(false);
        }
      };
      verify();
    } else if (email && !token) {
      checkStatus();
    }
  }, [token, email]);

  const checkStatus = async () => {
    try {
      const res = await api.get('/auth/verify-status', { params: { email } });
      if (res.data.verified) {
        setStatus('success');
        setAlreadyVerified(true);
        setMessage('Your email has already been verified.');
      }
    } catch {
      // Silently fail — just show the default "check your email" view
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', p: 2, bgcolor: '#f8fafc'
    }}>
      <Paper elevation={0} sx={{
        maxWidth: 460, width: '100%', p: { xs: 3, sm: 5 }, borderRadius: 4,
        textAlign: 'center', border: '1px solid #e2e8f0',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        {loading ? (
          <Box sx={{ py: 6 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 3 }}>
              Verifying your email...
            </Typography>
          </Box>
        ) : status === 'success' && alreadyVerified ? (
          <>
            <InfoIcon sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#0f172a">
              Already Verified
            </Typography>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>{message}</Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip icon={<AccessTimeIcon />} label="Link expired after 1 hour" size="small" variant="outlined" color="info" />
              <Chip icon={<VpnKeyIcon />} label="One-time use only" size="small" variant="outlined" color="info" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Your account is pending approval from Barangay Officials. You will be notified once activated.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2 }}
            >
              Go to Login
            </Button>
          </>
        ) : status === 'success' && !alreadyVerified ? (
          <>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#0f172a">
              Email Verified!
            </Typography>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{message}</Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip icon={<AccessTimeIcon />} label="Link expired after 1 hour" size="small" variant="outlined" color="success" />
              <Chip icon={<VpnKeyIcon />} label="One-time use only" size="small" variant="outlined" color="success" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Your account is now pending approval from Barangay Officials. You will be notified once your account is activated.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2 }}
            >
              Go to Login
            </Button>
          </>
        ) : status === 'error' ? (
          <>
            <ErrorIcon sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#0f172a">
              Verification Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              The verification link may be invalid or expired. Please try registering again.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/register')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2, mb: 1.5 }}
            >
              Register Again
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2 }}
            >
              Go to Login
            </Button>
          </>
        ) : email ? (
          <>
            <MailOutlineIcon sx={{ fontSize: 64, color: '#3b82f6', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom color="#0f172a">
              Check Your Email
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              We sent a verification link to:
            </Typography>
            <Typography variant="body1" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
              {email}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip icon={<AccessTimeIcon />} label="Link expires in 1 hour" size="small" variant="outlined" color="primary" />
              <Chip icon={<VpnKeyIcon />} label="One-time use only" size="small" variant="outlined" color="primary" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Please check your inbox and click the verification link to activate your account. The link can only be used once and expires in 1 hour.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2 }}
            >
              Go to Login
            </Button>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No verification code provided. Please check the link you received in your email.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
