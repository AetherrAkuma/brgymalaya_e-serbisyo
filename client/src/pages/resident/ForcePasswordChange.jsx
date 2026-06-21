import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Typography, Stack, Alert, Box, CircularProgress 
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

export default function ForcePasswordChange() {
  const showSnackbar = useSnackbar();
  const [open, setOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const response = await api.get('/residents/me/profile');
        if (response.data?.data?.require_password_change === 1) {
          setOpen(true);
        }
      } catch (err) {
        console.error("Resident security check failed:", err);
      }
    };

    checkSecurity();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwords.current) {
      return setError('Please enter your current temporary password.');
    }
    if (passwords.new.length < 8) {
      return setError('New password must be at least 8 characters long.');
    }
    if (passwords.new !== passwords.confirm) {
      return setError('Confirmation password does not match.');
    }
    if (passwords.current === passwords.new) {
      return setError('Your new password must be different from the temporary one.');
    }

    setLoading(true);
    try {
      await api.put('/residents/me/password', { 
        current_password: passwords.current, 
        new_password: passwords.new 
      });

      showSnackbar("Password updated successfully. Your account is now secured.", "success");
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (err) {
      console.error("Resident password change error:", err);
      setError(err.response?.data?.error || 'Failed to update password. Check your current temporary password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
          setOpen(false);
        }
      }} 
      PaperProps={{ 
        sx: { 
          borderRadius: 4, 
          p: 2, 
          maxWidth: 420,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
        } 
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <Box sx={{ 
          bgcolor: 'warning.light', 
          p: 2, 
          borderRadius: '50%', 
          width: 70, 
          height: 70, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mx: 'auto', 
          mb: 2 
        }}>
          <SecurityIcon color="warning" sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h5" fontWeight="900">
          Secure Your Account
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleUpdate}>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Your profile was created by a Barangay Official. To secure your account and protect your personal details, you must replace your temporary password with a new private password.
            </Typography>

            {error === 'Success' ? (
              <Alert severity="success" variant="filled">
                Password updated! Securing your session...
              </Alert>
            ) : (
              error && <Alert severity="error" variant="outlined">{error}</Alert>
            )}
            
            {error !== 'Success' && (
              <>
                <TextField 
                  fullWidth 
                  type="password" 
                  label="Temporary Password" 
                  required 
                  autoFocus
                  variant="outlined"
                  value={passwords.current} 
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                  helperText="Enter the temporary password provided to you."
                />
                <TextField 
                  fullWidth 
                  type="password" 
                  label="New Private Password" 
                  required 
                  variant="outlined"
                  value={passwords.new} 
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})} 
                />
                <TextField 
                  fullWidth 
                  type="password" 
                  label="Confirm New Password" 
                  required 
                  variant="outlined"
                  value={passwords.confirm} 
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} 
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {error !== 'Success' && (
            <>
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                size="large"
                disabled={loading} 
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VpnKeyIcon />}
                className={loading ? 'btn-loading' : ''}
                sx={{ 
                  fontWeight: 'bold', 
                  py: 1.5, 
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                {loading ? 'Processing...' : 'Set New Password'}
              </Button>
              
              <Button 
                fullWidth 
                color="error" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Cancel & Logout
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
}
