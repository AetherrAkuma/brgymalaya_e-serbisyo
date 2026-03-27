import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Grid, Paper, Typography, CircularProgress, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button
} from '@mui/material';

// Modern Icons
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PaymentsIcon from '@mui/icons-material/Payments';
import PrintIcon from '@mui/icons-material/Print';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import api from '../../utils/axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Retrieve role to conditionally render financial widgets
  const userRole = localStorage.getItem('role') || 'Official';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Top-Level Stats
        const statsRes = await api.get('/admin/dashboard-stats');
        setStats(statsRes.data.data);

        // Fetch Recent Requests for the Activity Table (Limit to 5)
        const reqRes = await api.get('/admin/requests');
        // Sort by date (newest first) and grab the top 5
        const sortedDocs = reqRes.data.data.sort((a, b) => new Date(b.date_requested) - new Date(a.date_requested));
        setRecentRequests(sortedDocs.slice(0, 5));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    const colors = { 'Pending': 'warning', 'For Payment': 'info', 'Processing': 'primary', 'Ready for Pickup': 'success', 'Rejected': 'error' };
    return colors[status] || 'default';
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
        Barangay Operations Overview
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Real-time statistics for document processing and financial collections.
      </Typography>

      {/* TOP STATS WIDGETS */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        
        {/* Widget 1: Pending Verification */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, borderLeft: '5px solid', borderColor: 'warning.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.dark' }}>
              <PendingActionsIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" textTransform="uppercase">Needs Verification</Typography>
              <Typography variant="h4" fontWeight="900">{stats?.pending}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Widget 2: Awaiting Payment */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, borderLeft: '5px solid', borderColor: 'info.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: 'info.light', borderRadius: 2, color: 'info.dark' }}>
              <PaymentsIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" textTransform="uppercase">Awaiting Payment</Typography>
              <Typography variant="h4" fontWeight="900">{stats?.forPayment}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Widget 3: Processing / Printing */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, borderLeft: '5px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.dark' }}>
              <PrintIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight="bold" textTransform="uppercase">In Processing</Typography>
              <Typography variant="h4" fontWeight="900">{stats?.processing}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Widget 4: Total Revenue (Highlighted for Treasurer) */}
        {['Treasurer', 'Super Admin', 'Captain'].includes(userRole) && (
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                <AccountBalanceWalletIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold" textTransform="uppercase" sx={{ opacity: 0.9 }}>Total Revenue</Typography>
                <Typography variant="h4" fontWeight="900">₱{stats?.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* RECENT ACTIVITY TABLE */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="white" fontWeight="bold">Recent Transactions</Typography>
          <Button 
            variant="contained" 
            size="small" 
            endIcon={<ArrowForwardIcon />} 
            onClick={() => navigate('/admin/requests')}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
          >
            View Full Queue
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Tracking No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Resident</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentRequests.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No recent activity.</TableCell></TableRow>
              ) : (
                recentRequests.map((req) => (
                  <TableRow key={req.request_id} hover>
                    <TableCell fontWeight="bold" color="primary.main">{req.reference_no}</TableCell>
                    <TableCell>{req.first_name} {req.last_name}</TableCell>
                    <TableCell>{req.type_name}</TableCell>
                    <TableCell>{new Date(req.date_requested).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={req.request_status} color={getStatusColor(req.request_status)} size="small" sx={{ fontWeight: 'bold' }} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}