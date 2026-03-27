import { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, CircularProgress, 
  Stack, Divider, Card, CardContent 
} from '@mui/material';

// Icons
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import api from '../../utils/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role') || 'Official';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard-stats');
        setStats(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  // ROLE-SPECIFIC GUIDANCE
  const getRoleGuidance = () => {
    switch(userRole) {
      case 'Captain': return "As Captain, your priority is Final Approval and system oversight. Ensure all processed documents are legitimate.";
      case 'Secretary': return "Your priority is Resident Verification. Check new registrations and incoming document requests for accuracy.";
      case 'Treasurer': return "Your priority is the Collection Desk. Ensure all 'For Payment' requests have valid OR numbers recorded.";
      case 'Admin': return "You are currently assisting in Request Processing. Move approved requests into the 'Ready for Pickup' stage.";
      default: return "Select a module from the sidebar to begin your official duties.";
    }
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 4 }}>
      {/* ROLE INFORMATION HEADER */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <InfoOutlinedIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight="800" color="#1e3a8a">
              Official Duty: {userRole}
            </Typography>
            <Typography variant="body2" color="#3b82f6" fontWeight="500">
              {getRoleGuidance()}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Correct Numbers Section */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary" variant="overline" fontWeight="700">Pending Verify</Typography>
                <AssignmentLateIcon color="warning" />
              </Stack>
              <Typography variant="h3" fontWeight="900">{stats?.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary" variant="overline" fontWeight="700">Awaiting Pay</Typography>
                <HowToRegIcon color="info" />
              </Stack>
              <Typography variant="h3" fontWeight="900">{stats?.forPayment}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary" variant="overline" fontWeight="700">Ready Pickup</Typography>
                <CheckCircleOutlineIcon color="success" />
              </Stack>
              <Typography variant="h3" fontWeight="900">{stats?.ready}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* TRUST & ACCOUNTABILITY CARD (Only for Finance/Leadership) */}
        {['Treasurer', 'Captain', 'Super Admin'].includes(userRole) && (
          <Grid item xs={12} md={3}>
            <Card sx={{ borderRadius: 3, bgcolor: '#0f172a', color: 'white', boxShadow: 'none' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="overline" fontWeight="700" sx={{ opacity: 0.8 }}>Total Collections</Typography>
                  <AccountBalanceIcon sx={{ color: '#3b82f6' }} />
                </Stack>
                <Typography variant="h4" fontWeight="900">
                  ₱{stats?.totalCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>Public Funds Accountable</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* SYSTEM OVERVIEW */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
           <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="h6" fontWeight="800" gutterBottom>Administrative Statistics</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                This portal has processed a total of <strong>{stats?.totalRequests}</strong> requests since system launch. 
                Document data is encrypted and handled in compliance with Data Privacy standards.
              </Typography>
           </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}