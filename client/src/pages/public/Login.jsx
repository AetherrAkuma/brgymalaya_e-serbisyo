import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios'; // Import our secure bridge
import { 
  Box, Grid, Typography, TextField, Button, Link, InputAdornment, IconButton, Alert, MenuItem
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // UI Feedback State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Data State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    civil_status: 'Single',
    address_street: '',
    contact_number: '',
    email_address: '',
    password: ''
  });

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLoginView) {
        // --- LOGIN LOGIC ---
        // --- LOGIN LOGIC ---
        const response = await api.post('/auth/login', {
          email_or_username: formData.email_address,
          password: formData.password
        });
        
        // Save token, role, and the newly added first_name
        // Save token, role, and the newly added first_name
        const userRole = response.data.role;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', userRole);
        localStorage.setItem('first_name', response.data.first_name); 
        
        // SMART ROUTING: Send users to their correct portal
        if (userRole === 'Resident') {
          navigate('/resident/dashboard');
        } else {
          // If they are a Super Admin, Secretary, or Treasurer:
          navigate('/admin/dashboard');
        }

      } else {
        // --- REGISTRATION LOGIC ---
        const response = await api.post('/auth/resident/register', formData);
        setSuccess(response.data.message); // "Registration successful. Please wait for Admin verification."
        
        // Clear form and switch to login view
        setTimeout(() => setIsLoginView(true), 3000); 
      }
    } catch (err) {
      // ADD THIS LINE:
      console.log("FULL ERROR OBJECT:", err.response); 
      
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <Grid container component="main" sx={{ minHeight: '100vh', m: 0, p: 0 }}>
      
      {/* LEFT SIDE: Branding Panel */}
      <Grid item xs={false} sm={4} md={7} sx={{
          bgcolor: 'primary.main',
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
          display: { xs: 'none', sm: 'flex' }, 
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', px: 4, textAlign: 'center',
        }}>
        <Box sx={{ width: 120, height: 120, bgcolor: 'white', borderRadius: '50%', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <Typography variant="h5" color="primary.main" fontWeight="bold">LOGO</Typography>
        </Box>
        <Typography variant="h2" gutterBottom fontWeight="bold">Barangay Malaya</Typography>
        <Typography variant="h6" sx={{ fontWeight: 300, opacity: 0.9 }}>
          E-Serbisyo: Document Request & Verification System
        </Typography>
      </Grid>

      {/* RIGHT SIDE: The Form Panel */}
      <Grid item xs={12} sm={8} md={5} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'background.paper' }}>
        <Box sx={{ width: '100%', maxWidth: 450, px: { xs: 4, sm: 6, md: 8 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
            {isLoginView ? 'Account Login' : 'Register Account'}
          </Typography>

          {/* Error and Success Alerts */}
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            
            {/* REGISTRATION FIELDS */}
            {!isLoginView && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth label="First Name" name="first_name" onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth label="Last Name" name="last_name" onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField required fullWidth type="date" label="Date of Birth" name="date_of_birth" InputLabelProps={{ shrink: true }} onChange={handleChange} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select required fullWidth label="Civil Status" name="civil_status" value={formData.civil_status} onChange={handleChange}>
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

            {/* SHARED LOGIN/REGISTER FIELDS */}
            <TextField margin="normal" required fullWidth label="Email Address" name="email_address" onChange={handleChange} />
            <TextField margin="normal" required fullWidth label="Password" name="password" type={showPassword ? 'text' : 'password'} onChange={handleChange}
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

            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 4, mb: 2, py: 1.5 }}>
              {isLoginView ? 'Log In' : 'Submit Registration'}
            </Button>

            <Grid container justifyContent="center">
              <Grid item>
                <Link component="button" variant="body2" onClick={(e) => { e.preventDefault(); toggleView(); }}>
                  {isLoginView ? "Don't have an account? Register Here" : "Already have an account? Log In"}
                </Link>
              </Grid>
            </Grid>
            
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}