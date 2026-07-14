import { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, CircularProgress, 
  Stack, Card, CardContent, Chip, LinearProgress, Button,
  Table, TableBody, TableCell, TableContainer, TableRow
} from '@mui/material';

import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import SpeedIcon from '@mui/icons-material/Speed';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

import api from '../../utils/axios';

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function SystemStatusCard({ icon, label, value, color }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ color: color || '#64748b', display: 'flex' }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
            <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role') || 'Captain';

  const fetchData = async () => {
    try {
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

  const sys = stats?.system || {};

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

  const dbOk = sys.dbStatus === 'connected';
  const mem = sys.memoryUsage || {};

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminPanelSettingsIcon fontSize="large" color="primary" /> Command Center
          </Typography>
          <Typography color="text.secondary">
            Welcome, <strong>{userRole}</strong>. 
            <Chip size="small" color={dbOk ? 'success' : 'error'} label={dbOk ? 'DB Online' : 'DB Offline'} sx={{ ml: 1, fontWeight: 700, fontSize: '0.65rem' }} />
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<HistoryIcon />} onClick={fetchData} size="small">Refresh</Button>
      </Stack>

      {/* ── Top Stats ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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

      {/* ── Performance & System Status ── */}
      <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SpeedIcon color="primary" /> Performance & System Status
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3} md={2}>
          <SystemStatusCard icon={<MemoryIcon />} label="Uptime" value={formatUptime(sys.uptime)} color="#3b82f6" />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SystemStatusCard icon={<StorageIcon />} label="DB Tables" value={sys.dbTables || '?'} color="#8b5cf6" />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SystemStatusCard icon={<PeopleIcon />} label="Residents" value={sys.totalResidents || 0} color="#10b981" />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SystemStatusCard icon={<AdminPanelSettingsIcon />} label="Officials" value={sys.totalOfficials || 0} color="#f59e0b" />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SystemStatusCard icon={<HistoryIcon />} label="Activity 24h" value={sys.activity24h || 0} color="#ec4899" />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <SystemStatusCard icon={<AssessmentIcon />} label="Node.js" value={sys.nodeVersion || '?'} color="#64748b" />
        </Grid>
      </Grid>

      {/* ── Resource Usage & DB Health Detail ── */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5, mb: 4 }}>
        <Typography variant="subtitle2" fontWeight="800" color="#0f172a" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <MemoryIcon sx={{ fontSize: 18 }} /> Resource Usage
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={1.5}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">RSS Memory</Typography>
                  <Typography variant="caption" fontWeight={700}>{bytesToMB(mem.rss)} MB</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min((mem.rss || 0) / (1024*1024*1024) * 100, 100)} sx={{ height: 6, borderRadius: 3 }} />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">Heap Used</Typography>
                  <Typography variant="caption" fontWeight={700}>{bytesToMB(mem.heapUsed)} MB</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min((mem.heapUsed || 0) / (mem.heapTotal || 1) * 100, 100)} color="warning" sx={{ height: 6, borderRadius: 3 }} />
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">DB Status</Typography>
                    </TableCell>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Chip size="small" icon={dbOk ? <CheckCircleIcon /> : <ErrorIcon />}
                        color={dbOk ? 'success' : 'error'}
                        label={dbOk ? `Connected (${sys.dbTables} tables)` : `Error: ${sys.dbError}`}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Platform</Typography>
                    </TableCell>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography variant="caption" fontWeight={500}>{sys.platform || 'N/A'}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Server Time</Typography>
                    </TableCell>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography variant="caption" fontWeight={500}>{new Date().toLocaleString()}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}


