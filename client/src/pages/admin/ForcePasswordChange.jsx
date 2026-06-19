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
  // FIX: Added 'current' to hold the temporary password the Super Admin gave them
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSecurity = async () => {
      try {
        const response = await api.get('/admin/profile/security-check');
        // Only prompt if the database says 'mustChange' is true
        // and ignore it for 'Resident' role (though Residents usually use different layouts)
        if (response.data.mustChange && response.data.role !== 'Resident') {
          setOpen(true);
        }
      } catch (err) {
        console.error("Security check failed:", err);
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
      return setError('Please enter your temporary/current password.');
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
      // FIX: This now hits your EXISTING Endpoint 43 in server.js perfectly!
      await api.put('/admin/profile/password', { 
        current_password: passwords.current, 
        new_password: passwords.new 
      });

      showSnackbar("Password updated successfully. Your session is now secured.", "success");
      
      setTimeout(() => {
        setOpen(false);
      }, 1500);

    } catch (err) {
      console.error("Password change error:", err);
      // This will catch the 'Incorrect current password' error from your server.js
      setError(err.response?.data?.error || 'Failed to update password. Check your temporary password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      disableEscapeKeyDown
      onClose={(event, reason) => {
        // Strictly prevent closing by clicking outside or pressing escape
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
          Privacy Protection
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleUpdate}>
        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              To ensure your privacy and secure the <strong>Barangay Vault</strong>, you must replace your provisioned password with a new private password.
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
                  label="Temporary / Current Password" 
                  required 
                  autoFocus
                  variant="outlined"
                  value={passwords.current} 
                  onChange={(e) => setPasswords({...passwords, current: e.target.value})} 
                  helperText="Enter the password provided by the Super Admin."
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