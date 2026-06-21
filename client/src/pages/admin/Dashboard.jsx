import { useState, useEffect } from 'react';
import { 
  Box, Grid, Paper, Typography, CircularProgress, 
  Stack, Chip, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TextField, MenuItem, InputAdornment, Divider, IconButton
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InputIcon from '@mui/icons-material/Input';
import RateReviewIcon from '@mui/icons-material/RateReview';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import VisibilityIcon from '@mui/icons-material/Visibility';

import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    pending: 0,
    forPayment: 0,
    processing: 0,
    ready: 0,
    totalRequests: 0,
    totalCollections: 0,
    todayCollections: 0,
    weekCollections: 0,
    monthCollections: 0,
    pendingResidents: 0,
    recentPayments: []
  });

  // Chart States
  const [documentDemand, setDocumentDemand] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const COLORS = ['#6366f1', '#4f46e5', '#3b82f6', '#10b981', '#f59e0b'];
  const ADMIN_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  
  const [allRequests, setAllRequests] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [requestsForPayment, setRequestsForPayment] = useState([]);

  // Treasurer Form States
  const [selectedPaymentReq, setSelectedPaymentReq] = useState('');
  const [paymentData, setPaymentData] = useState({ or_number: '', amount_received: '' });
  const [encodingAction, setEncodingAction] = useState(false);

  // Secretary Verification States
  const [selectedPendingReqId, setSelectedPendingReqId] = useState('');
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [rejectInputOpen, setRejectInputOpen] = useState(false);
  const [verifyingAction, setVerifyingAction] = useState(false);
  const [reviewChecklist, setReviewChecklist] = useState({
    nameMatch: false,
    purposeValid: false,
    addressValid: false,
    dpaConsent: false
  });

  const adminName = localStorage.getItem('first_name') || 'Official';
  const role = localStorage.getItem('role') || 'Admin';

  const fetchDashboardData = async () => {
    try {
      const [statsRes, reqRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/requests')
      ]);

      if (statsRes.data.status === 'success') {
        const data = statsRes.data.data;
        setStats(data);
        setDocumentDemand(data.documentDemand || []); 
        setTrendData(data.trendData || []);           
      }

      if (reqRes.data.status === 'success') {
        const reqList = reqRes.data.data;
        setAllRequests(reqList);
        setRecentRequests(reqList.slice(0, 5));
        setRequestsForPayment(reqList.filter(r => r.request_status === 'For Payment'));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    setReviewChecklist({
      nameMatch: false,
      purposeValid: false,
      addressValid: false,
      dpaConsent: false
    });
  }, [selectedPendingReqId]);

  // --- TREASURER SUBMIT ---
  const handleEncodePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!isPaymentFormValid()) return;
    setEncodingAction(true);
    try {
      await api.put(`/payments/${selectedPaymentReq}`, {
        or_number: paymentData.or_number,
        amount_paid: paymentData.amount_received
      });
      showSnackbar("Receipt payment encoded and approved successfully.", "success");
      setPaymentData({ or_number: '', amount_received: '' });
      setSelectedPaymentReq('');
      fetchDashboardData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Failed to record payment.", "error");
    } finally {
      setEncodingAction(false);
    }
  };

  const handleProcessExemption = async () => {
    if (!selectedPaymentReq || !selectedReqObj) return;
    setEncodingAction(true);
    try {
      const payorName = `${selectedReqObj.first_name} ${selectedReqObj.last_name}`;
      await api.post(`/payments/exempt/${selectedPaymentReq}`, {
        payor_name: payorName
      });
      showSnackbar("Document exempted from fee successfully under RA 11261.", "success");
      setPaymentData({ or_number: '', amount_received: '' });
      setSelectedPaymentReq('');
      fetchDashboardData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Exemption failed.", "error");
    } finally {
      setEncodingAction(false);
    }
  };

  const selectedReqObj = requestsForPayment.find(r => r.request_id === selectedPaymentReq);
  const amountDue = selectedReqObj ? Number(selectedReqObj.base_fee) : 0;
  const amountReceived = Number(paymentData.amount_received) || 0;
  const changeDue = amountReceived >= amountDue ? amountReceived - amountDue : 0;
  const isPaymentFormValid = () => {
    return selectedPaymentReq && paymentData.or_number.trim() !== '' && amountReceived >= amountDue;
  };

  // --- SECRETARY ACTIONS ---
  const handleInlineVerify = async (reqId) => {
    setVerifyingAction(true);
    try {
      await api.put(`/requests/${reqId}/verify`, { action: 'Approve' });
      showSnackbar("Request verified and approved. Awaiting payment.", "success");
      setSelectedPendingReqId('');
      setRejectInputOpen(false);
      fetchDashboardData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Verification failed.", "error");
    } finally {
      setVerifyingAction(false);
    }
  };

  const handleInlineReject = async (reqId) => {
    if (!rejectReasonText.trim()) return showSnackbar("Provide a rejection reason.", "warning");
    setVerifyingAction(true);
    try {
      await api.put(`/requests/${reqId}/verify`, { action: 'Reject', rejection_reason: rejectReasonText });
      showSnackbar("Document request rejected.", "success");
      setRejectReasonText('');
      setSelectedPendingReqId('');
      setRejectInputOpen(false);
      fetchDashboardData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || "Rejection failed.", "error");
    } finally {
      setVerifyingAction(false);
    }
  };

  // Secretary Operations Queue Actions
  const handleGeneratePDF = async (id, refNo) => {
    setVerifyingAction(true);
    try {
      const res = await api.get(`/requests/${id}/generate-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${refNo}_Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showSnackbar("PDF generated successfully.", "success");
    } catch (err) { 
      showSnackbar("Failed to generate PDF. Check Cap signature config.", "error"); 
    } finally { 
      setVerifyingAction(false); 
    }
  };

  const handleMarkReady = async (id) => {
    setVerifyingAction(true);
    try {
      await api.put(`/requests/${id}/ready`);
      fetchDashboardData();
      showSnackbar("Document marked as ready for pickup.", "success");
    } catch (err) { 
      showSnackbar(err.response?.data?.error || "Failed to mark as ready.", "error"); 
    } finally { 
      setVerifyingAction(false); 
    }
  };

  const handleIssueDocument = async (id) => {
    if (!window.confirm("Confirm document issuance?")) return;
    setVerifyingAction(true);
    try {
      await api.put(`/requests/${id}/issue`);
      fetchDashboardData();
      showSnackbar("Document issued successfully.", "success");
    } catch (err) { 
      showSnackbar(err.response?.data?.error || "Failed to issue document.", "error"); 
    } finally { 
      setVerifyingAction(false); 
    }
  };

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

  // =========================================================================
  // --- 1. TREASURER CUSTOMIZED VIEW ---
  // =========================================================================
  const renderTreasurerView = () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.5s ease-out', width: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h5" fontWeight="900" color="#0f172a" gutterBottom>
            Treasurer Command Center
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {adminName}. Manage collections, ledger entries, and encode official receipt cash balances.
          </Typography>
        </Box>
        <Chip label="Treasurer Access" color="success" size="small" sx={{ fontWeight: 'bold', borderRadius: 1 }} />
      </Box>

      {/* Financial Collection Cards (Space-Saving) */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {/* Today's Collections */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#f0fdf4', color: '#16a34a', display: 'flex' }}>
                <AccountBalanceWalletIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight="900" color="#0f172a">
                ₱{stats.todayCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700">Today's Collections</Typography>
          </Paper>
        </Grid>

        {/* 7-Day Collections */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#eff6ff', color: '#2563eb', display: 'flex' }}>
                <DateRangeIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight="900" color="#0f172a">
                ₱{stats.weekCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700">7-Day Collections</Typography>
          </Paper>
        </Grid>

        {/* 30-Day Collections */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#faf5ff', color: '#9333ea', display: 'flex' }}>
                <CalendarMonthIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight="900" color="#0f172a">
                ₱{stats.monthCollections.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700">30-Day Collections</Typography>
          </Paper>
        </Grid>

        {/* Awaiting Payment Queue */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#fff7ed', color: '#ea580c', display: 'flex' }}>
                <PendingActionsIcon fontSize="small" />
              </Box>
              <Typography variant="h6" fontWeight="900" color="#ea580c">{stats.forPayment}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight="700">Awaiting Payment</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Grid (Tighter Spacing) */}
      <Grid container spacing={3}>
        {/* Left Column: Charts */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Financial Trend Analysis (Compact Charts) */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ mb: 0.2 }}>
              Financial Revenue Trend
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Daily transaction volume tracking over the last 7 active calendar days.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1.8, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                    <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 11 }} />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1.2, height: 200 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" sx={{ mb: 0.5, textTransform: 'uppercase' }}>Income Share</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie data={documentDemand} cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" paddingAngle={2} dataKey="value" stroke="none">
                      {documentDemand.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip wrapperStyle={{ fontSize: '10px' }} />
                    <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Encoding and Guide */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            
            {/* Quick Cash Receipt Encoder (Grid Side-by-Side Inputs) */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <InputIcon color="primary" fontSize="small" /> Quick Payment Encoder
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Select a document in payment queue and encode the OR number.
              </Typography>

              {requestsForPayment.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    No requests awaiting payment.
                  </Typography>
                </Box>
              ) : (
                <form onSubmit={handleEncodePaymentSubmit}>
                  <Stack spacing={2}>
                    
                    {/* Request Selector */}
                    <TextField
                      select
                      required
                      fullWidth
                      size="small"
                      label="Pending Payment Order"
                      value={selectedPaymentReq}
                      onChange={(e) => setSelectedPaymentReq(e.target.value)}
                      variant="outlined"
                    >
                      {requestsForPayment.map((req) => (
                        <MenuItem key={req.request_id} value={req.request_id} sx={{ fontSize: '0.8rem' }}>
                          {req.reference_no} — {req.first_name} {req.last_name} (₱{req.base_fee})
                        </MenuItem>
                      ))}
                    </TextField>

                    {/* OR Number & Cash Amount Received (Side-by-Side) */}
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          required
                          fullWidth
                          size="small"
                          label="OR Number"
                          value={paymentData.or_number}
                          onChange={(e) => setPaymentData({ ...paymentData, or_number: e.target.value })}
                          placeholder="e.g. OR-87265"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          required
                          fullWidth
                          size="small"
                          type="number"
                          label="Cash Received"
                          value={paymentData.amount_received}
                          onChange={(e) => setPaymentData({ ...paymentData, amount_received: e.target.value })}
                          InputProps={{
                            startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.8rem' } }}>₱</InputAdornment>
                          }}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    {/* Change calculator Box (Tighter) */}
                    {selectedPaymentReq && (
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1.5, 
                          bgcolor: changeDue >= 0 && amountReceived >= amountDue ? '#f0fdf4' : '#fef2f2', 
                          border: '1px solid', 
                          borderColor: changeDue >= 0 && amountReceived >= amountDue ? 'success.main' : 'error.main', 
                          borderRadius: 2 
                        }}
                      >
                        <Stack spacing={0.25}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Document Fee Due:</Typography>
                            <Typography variant="caption" fontWeight="bold">₱{amountDue.toFixed(2)}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">Change to Resident:</Typography>
                            <Typography variant="subtitle2" fontWeight="bold" color={changeDue >= 0 && amountReceived >= amountDue ? "success.main" : "error.main"}>
                              {amountReceived < amountDue ? "Insufficient Cash" : `₱${changeDue.toFixed(2)}`}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    )}

                    {selectedReqObj && selectedReqObj.purpose && selectedReqObj.purpose.includes('[FIRST-TIME JOBSEEKER]') ? (
                      <Stack direction="row" spacing={1}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="success"
                          disabled={encodingAction}
                          onClick={handleProcessExemption}
                          sx={{ py: 1.2, fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}
                        >
                          {encodingAction ? 'Exempting...' : 'Exempt (RA 11261)'}
                        </Button>
                        <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          disabled={!isPaymentFormValid() || encodingAction}
                          sx={{ py: 1.2, fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}
                        >
                          {encodingAction ? 'Processing...' : 'Pay Cash'}
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={!isPaymentFormValid() || encodingAction}
                        sx={{ py: 1.2, fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}
                      >
                        {encodingAction ? 'Encoding Payment...' : 'Record Payment Receipt'}
                      </Button>
                    )}
                  </Stack>
                </form>
              )}
            </Paper>

            {/* Explainable Financial Guide (Compact) */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle2" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <HelpOutlineIcon color="primary" fontSize="small" /> Financial Encoding Guide
              </Typography>
              
              <Stack spacing={1.5} sx={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="#0f172a" display="block" sx={{ mb: 0.25 }}>
                    1. Official Receipt (OR) Formatting
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Encode exact physical receipt numbers to prevent auditing discrepancies. Duplicates will fail.
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="#0f172a" display="block" sx={{ mb: 0.25 }}>
                    2. Certificate Fee Exemptions
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Exempt indigents from clearance fees. Set amount to ₱0.00 and OR number to `EXEMPT-INDIGENCY`.
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight="bold" color="#0f172a" display="block" sx={{ mb: 0.25 }}>
                    3. Daily Balancing Protocol
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Reconcile E-Serbisyo "Today's Collections" with the physical cash box before logging out.
                  </Typography>
                </Box>
              </Stack>
            </Paper>

          </Stack>
        </Grid>
      </Grid>

      {/* Standalone Full-Width Collections Ledger Table */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', overflow: 'hidden', mt: 3 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptLongIcon color="success" fontSize="small" /> Collections Ledger
          </Typography>
          <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 10 }} />} onClick={() => navigate('/admin/payments')} sx={{ fontSize: '0.75rem' }}>
            View Payments Desk
          </Button>
        </Box>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>OR Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Ref No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Payor Resident</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Document Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Date Paid</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats.recentPayments && stats.recentPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.85rem' }}>
                    No collections logged yet.
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentPayments?.map((payment) => (
                  <TableRow key={payment.payment_id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: '#16a34a', py: 1.5, fontSize: '0.85rem' }}>{payment.or_number}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{payment.reference_no}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{payment.payor_name}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{payment.type_name}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', py: 1.5, fontSize: '0.85rem' }}>
                      ₱{Number(payment.amount_paid).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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

  // =========================================================================
  // --- 2. SECRETARY CUSTOMIZED VIEW (Indigo Theme) ---
  // =========================================================================
  const renderSecretaryView = () => {
    // Filter requests strictly pending for the verification sidebar
    const pendingVerifications = allRequests.filter(r => r.request_status === 'Pending');
    const selectedPendingReq = pendingVerifications.find(r => r.request_id === selectedPendingReqId);

    return (
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.5s ease-out', width: '100%', boxSizing: 'border-box' }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h5" fontWeight="900" color="#0f172a" gutterBottom>
              Secretary Operations Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back, {adminName}. Review resident document applications, generate certificates, and track pickup timelines.
            </Typography>
          </Box>
          <Chip label="Secretary Access" color="primary" size="small" sx={{ fontWeight: 'bold', bgcolor: '#4f46e5', borderRadius: 1 }} />
        </Box>

        {/* Operational Flow Cards */}
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {/* Awaiting Verification (Pending) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.2, bgcolor: '#fef3c7', color: '#d97706', display: 'flex' }}>
                  <RateReviewIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight="900" color="#d97706">{stats.pending}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Awaiting Verification</Typography>
            </Paper>
          </Grid>

          {/* Ready to Print (Processing) */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.2, bgcolor: '#e0e7ff', color: '#4f46e5', display: 'flex' }}>
                  <PrintIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight="900" color="#4f46e5">{stats.processing}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Ready to Print (Paid)</Typography>
            </Paper>
          </Grid>

          {/* Ready for Pickup */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.2, bgcolor: '#d1fae5', color: '#059669', display: 'flex' }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight="900" color="#059669">{stats.ready}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Ready for Pickup</Typography>
            </Paper>
          </Grid>

          {/* Pending Registrations */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ p: 0.8, borderRadius: 1.2, bgcolor: '#e0f2fe', color: '#0284c7', display: 'flex' }}>
                  <GroupAddIcon fontSize="small" />
                </Box>
                <Typography variant="h6" fontWeight="900" color="#0284c7">{stats.pendingResidents}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" fontWeight="700">Pending Registrations</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Main Operational Layout */}
        <Grid container spacing={3}>
          
          {/* Left Column: Charts */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Queue Bottlenecks & Document demand */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
              <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ mb: 0.2 }}>
                Document Flow & Volume
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Visual overview of requests and bottlenecks.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1.5, height: 180 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" sx={{ mb: 0.5, textTransform: 'uppercase' }}>7-DAY REQUEST VOLUME</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCountSec" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                      <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dx={-10} />
                      <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: 11 }} />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fill="url(#colorCountSec)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 1.2, height: 180 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" sx={{ mb: 0.5, textTransform: 'uppercase' }}>Fulfillment Queue</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={[{name: 'Queue', Pending: stats.pending, 'Printing': stats.processing, 'Ready': stats.ready}]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" hide />
                      <YAxis hide />
                      <ChartTooltip wrapperStyle={{ fontSize: '10px' }} />
                      <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                      <Bar dataKey="Pending" fill="#ea580c" barSize={25} radius={[3,3,0,0]} />
                      <Bar dataKey="Printing" fill="#4f46e5" barSize={25} radius={[3,3,0,0]} />
                      <Bar dataKey="Ready" fill="#059669" barSize={25} radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right Column: Inline Document Verifier & Guidelines */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              
              {/* Quick Verification Console */}
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <RateReviewIcon color="primary" sx={{ color: '#4f46e5' }} fontSize="small" /> Verification Panel
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  Verify resident ID details and approve requests instantly.
                </Typography>

                {!selectedPendingReq ? (
                  <Box sx={{ p: 2.5, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 1 }}>
                      No verification active.
                    </Typography>
                    {pendingVerifications.length > 0 ? (
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Select Pending Request"
                        value={selectedPendingReqId}
                        onChange={(e) => setSelectedPendingReqId(e.target.value)}
                        variant="outlined"
                        InputProps={{ style: { fontSize: '0.8rem' } }}
                      >
                        {pendingVerifications.map((req) => (
                          <MenuItem key={req.request_id} value={req.request_id} sx={{ fontSize: '0.8rem' }}>
                            {req.reference_no} — {req.first_name} {req.last_name}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        All requests are verified. Good job!
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Stack spacing={1.5} sx={{ animation: 'fadeInStep 0.3s ease-out' }}>
                    <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                      <Grid container spacing={1.5}>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>Tracking Number</Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="body2" fontWeight="bold" color="#4f46e5" sx={{ fontSize: '0.78rem' }}>{selectedPendingReq.reference_no}</Typography>
                            {selectedPendingReq.reference_no.startsWith('WLK-') && (
                              <Chip label="WALK-IN" size="small" sx={{ bgcolor: '#e0f7fa', color: '#006064', fontWeight: 'bold', fontSize: '0.55rem', height: 14, borderRadius: '3px' }} />
                            )}
                          </Stack>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>Applicant</Typography>
                          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.78rem' }}>{selectedPendingReq.first_name} {selectedPendingReq.last_name}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>Document & Fee</Typography>
                          <Box>
                            <Typography variant="body2" fontWeight="bold" color="text.primary" sx={{ fontSize: '0.78rem' }} display="inline">{selectedPendingReq.type_name} (₱{selectedPendingReq.base_fee})</Typography>
                            {selectedPendingReq.purpose && selectedPendingReq.purpose.includes('[FIRST-TIME JOBSEEKER]') && (
                              <Chip label="JOBSEEKER" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '0.55rem', height: 14, borderRadius: '3px', ml: 0.5 }} />
                            )}
                          </Box>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>Address</Typography>
                          <Typography variant="caption" display="block" color="text.primary" sx={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedPendingReq.address_street}>{selectedPendingReq.address_street}</Typography>
                        </Grid>
                        <Grid size={12}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" textTransform="uppercase" sx={{ fontSize: '0.65rem' }}>Stated Purpose</Typography>
                          <Typography variant="caption" display="block" color="text.primary" sx={{ fontStyle: 'italic', bgcolor: '#f1f5f9', p: 1, borderRadius: 1.5, mt: 0.25, fontSize: '0.72rem' }}>
                            "{selectedPendingReq.purpose}"
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>

                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      size="small" 
                      startIcon={<FilePresentIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => navigate('/admin/requests')}
                      sx={{ textTransform: 'none', color: '#4f46e5', borderColor: '#818cf8', py: 0.5, fontSize: '0.75rem' }}
                    >
                      Inspect ID in Requests Queue
                    </Button>

                    {!rejectInputOpen ? (
                      <Stack direction="row" spacing={1}>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          fullWidth 
                          size="small"
                          onClick={() => setRejectInputOpen(true)}
                          sx={{ textTransform: 'none', py: 0.6, fontSize: '0.75rem' }}
                        >
                          Reject
                        </Button>
                        <Button 
                          variant="contained" 
                          fullWidth 
                          size="small"
                          onClick={() => handleInlineVerify(selectedPendingReq.request_id)}
                          disabled={verifyingAction || !reviewChecklist.nameMatch || !reviewChecklist.purposeValid || !reviewChecklist.addressValid || !reviewChecklist.dpaConsent}
                          sx={{ textTransform: 'none', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, py: 0.6, fontSize: '0.75rem' }}
                        >
                          {verifyingAction ? 'Processing...' : 'Verify & Approve'}
                        </Button>
                      </Stack>
                    ) : (
                      <Stack spacing={1}>
                        <TextField 
                          required
                          fullWidth
                          size="small"
                          label="Rejection Reason"
                          multiline
                          rows={2}
                          value={rejectReasonText}
                          onChange={(e) => setRejectReasonText(e.target.value)}
                          placeholder="Provide clear reasons (e.g. ID uploaded is blurry or expired...)"
                          InputProps={{ style: { fontSize: '0.75rem' } }}
                          InputLabelProps={{ style: { fontSize: '0.75rem' } }}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={() => setRejectInputOpen(false)} sx={{ textTransform: 'none', fontSize: '0.72rem' }}>Cancel</Button>
                          <Button 
                            variant="contained" 
                            color="error" 
                            size="small" 
                            fullWidth
                            onClick={() => handleInlineReject(selectedPendingReq.request_id)}
                            disabled={verifyingAction}
                            sx={{ textTransform: 'none', py: 0.6, fontSize: '0.75rem' }}
                          >
                            Confirm Rejection
                          </Button>
                        </Stack>
                      </Stack>
                    )}

                    <Button variant="text" size="small" onClick={() => { setSelectedPendingReqId(''); setRejectInputOpen(false); }} sx={{ textTransform: 'none', color: 'text.secondary', py: 0.2, fontSize: '0.72rem' }}>
                      Clear Review Panel
                    </Button>
                  </Stack>
                )}
              </Paper>

              {/* Secretary Operations Assistant (Dynamic & Interactive Checklist) */}
              {selectedPendingReq && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle2" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <HelpOutlineIcon color="primary" sx={{ color: '#4f46e5' }} fontSize="small" /> Fulfillment Assistant
                  </Typography>
                  
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" fontWeight="bold" color="#4f46e5" display="block" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                        Active Verification Checks
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontSize: '0.7rem' }}>
                        Carefully verify applicant data before checking each box to enable approval:
                      </Typography>
                      
                      <Stack spacing={1.2}>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <input 
                            type="checkbox" 
                            id="check-name" 
                            checked={reviewChecklist.nameMatch}
                            onChange={(e) => setReviewChecklist({ ...reviewChecklist, nameMatch: e.target.checked })}
                            style={{ marginTop: 2, cursor: 'pointer' }}
                          />
                          <label htmlFor="check-name" style={{ fontSize: '0.72rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                            <strong>ID Name Match:</strong> Full name matches the resident profile and uploaded ID card.
                          </label>
                        </Box>
                        
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <input 
                            type="checkbox" 
                            id="check-address" 
                            checked={reviewChecklist.addressValid}
                            onChange={(e) => setReviewChecklist({ ...reviewChecklist, addressValid: e.target.checked })}
                            style={{ marginTop: 2, cursor: 'pointer' }}
                          />
                          <label htmlFor="check-address" style={{ fontSize: '0.72rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                            <strong>Address Match:</strong> Street address matches official residency database logs.
                          </label>
                        </Box>

                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <input 
                            type="checkbox" 
                            id="check-purpose" 
                            checked={reviewChecklist.purposeValid}
                            onChange={(e) => setReviewChecklist({ ...reviewChecklist, purposeValid: e.target.checked })}
                            style={{ marginTop: 2, cursor: 'pointer' }}
                          />
                          <label htmlFor="check-purpose" style={{ fontSize: '0.72rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                            <strong>Purpose Validity:</strong> Stated purpose is legitimate, clear, and compliant.
                          </label>
                        </Box>

                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <input 
                            type="checkbox" 
                            id="check-consent" 
                            checked={reviewChecklist.dpaConsent}
                            onChange={(e) => setReviewChecklist({ ...reviewChecklist, dpaConsent: e.target.checked })}
                            style={{ marginTop: 2, cursor: 'pointer' }}
                          />
                          <label htmlFor="check-consent" style={{ fontSize: '0.72rem', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>
                            <strong>DPA Compliance:</strong> Certified data privacy consent exists for document issuance.
                          </label>
                        </Box>
                      </Stack>
                    </Box>
                    
                    <Divider sx={{ my: 0.5 }} />
                    
                    {/* Warning / Success status box */}
                    {!(reviewChecklist.nameMatch && reviewChecklist.purposeValid && reviewChecklist.addressValid && reviewChecklist.dpaConsent) ? (
                      <Box sx={{ p: 1, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="#b45309" fontWeight="bold" display="block" sx={{ fontSize: '0.68rem' }}>
                          ⚠️ Verification Checklist Incomplete
                        </Typography>
                        <Typography variant="caption" color="#d97706" display="block" sx={{ fontSize: '0.65rem', mt: 0.25 }}>
                          Complete all 4 checks to enable request approval.
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ p: 1, bgcolor: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="#15803d" fontWeight="bold" display="block" sx={{ fontSize: '0.68rem' }}>
                          ✅ Checklist Completed
                        </Typography>
                        <Typography variant="caption" color="#16a34a" display="block" sx={{ fontSize: '0.65rem', mt: 0.25 }}>
                          All operations verified. You can now safely approve this request.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Standalone Full-Width Operations Queue Table */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', overflow: 'hidden', mt: 3 }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" sx={{ color: '#4f46e5' }} fontSize="small" /> E-Serbisyo Operations Queue
            </Typography>
            <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 10 }} />} onClick={() => navigate('/admin/requests')} sx={{ fontSize: '0.75rem', color: '#4f46e5' }}>
              Full Queue Desk
            </Button>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Ref No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Resident</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Document</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569', py: 1.5 }}>Quick Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary', fontSize: '0.85rem' }}>
                      Queue is completely clear!
                    </TableCell>
                  </TableRow>
                ) : (
                  allRequests.slice(0, 6).map((row) => (
                    <TableRow key={row.request_id} hover>
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <span style={{ fontWeight: 'bold', color: '#4f46e5', fontSize: '0.85rem' }}>{row.reference_no}</span>
                          {row.reference_no.startsWith('WLK-') && (
                            <Chip label="WALK-IN" size="small" sx={{ bgcolor: '#e0f7fa', color: '#006064', fontWeight: 'bold', fontSize: '0.6rem', height: 16, borderRadius: '4px' }} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 1.5, fontSize: '0.85rem' }}>{row.first_name} {row.last_name}</TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }} display="inline">{row.type_name}</Typography>
                          {row.purpose && row.purpose.includes('[FIRST-TIME JOBSEEKER]') && (
                            <Chip label="JOBSEEKER (RA 11261)" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '0.6rem', height: 16, borderRadius: '4px', ml: 0.5 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}><Chip label={row.request_status} color={getStatusColor(row.request_status)} size="small" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} /></TableCell>
                      <TableCell align="center" sx={{ py: 1 }}>
                        {row.request_status === 'Pending' && (
                          <Button variant="contained" size="small" onClick={() => setSelectedPendingReqId(row.request_id)} sx={{ fontSize: '0.75rem', textTransform: 'none', bgcolor: '#ea580c', '&:hover': { bgcolor: '#c2410c' }, py: 0.5 }}>
                            Review ID
                          </Button>
                        )}
                        {row.request_status === 'For Payment' && (
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">Awaiting Pay</Typography>
                        )}
                        {row.request_status === 'Processing' && (
                          <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                            <IconButton size="small" color="primary" onClick={() => handleGeneratePDF(row.request_id, row.reference_no)} sx={{ color: '#4f46e5', p: 0.5 }}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                            <Button variant="outlined" size="small" onClick={() => handleMarkReady(row.request_id)} sx={{ fontSize: '0.72rem', py: 0.3, textTransform: 'none', px: 1.2, color: '#4f46e5', borderColor: '#818cf8' }}>
                              Mark Ready
                            </Button>
                          </Stack>
                        )}
                        {row.request_status === 'Ready for Pickup' && (
                          <Button variant="contained" color="success" size="small" onClick={() => handleIssueDocument(row.request_id)} startIcon={<AssignmentTurnedInIcon sx={{ fontSize: '12px !important' }} />} sx={{ fontSize: '0.72rem', textTransform: 'none', px: 1.2, py: 0.4 }}>
                            Issue
                          </Button>
                        )}
                        {['Issued', 'Rejected', 'Cancelled'].includes(row.request_status) && (
                          <Typography variant="caption" color="text.secondary">Finalized</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Secretary System Guide (Horizontal at the absolute bottom) */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mt: 3.5 }}>
          <Typography variant="subtitle1" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <HelpOutlineIcon color="primary" sx={{ color: '#4f46e5' }} fontSize="small" /> Secretary System Guide
          </Typography>
          
          <Grid container spacing={3}>
            {/* Column 1: Document Request Lifecycle */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" fontWeight="bold" color="#4f46e5" display="block" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                1. Document Request Lifecycle
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                • <strong>Pending:</strong> Resident uploaded an ID. Secretary must review and approve/reject.<br />
                • <strong>For Payment:</strong> Approved requests move here. Treasurer encodes OR payments.<br />
                • <strong>Processing:</strong> Paid requests. Secretary prints certificate PDF and marks Ready.<br />
                • <strong>Ready for Pickup:</strong> Secretary verifies physical OR receipt before hand-over.
              </Typography>
            </Grid>

            {/* Column 2: DPA Protocol */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" fontWeight="bold" color="#4f46e5" display="block" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                2. DPA (RA 10173) Protocol
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                • The new system strictly enforces the **Philippines Data Privacy Act (RA 10173)**.<br />
                • Ensure resident IDs are legible, match the profile fields exactly, and DPA certification is checked prior to verification or hand-over.
              </Typography>
            </Grid>

            {/* Column 3: Certificate Tips */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="caption" fontWeight="bold" color="#4f46e5" display="block" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>
                3. Certificate Generation Tips
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                • Indigency certificates should be printed with fee ₱0.00 and OR number set to <code>EXEMPT-INDIGENCY</code>.<br />
                • Certificate PDF rendering requires a valid Barangay Captain signature to be configured in System Settings.
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <style>
          {`
            @keyframes fadeIn {
              0% { opacity: 0; transform: translateY(10px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeInStep {
              from { opacity: 0; transform: translateY(5px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </Box>
    );
  };

  // =========================================================================
  // --- 3. STANDARD ADMIN / SECRETARY VIEW ---
  // =========================================================================
  const renderStandardView = () => (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.5s ease-out', width: '100%', boxSizing: 'border-box' }}>
      
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

      {/* TOP ROW: KEY METRICS */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        {/* Needs Verification (Pending) */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

      {/* STATISTICS & CHARTS */}
      <Paper elevation={0} sx={{ 
        p: 4, 
        borderRadius: 4, 
        border: '1px solid #e2e8f0', 
        bgcolor: 'white', 
        mb: 5,
        width: '100%' 
      }}>
        <Typography variant="h5" fontWeight="900" color="#0f172a" sx={{ mb: 1 }}>
          Administrative Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Live workflow data and document demand tracking.
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 3, 
          width: '100%',
          alignItems: 'stretch'
        }}>
          {/* CHART 1: 7-DAY VOLUME */}
          <Box sx={{ flex: 2, bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid #e2e8f0', minHeight: 320, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom>7-DAY REQUEST VOLUME</Typography>
            <Box sx={{ height: 250, width: '100%', mt: 2, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCountStandard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <ChartTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fill="url(#colorCountStandard)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* CHART 2: DOCUMENT DEMAND */}
          <Box sx={{ flex: 1, bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid #e2e8f0', minHeight: 320, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom>DOCUMENT DEMAND</Typography>
            <Box sx={{ height: 250, width: '100%', mt: 2, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={documentDemand} cx="50%" cy="50%" innerRadius="50%" outerRadius="80%" paddingAngle={3} dataKey="value" stroke="none">
                    {documentDemand.map((entry, index) => <Cell key={`cell-${index}`} fill={ADMIN_COLORS[index % ADMIN_COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          {/* CHART 3: BOTTLENECKS */}
          <Box sx={{ flex: 1.5, bgcolor: '#f8fafc', p: 3, borderRadius: 3, border: '1px solid #e2e8f0', minHeight: 320, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom>WORKFLOW BOTTLENECKS</Typography>
            <Box sx={{ height: 250, width: '100%', mt: 2, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart layout="vertical" data={[{name: 'Queue', Pending: stats.pending, 'For Payment': stats.forPayment, Processing: stats.processing}]} margin={{ top: 30, right: 30, left: -20, bottom: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <ChartTooltip />
                  <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingBottom: '20px' }} />
                  <Bar dataKey="Pending" stackId="a" fill="#f59e0b" barSize={40} radius={[6,0,0,6]} />
                  <Bar dataKey="For Payment" stackId="a" fill="#3b82f6" barSize={40} />
                  <Bar dataKey="Processing" stackId="a" fill="#10b981" barSize={40} radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* TABLES & QUICK ACTIONS */}
      <Grid container spacing={3}>
        {/* Left Column: Recent Requests Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" /> Action Queue Preview
              </Typography>
              <Button size="small" endIcon={<ArrowForwardIosIcon fontSize="small" />} onClick={() => navigate('/admin/requests')}>
                View All
              </Button>
            </Box>
            <TableContainer sx={{ overflowX: 'auto' }}>
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
                        <TableCell sx={{ py: 1.5 }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{req.reference_no}</span>
                            {req.reference_no.startsWith('WLK-') && (
                              <Chip label="WALK-IN" size="small" sx={{ bgcolor: '#e0f7fa', color: '#006064', fontWeight: 'bold', fontSize: '0.6rem', height: 16, borderRadius: '4px' }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{req.first_name} {req.last_name}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box>
                            <Typography variant="body2" display="inline">{req.type_name}</Typography>
                            {req.purpose && req.purpose.includes('[FIRST-TIME JOBSEEKER]') && (
                              <Chip label="JOBSEEKER (RA 11261)" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '0.6rem', height: 16, borderRadius: '4px', ml: 0.5 }} />
                            )}
                          </Box>
                        </TableCell>
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
        <Grid size={{ xs: 12, md: 4 }}>
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
                onClick={() => navigate('/admin/walkin')}
              >
                📥 Create Walk-In Request
              </Button>
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

  if (role === 'Treasurer') return renderTreasurerView();
  if (role === 'Secretary') return renderSecretaryView();
  return renderStandardView();
}