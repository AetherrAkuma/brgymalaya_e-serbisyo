import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios'; 
import { 
  Box, Grid, Typography, TextField, Button, Link, InputAdornment, 
  IconButton, Alert, MenuItem, Stack, Paper, Divider
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoginIcon from '@mui/icons-material/Login';
import HowToRegIcon from '@mui/icons-material/HowToReg';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', date_of_birth: '',
    civil_status: 'Single', address_street: '',
    contact_number: '', email_address: '', password: ''
  });

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLoginView) {
        const response = await api.post('/auth/login', {
          email_or_username: formData.email_address,
          password: formData.password
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('first_name', response.data.first_name); 
        
        // --- SECURE PASSWORD FLAG ---
        // Catches the flag sent by server.js for newly created officials
        if (response.data.mustChange) {
          localStorage.setItem('mustChange', 'true');
        } else {
          localStorage.setItem('mustChange', 'false');
        }
        
        if (response.data.role === 'Resident') {
          navigate('/resident/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        const response = await api.post('/auth/resident/register', formData);
        setSuccess(response.data.message);
        setTimeout(() => setIsLoginView(true), 3000); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
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
        width: { md: '50%', lg: '60%' },
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
        ml: { xs: 0, md: '50%', lg: '60%' }, 
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
          animation: 'fadeInUp 0.6s ease-out'
        }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
              {isLoginView ? 'Welcome Back' : 'Join Our Community'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isLoginView 
                ? 'Access your account to manage your document requests.' 
                : 'Fill in the details below to register for the E-Serbisyo portal.'}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              
              {!isLoginView && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="First Name" name="first_name" onChange={handleChange} variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth label="Last Name" name="last_name" onChange={handleChange} variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField required fullWidth type="date" label="Birthday" name="date_of_birth" InputLabelProps={{ shrink: true }} onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select required fullWidth label="Status" name="civil_status" value={formData.civil_status} onChange={handleChange}>
                      {['Single', 'Married', 'Widowed', 'Divorced'].map((option) => (
                        <MenuItem key={option} value={option}>{option}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField required fullWidth label="Contact Number" name="contact_number" onChange={handleChange} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField required fullWidth label="Complete Address" name="address_street" onChange={handleChange} />
                  </Grid>
                </Grid>
              )}

              <TextField 
                required fullWidth label="Email Address" name="email_address" 
                onChange={handleChange} variant="outlined" 
              />
              
              <TextField 
                required fullWidth label="Password" name="password" 
                type={showPassword ? 'text' : 'password'} onChange={handleChange}
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

              <Button
                fullWidth type="submit" variant="contained" size="large"
                disabled={loading}
                startIcon={isLoginView ? <LoginIcon /> : <HowToRegIcon />}
                sx={{ 
                  py: 1.8, borderRadius: 2, fontWeight: 'bold', bgcolor: '#3b82f6',
                  boxShadow: 'none', mt: 2,
                  '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }
                }}
              >
                {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Register Account')}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                {isLoginView ? 'NEW TO THE PORTAL?' : 'ALREADY HAVE AN ACCOUNT?'}
              </Typography>
            </Divider>
            <Button 
                fullWidth 
                variant="outlined" 
                onClick={toggleView}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1 }}
            >
              {isLoginView ? 'Create Resident Account' : 'Back to Login'}
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