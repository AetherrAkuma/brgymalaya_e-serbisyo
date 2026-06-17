import { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, CircularProgress, 
  Stack, Chip, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Recharts for Data Visualization
import { 
  PieChart, Pie, Cell, Tooltip as ChartTooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar 
} from 'recharts';

// Icons
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import api from '../../utils/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    pending: 0,
    forPayment: 0,
    processing: 0,
    ready: 0,
    totalRequests: 0,
    totalCollections: 0
  });

  // Chart States
  const [documentDemand, setDocumentDemand] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  
  const [recentRequests, setRecentRequests] = useState([]);

  // Assuming you save the official's name during login
  const adminName = localStorage.getItem('first_name') || 'Official';
  const role = localStorage.getItem('role') || 'Admin';

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch stats and the general request queue simultaneously
        const [statsRes, reqRes] = await Promise.all([
          api.get('/admin/dashboard-stats'),
          api.get('/admin/requests')
        ]);

        if (statsRes.data.status === 'success') {
          setStats(statsRes.data.data);
          setDocumentDemand(statsRes.data.data.documentDemand || []); 
          setTrendData(statsRes.data.data.trendData || []);           
        }

        if (reqRes.data.status === 'success') {
          // Take only the 5 most recent requests for the dashboard preview
          setRecentRequests(reqRes.data.data.slice(0, 5));
        }

      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  // Helper function for status colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'warning';
      case 'For Payment': return 'info';
      case 'Processing': return 'secondary';
      case 'Ready for Pickup': return 'success';
      case 'Issued': return 'default';
      case 'Rejected': return 'error';
      case 'Cancelled': return 'error';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out', pb: 5 }}>
      
      {/* HEADER SECTION */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
            Overview Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {adminName}. Here is what's happening in the barangay today.
          </Typography>
        </Box>
        <Chip label={`${role} Access`} color="primary" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
      </Box>

      {/* ==========================================
          TOP ROW: KEY METRICS
          ========================================== */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        
        {/* Needs Verification (Pending) */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fff7ed', color: '#ea580c' }}>
                <PendingActionsIcon />
              </Box>
              <Typography variant="h4" fontWeight="900" color="#0f172a">{stats.pending}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">Needs Verification</Typography>
          </Paper>
        </Grid>

        {/* For Printing/Processing */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', color: '#2563eb' }}>
                <PrintIcon />
              </Box>
              <Typography variant="h4" fontWeight="900" color="#0f172a">{stats.processing}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">For Printing</Typography>
          </Paper>
        </Grid>

        {/* Ready for Pickup */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf5', color: '#10b981' }}>
                <CheckCircleOutlineIcon />
              </Box>
              <Typography variant="h4" fontWeight="900" color="#0f172a">{stats.ready}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">Ready for Pickup</Typography>
          </Paper>
        </Grid>

        {/* Total Collections */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#faf5ff', color: '#9333ea' }}>
                <PaymentsIcon />
              </Box>
              <Typography variant="h4" fontWeight="900" color="#0f172a">
                ₱{stats.totalCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold">Total Collections</Typography>
          </Paper>
        </Grid>

      </Grid>

      {/* ==========================================
          ADMINISTRATIVE STATISTICS & CHARTS
          ========================================== */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 5 }}>
        <Typography variant="h6" fontWeight="900" color="#0f172a" sx={{ mb: 1 }}>
          Administrative Statistics & Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Live data tracking for barangay document requests and workflow efficiency.
        </Typography>

        <Grid container spacing={4}>
          
          {/* CHART 1: 7-Day Request Trend (Area Chart) */}
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              7-DAY REQUEST VOLUME
            </Typography>
            <Box sx={{ height: 300, width: '100%', bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #f1f5f9' }}>
              {trendData.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 10, color: '#94a3b8' }}>Not enough data for trend analysis.</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                    <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="count" name="Total Requests" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Grid>

          {/* CHART 2: Document Demand Breakdown (Doughnut Chart) */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              DOCUMENT DEMAND
            </Typography>
            <Box sx={{ height: 300, width: '100%', bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center' }}>
              {documentDemand.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 10, color: '#94a3b8' }}>No documents requested yet.</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentDemand}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {documentDemand.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Grid>

          {/* CHART 3: Processing Funnel (Horizontal Stacked Bar) */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
              CURRENT WORKFLOW BOTTLENECKS
            </Typography>
            <Box sx={{ height: 100, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[{
                    name: 'Active Queue', 
                    Pending: stats.pending, 
                    'Awaiting Payment': stats.forPayment, 
                    Processing: stats.processing
                  }]}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <ChartTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                  <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 0, 0, 4]} barSize={30} />
                  <Bar dataKey="Awaiting Payment" stackId="a" fill="#3b82f6" barSize={30} />
                  <Bar dataKey="Processing" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

        </Grid>
      </Paper>

      {/* ==========================================
          BOTTOM ROW: TABLES & QUICK ACTIONS
          ========================================== */}
      <Grid container spacing={4}>
        
        {/* Left Column: Recent Requests Table */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', overflow: 'hidden' }}>
            
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" /> Action Queue Preview
              </Typography>
              <Button size="small" endIcon={<ArrowForwardIosIcon fontSize="small" />} onClick={() => navigate('/admin/master-queue')}>
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Ref No.</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Resident</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Document</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No pending requests in the queue.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentRequests.map((req) => (
                      <TableRow key={req.request_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 'bold', color: '#0f172a' }}>{req.reference_no}</TableCell>
                        <TableCell>{req.first_name} {req.last_name}</TableCell>
                        <TableCell>{req.type_name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={req.request_status} 
                            color={getStatusColor(req.request_status)} 
                            size="small" 
                            sx={{ fontWeight: 'bold', borderRadius: 1 }} 
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

          </Paper>
        </Grid>

        {/* Right Column: Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%' }}>
            <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ mb: 3 }}>
              Quick Actions
            </Typography>
            
            <Stack spacing={2}>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                onClick={() => navigate('/admin/announcements')}
              >
                📢 Post New Announcement
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                onClick={() => navigate('/admin/residents')}
              >
                👥 Verify New Residents
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                sx={{ justifyContent: 'flex-start', py: 1.5, fontWeight: 'bold', borderRadius: 2 }}
                onClick={() => navigate('/admin/settings')}
              >
                ⚙️ System Settings
              </Button>
            </Stack>
          </Paper>
        </Grid>

      </Grid>

      <style>
        {`
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
}