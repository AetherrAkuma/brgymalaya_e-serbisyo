import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import QrCodeIcon from '@mui/icons-material/QrCode';

export default function PublicNavbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'primary.main', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 52, sm: 64 }, px: { xs: 2, sm: 0 } }}>
          
          {/* Logo & Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, bgcolor: 'primary.main', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: { xs: 1, sm: 2 } }}>
              <Typography sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} color="white" fontWeight="bold">LOGO</Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Barangay Malaya
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 } }}>
            {/* Verify Document Button */}
            <Button 
              variant="outlined" 
              color="primary" 
              startIcon={<QrCodeIcon />}
              onClick={() => navigate('/verify')}
              sx={{ 
                borderRadius: 20, 
                px: { xs: 1.5, sm: 3 }, 
                py: { xs: 0.5, sm: 1 }, 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inline-flex' } }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Verify</Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Verify QR Code</Box>
            </Button>

            {/* Login / Portal Button */}
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AccountCircleIcon />}
              onClick={() => navigate('/login')}
              sx={{ 
                borderRadius: 20, 
                px: { xs: 1.5, sm: 3 }, 
                py: { xs: 0.5, sm: 1 }, 
                fontWeight: 'bold',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiButton-startIcon': { display: { xs: 'none', sm: 'inline-flex' } }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Portal</Box>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>E-Serbisyo Portal</Box>
            </Button>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}