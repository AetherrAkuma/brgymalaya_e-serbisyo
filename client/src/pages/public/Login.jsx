import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios'; 
import { 
  Box, Grid, Typography, TextField, Button, Link, InputAdornment, 
  IconButton, Alert, MenuItem, Stack, Paper, Divider, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockStatus, setBlockStatus] = useState(null); // null | 'Blocked' | 'Pending'
  const [rejectionReason, setRejectionReason] = useState('');

  const [formData, setFormData] = useState({
    email_address: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBlockStatus(null);
    setRejectionReason('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email_or_username: formData.email_address,
        password: formData.password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('first_name', response.data.first_name); 
      
      if (response.data.role === 'Resident') {
        navigate('/resident/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.account_status === 'Blocked') {
        setBlockStatus('Blocked');
        setRejectionReason(data?.rejection_reason || '');
      } else if (data?.account_status === 'Pending') {
        setBlockStatus('Pending');
      } else {
        setError(data?.message || 'Invalid email/username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'white' }}>
      
      {/* --- LEFT SIDE: THE IMMERSIVE BLUE BRAND AREA --- */}
      <Box sx={{ 
        flex: { xs: 0, md: 1.2, lg: 1.5 }, 
        bgcolor: '#0f172a', // Deep Civic Navy
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        px: 8,
        position: 'fixed', // Keep it sticky
        top: 0, bottom: 0, left: 0,
        width: { md: '45%', lg: '50%' },
        color: 'white',
        zIndex: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 2, animation: 'fadeInLeft 0.8s ease-out' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
            <VerifiedUserIcon sx={{ color: '#3b82f6', fontSize: 40 }} />
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: 1 }}>
              E-SERBISYO
            </Typography>
          </Stack>
          
          <Typography variant="h2" fontWeight="800" sx={{ mb: 3, lineHeight: 1.1 }}>
            Barangay Malaya <br/>
            <span style={{ color: '#3b82f6' }}>Digital Portal.</span>
          </Typography>
          
          <Typography variant="h6" sx={{ color: '#94a3b8', maxWidth: '500px', fontWeight: 300, mb: 6 }}>
            Request documents, view community announcements, and manage your official records with ease.
          </Typography>

          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/')}
            sx={{ color: '#94a3b8', textTransform: 'none', '&:hover': { color: 'white' } }}
          >
            Back to Public Homepage
          </Button>
        </Box>
      </Box>

      {/* --- RIGHT SIDE: THE SCROLLABLE FORM CONTAINER --- */}
      <Box sx={{ 
        flex: 1, 
        ml: { xs: 0, md: '45%', lg: '50%' }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 8, px: { xs: 3, md: 6 },
        bgcolor: '#f8fafc' 
      }}>
        <Paper elevation={0} sx={{ 
          width: '100%', 
          maxWidth: '500px', 
          p: { xs: 3, md: 5 }, 
          borderRadius: 4,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          animation: 'fadeInUp 0.6s ease-out',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your account to manage your document requests.
            </Typography>
          </Box>

          {/* Generic error (wrong password, etc.) */}
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {/* Pending account notice */}
          {blockStatus === 'Pending' && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={false}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>⏳ Account Pending Verification</Typography>
              <Typography variant="body2">
                Your registration is still being reviewed by the Barangay. You will receive an email notification once your account is activated.
              </Typography>
            </Alert>
          )}

          {/* Blocked / Rejected account notice */}
          {blockStatus === 'Blocked' && (
            <Box sx={{ mb: 3, p: 2.5, borderRadius: 2, bgcolor: '#fff1f2', border: '1px solid #fecdd3' }}>
              <Typography variant="subtitle2" fontWeight="900" color="#be123c" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                ❌ Registration Rejected
              </Typography>
              <Typography variant="body2" color="#9f1239" sx={{ mb: rejectionReason ? 1.5 : 0 }}>
                Your registration application was not approved by the Barangay.
              </Typography>
              {rejectionReason && (
                <Box sx={{ p: 1.5, bgcolor: '#fff', border: '1px solid #fecdd3', borderRadius: 1.5 }}>
                  <Typography variant="caption" fontWeight="bold" color="#be123c" display="block" sx={{ mb: 0.3, textTransform: 'uppercase', fontSize: '0.65rem' }}>Reason from Barangay:</Typography>
                  <Typography variant="body2" color="#7f1d1d" fontStyle="italic">"{rejectionReason}"</Typography>
                </Box>
              )}
              <Typography variant="caption" color="#9f1239" display="block" sx={{ mt: 1.5 }}>
                For assistance, please visit the Barangay Hall in person.
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              
              <TextField 
                required fullWidth label="Email Address or Username" name="email_address" 
                value={formData.email_address} onChange={handleChange} variant="outlined" 
              />
              
              <TextField 
                required fullWidth label="Password" name="password" 
                value={formData.password} type={showPassword ? 'text' : 'password'} onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box display="flex" justifyContent="flex-end" sx={{ mt: -1 }}>
                <Link 
                  component="button" 
                  variant="body2" 
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  sx={{ textDecoration: 'none', fontWeight: '500', color: 'primary.main' }}
                >
                  Forgot Password?
                </Link>
              </Box>

              <Button
                fullWidth type="submit" variant="contained" size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                className={loading ? 'btn-loading' : ''}
                sx={{ 
                  py: 1.8, borderRadius: 2, fontWeight: 'bold', bgcolor: '#3b82f6',
                  boxShadow: 'none', mt: 2,
                  '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }
                }}
              >
                {loading ? 'Processing...' : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                NEW TO THE PORTAL?
              </Typography>
            </Divider>
            <Button 
                fullWidth 
                variant="outlined" 
                onClick={() => navigate('/register')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1 }}
            >
              Create Resident Account
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* --- ANIMATIONS --- */}
      <style>
        {`
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
}