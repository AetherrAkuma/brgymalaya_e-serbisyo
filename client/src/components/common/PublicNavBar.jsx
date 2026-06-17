import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'primary.main', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          
          {/* Logo & Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box sx={{ width: 40, height: 40, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
              <Typography variant="caption" color="white" fontWeight="bold">LOGO</Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Barangay Malaya
            </Typography>
          </Box>

          {/* Login / Portal Button */}
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AccountCircleIcon />}
            onClick={() => navigate('/login')}
            sx={{ borderRadius: 20, px: 3 }}
          >
            E-Serbisyo Portal
          </Button>

        </Toolbar>
      </Container>
    </AppBar>
  );
}