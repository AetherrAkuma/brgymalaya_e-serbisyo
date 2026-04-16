import { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, CircularProgress, 
  Stack, Divider, Card, CardContent, Button, Chip
} from '@mui/material';

// Icons
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// IMPORT THE UTILITY - No more hardcoded axios
import api from '../../utils/axios';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role') || 'Captain';

  const fetchData = async () => {
    try {
      // Connects to Endpoint 24.3 in server.js
      const res = await api.get('/admin/dashboard-stats');
      setStats(res.data.data);
    } catch (err) { 
      console.error("Dashboard stats fetch error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
  );

  // Mapping to your server.js fields
  const statCards = [
    { 
      title: 'Total Collections', 
      value: `₱${stats?.totalCollections?.toLocaleString() || '0.00'}`, 
      subtitle: 'Barangay Funds Accounted',
      icon: <AccountBalanceIcon color="success" />,
      bg: '#ecfdf5'
    },
    { 
      title: 'Total Requests', 
      value: stats?.totalRequests || 0, 
      subtitle: 'All-time volume',
      icon: <AssessmentIcon color="primary" />,
      bg: '#eff6ff'
    },
    { 
      title: 'Pending Verify', 
      value: stats?.pending || 0, 
      subtitle: 'Awaiting initial check',
      icon: <WarningAmberIcon color="warning" />,
      bg: '#fff7ed'
    },
    { 
      title: 'Processing', 
      value: stats?.processing || 0, 
      subtitle: 'Currently being printed',
      icon: <TrendingUpIcon color="info" />,
      bg: '#f0f9ff'
    }
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminPanelSettingsIcon fontSize="large" color="primary" /> Command Center
          </Typography>
          <Typography color="text.secondary">Welcome, <strong>{userRole}</strong>. System status is healthy.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<HistoryIcon />} onClick={fetchData}>Refresh Data</Button>
      </Stack>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: card.bg }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  {card.icon}
                  <Box>
                    <Typography variant="h5" fontWeight="900">{card.value}</Typography>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">{card.title}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}