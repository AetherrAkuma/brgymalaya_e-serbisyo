import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Divider, Stack, TextField, InputAdornment, Tooltip, IconButton, useTheme
} from '@mui/material';

// Icons for a professional civic look
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import PrintIcon from '@mui/icons-material/Print';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterListIcon from '@mui/icons-material/FilterList';

import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

export default function RequestsQueue() {
  const showSnackbar = useSnackbar();
  const theme = useTheme();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  
  // Data & Preview States
  const [extraFiles, setExtraFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Payment States
  const [paymentData, setPaymentData] = useState({ or_number: '', amount_received: '' });

  // --- UPDATED ROLE ACCESS CONTROL ---
  // Expanded to include 'Captain' for fulfillment and collection oversight
  const userRole = localStorage.getItem('role') || 'Official';
  const isSecretaryOrAdmin = ['Secretary', 'Super Admin', 'Captain'].includes(userRole);
  const isTreasurerOrAdmin = ['Treasurer', 'Super Admin', 'Captain'].includes(userRole);

  useEffect(() => { fetchRequests(); }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = requests.filter(r => 
      r.reference_no.toLowerCase().includes(query) || 
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(query) ||
      r.type_name.toLowerCase().includes(query)
    );
    setFilteredRequests(filtered);
  }, [searchQuery, requests]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/requests');
      setRequests(res.data.data);
      setFilteredRequests(res.data.data);
    } catch (err) { console.error("Fetch error:", err); } 
    finally { setLoading(false); }
  };

  const handleCloseAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setReviewModalOpen(false);
    setPaymentModalOpen(false);
    setRejectDialogOpen(false);
    setSelectedReq(null);
    setPreviewUrl(null);
    setPaymentData({ or_number: '', amount_received: '' });
    setRejectionReason('');
  };

  // --- LOGIC HANDLERS ---
  const handleOpenReview = async (req) => {
    setSelectedReq(req);
    setReviewModalOpen(true);
    try {
      const res = await api.get(`/admin/request-files/${req.reference_no}`);
      setExtraFiles(res.data.files);
    } catch (err) { console.error("Files fetch error:", err); }
  };

  const handlePreview = async (filename) => {
    if (!filename) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    try {
      const response = await api.get(`/admin/view-file/${filename}`, { responseType: 'blob' });
      setPreviewUrl(URL.createObjectURL(response.data));
      setPreviewType(filename.toLowerCase().includes('.pdf') ? 'pdf' : 'image');
    } catch (err) { showSnackbar("Access Denied: Could not decrypt sensitive document.", "error"); }
  };

  const handleVerify = async (action) => {
    if (action === 'Reject' && !rejectionReason.trim()) return showSnackbar("Please provide a reason.", "warning");
    setProcessingAction('verify');
    try {
      await api.put(`/requests/${selectedReq.request_id}/verify`, { 
        action, 
        rejection_reason: action === 'Reject' ? rejectionReason : null 
      });
      handleCloseAll();
      fetchRequests();
      showSnackbar(`Request ${action === 'Approve' ? 'approved' : 'rejected'} successfully.`, "success");
    } catch (err) { showSnackbar(err.response?.data?.message || "Processing failed.", "error"); } 
    finally { setProcessingAction(null); }
  };

  const handleProcessPayment = async () => {
    if (!paymentData.or_number || !paymentData.amount_received) return showSnackbar("Required fields missing.", "warning");
    setProcessingAction('payment');
    try {
      await api.put(`/payments/${selectedReq.request_id}`, {
        or_number: paymentData.or_number,
        amount_paid: paymentData.amount_received
      });
      handleCloseAll();
      fetchRequests();
      showSnackbar("Payment recorded successfully.", "success");
    } catch (err) { showSnackbar(err.response?.data?.message || "Payment encoding failed.", "error"); } 
    finally { setProcessingAction(null); }
  };

  const handlePrintPDF = async (id, refNo) => {
    setProcessingAction('print');
    try {
      const res = await api.get(`/requests/${id}/generate-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Official_${refNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { 
        showSnackbar("Print Error: Ensure the template and signature are vaulted in the Catalog.", "error"); 
    } finally { setProcessingAction(null); }
  };

  const handleUpdateStatus = async (id, endpoint) => {
    setProcessingAction(endpoint);
    try {
      await api.put(`/requests/${id}/${endpoint}`);
      fetchRequests();
      showSnackbar(`Status updated successfully.`, "success");
    } catch (err) { showSnackbar(err.response?.data?.message || "Update failed.", "error"); } 
    finally { setProcessingAction(null); }
  };

  const getStatusChip = (status) => {
    const colors = { 
        'Pending': { bg: '#fff7ed', text: '#c2410c', label: 'FOR REVIEW' },
        'For Payment': { bg: '#eff6ff', text: '#1d4ed8', label: 'FOR PAYMENT' },
        'Processing': { bg: '#f5f3ff', text: '#6d28d9', label: 'IN PROGRESS' },
        'Ready for Pickup': { bg: '#ecfdf5', text: '#047857', label: 'READY' },
        'Issued': { bg: '#f8fafc', text: '#64748b', label: 'ARCHIVED' },
        'Rejected': { bg: '#fef2f2', text: '#b91c1c', label: 'REJECTED' }
    };
    const style = colors[status] || { bg: '#f1f5f9', text: '#475569', label: status.toUpperCase() };
    return (
        <Chip 
            label={style.label} 
            sx={{ bgcolor: style.bg, color: style.text, fontWeight: '900', fontSize: '0.65rem', borderRadius: '6px', height: 24 }} 
        />
    );
  };

  // Change Calculator
  const amountDue = selectedReq ? Number(selectedReq.base_fee) : 0;
  const amountReceived = Number(paymentData.amount_received) || 0;
  const changeDue = amountReceived >= amountDue ? amountReceived - amountDue : 0;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.6s ease-out' }}>
      
      {/* HEADER SECTION */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
            <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ letterSpacing: '-0.02em' }}>
                Master Requests Queue
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Securely manage document lifecycle and collections for Barangay constituents.
            </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField 
                size="small" 
                placeholder="Search Reference or Name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ bgcolor: 'white', borderRadius: 2, minWidth: 300 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
            />
            <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>Filter</Button>
        </Stack>
      </Stack>

      {/* QUEUE TABLE */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>TRACKING #</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>RESIDENT</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>DOCUMENT TYPE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>FEE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>STATUS</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', color: '#475569' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((row, index) => (
              <TableRow 
                key={row.request_id} 
                hover 
                sx={{ 
                    animation: `slideUp 0.4s ease-out forwards`, 
                    animationDelay: `${index * 0.05}s`,
                    opacity: 0,
                    '&:last-child td': { border: 0 }
                }}
              >
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>{row.reference_no}</TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight="600">{row.first_name} {row.last_name}</Typography>
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <DescriptionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2">{row.type_name}</Typography>
                    </Stack>
                </TableCell>
                <TableCell>
                    <Typography variant="body2" fontWeight="bold">₱{row.base_fee}</Typography>
                </TableCell>
                <TableCell>{getStatusChip(row.request_status)}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    
                    {/* Role & Status Based Workflow */}
                    {row.request_status === 'Pending' && isSecretaryOrAdmin && (
                        <Button variant="contained" color="warning" size="small" onClick={() => handleOpenReview(row)} disabled={!!processingAction} sx={{ borderRadius: '8px', fontWeight: 'bold', px: 2 }}>Review</Button>
                    )}

                    {row.request_status === 'For Payment' && isTreasurerOrAdmin && (
                        <Button variant="contained" color="info" size="small" startIcon={<PaymentsOutlinedIcon />} onClick={() => { setSelectedReq(row); setPaymentModalOpen(true); }} disabled={!!processingAction} sx={{ borderRadius: '8px', fontWeight: 'bold' }}>
                            Collect
                        </Button>
                    )}

                    {row.request_status === 'Processing' && isSecretaryOrAdmin && (
                        <>
                            <Button variant="contained" size="small" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: '8px', fontWeight: 'bold' }} startIcon={processingAction === 'print' ? <CircularProgress size={18} color="inherit" /> : <PrintIcon />} onClick={() => handlePrintPDF(row.request_id, row.reference_no)} disabled={!!processingAction} className={processingAction === 'print' ? 'btn-loading' : ''}>
                                {processingAction === 'print' ? 'Printing...' : 'Print'}
                            </Button>
                            <Button variant="contained" size="small" color="primary" startIcon={processingAction === 'ready' ? <CircularProgress size={18} color="inherit" /> : <TaskAltIcon />} onClick={() => handleUpdateStatus(row.request_id, 'ready')} disabled={!!processingAction} className={processingAction === 'ready' ? 'btn-loading' : ''} sx={{ borderRadius: '8px', fontWeight: 'bold' }}>
                                {processingAction === 'ready' ? 'Updating...' : 'Mark Ready'}
                            </Button>
                        </>
                    )}

                    {row.request_status === 'Ready for Pickup' && isSecretaryOrAdmin && (
                        <Button variant="contained" size="small" color="success" startIcon={processingAction === 'issue' ? <CircularProgress size={18} color="inherit" /> : <AssignmentTurnedInIcon />} onClick={() => handleUpdateStatus(row.request_id, 'issue')} disabled={!!processingAction} className={processingAction === 'issue' ? 'btn-loading' : ''} sx={{ borderRadius: '8px', fontWeight: 'bold' }}>
                            {processingAction === 'issue' ? 'Issuing...' : 'Final Issue'}
                        </Button>
                    )}

                    <Tooltip title="View Full Details">
                        <IconButton size="small" color="primary" onClick={() => handleOpenReview(row)} sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                            <VisibilityIcon fontSize="small"/>
                        </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRequests.length === 0 && (
            <Box sx={{ p: 10, textAlign: 'center' }}>
                <Typography color="text.secondary">No requests matching your criteria were found.</Typography>
            </Box>
        )}
      </TableContainer>

      {/* --- REVIEW MODAL (Modern Layout) --- */}
      <Dialog open={reviewModalOpen} onClose={handleCloseAll} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        {selectedReq && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" fontWeight="900">Request Audit: {selectedReq.reference_no}</Typography>
                {getStatusChip(selectedReq.request_status)}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
                <Grid container sx={{ height: '70vh' }}>
                    {/* Details Panel */}
                    <Grid size={{ xs: 12, md: 4 }} sx={{ p: 4, borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
                        <Typography variant="overline" color="text.secondary" fontWeight="bold">RESIDENT INFORMATION</Typography>
                        <Typography variant="h5" fontWeight="900" color="#0f172a" sx={{ mt: 1 }}>{selectedReq.first_name} {selectedReq.last_name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>{selectedReq.address_street}</Typography>
                        
                        <Divider sx={{ my: 3 }} />
                        
                        <Typography variant="overline" color="text.secondary" fontWeight="bold">PURPOSE OF REQUEST</Typography>
                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{selectedReq.purpose}</Typography>
                        </Box>

                        <Typography variant="overline" color="text.secondary" fontWeight="bold" sx={{ mt: 4, display: 'block' }}>SECURE ATTACHMENTS</Typography>
                        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                            <Button variant="outlined" startIcon={<FilePresentIcon />} onClick={() => handlePreview(selectedReq.id_proof_image)} sx={{ borderRadius: 2, justifyContent: 'flex-start', py: 1 }}>Official ID Proof</Button>
                            {extraFiles.map((f, i) => (
                                <Button key={i} variant="text" color="secondary" startIcon={<FilePresentIcon />} onClick={() => handlePreview(f)} sx={{ justifyContent: 'flex-start', borderRadius: 2, border: '1px dashed' }}>
                                    Requirement {i+1}
                                </Button>
                            ))}
                        </Stack>
                    </Grid>
                    {/* Preview Panel */}
                    <Grid size={{ xs: 12, md: 8 }} sx={{ bgcolor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {!previewUrl ? (
                            <Stack spacing={2} alignItems="center">
                                <InfoOutlinedIcon sx={{ fontSize: 60, color: 'white', opacity: 0.1 }} />
                                <Typography color="white" sx={{ opacity: 0.5 }}>Select a file from the left to verify</Typography>
                            </Stack>
                        ) : (
                         previewType === 'image' ? (
                             <img src={previewUrl} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} alt="Preview" />
                         ) : (
                             <iframe src={previewUrl} width="100%" height="100%" title="PDF Preview" style={{ border: 'none' }} />
                         )
                        )}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
                <Button onClick={handleCloseAll} color="inherit" sx={{ fontWeight: 'bold' }}>Close Window</Button>
                {selectedReq.request_status === 'Pending' && isSecretaryOrAdmin && (
                    <>
                        <Button color="error" startIcon={processingAction === 'verify' ? <CircularProgress size={18} color="inherit" /> : <HighlightOffIcon />} onClick={() => setRejectDialogOpen(true)} disabled={!!processingAction} className={processingAction === 'verify' ? 'btn-loading' : ''} sx={{ fontWeight: 'bold' }}>Reject</Button>
                        <Button variant="contained" color="success" startIcon={processingAction === 'verify' ? <CircularProgress size={18} color="inherit" /> : null} onClick={() => handleVerify('Approve')} disabled={!!processingAction} className={processingAction === 'verify' ? 'btn-loading' : ''} sx={{ fontWeight: 'bold', px: 4, borderRadius: 2 }}>Verify & Approve</Button>
                    </>
                )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* --- REJECTION DIALOG --- */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Rejection Reason</DialogTitle>
        <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>This will be sent to the resident's dashboard.</Typography>
            <TextField fullWidth multiline rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="e.g. ID is expired or blurry, invalid purpose..." variant="filled" sx={{ borderRadius: 2 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRejectDialogOpen(false)} disabled={!!processingAction}>Cancel</Button>
            <Button variant="contained" color="error" startIcon={processingAction === 'verify' ? <CircularProgress size={18} color="inherit" /> : null} onClick={() => handleVerify('Reject')} disabled={!!processingAction} className={processingAction === 'verify' ? 'btn-loading' : ''}>Confirm Rejection</Button>
        </DialogActions>
      </Dialog>

      {/* --- PAYMENT MODAL --- */}
      <Dialog open={paymentModalOpen} onClose={handleCloseAll} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        {selectedReq && (
            <>
                <DialogTitle sx={{ bgcolor: theme.palette.success.main, color: 'white', textAlign: 'center', fontWeight: '900' }}>
                    ENCODE COLLECTION
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ textAlign: 'center', mb: 4, mt: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL AMOUNT DUE</Typography>
                        <Typography variant="h2" fontWeight="900" color="#b91c1c">₱{selectedReq.base_fee}</Typography>
                    </Box>
                    <Stack spacing={3}>
                        <TextField 
                            label="OR Number" fullWidth required autoFocus
                            value={paymentData.or_number} onChange={(e) => setPaymentData({...paymentData, or_number: e.target.value})} 
                            InputProps={{ startAdornment: <InputAdornment position="start"><NumbersOutlinedIcon color="primary"/></InputAdornment> }} 
                        />
                        <TextField 
                            label="Amount Received" type="number" fullWidth required 
                            value={paymentData.amount_received} onChange={(e) => setPaymentData({...paymentData, amount_received: e.target.value})} 
                            InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }} 
                        />
                        
                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: changeDue >= 0 ? '#f0fdf4' : '#fef2f2', textAlign: 'center', border: '1px solid', borderColor: changeDue >= 0 ? '#bcf0da' : '#fecaca', borderRadius: 3 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight="bold">CHANGE TO RESIDENT</Typography>
                            <Typography variant="h4" fontWeight="900" color={changeDue >= 0 ? "success.main" : "error.main"}>₱{changeDue.toFixed(2)}</Typography>
                        </Paper>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCloseAll} color="inherit">Cancel</Button>
                    <Button 
                        variant="contained" color="success" size="large" fullWidth
                        onClick={handleProcessPayment} 
                        disabled={changeDue < 0 || !paymentData.or_number || !!processingAction}
                        startIcon={processingAction === 'payment' ? <CircularProgress size={20} color="inherit" /> : null}
                        className={processingAction === 'payment' ? 'btn-loading' : ''}
                        sx={{ fontWeight: 'bold', borderRadius: 3 }}
                    >
                        {processingAction === 'payment' ? 'Processing...' : 'Confirm Payment & Process'}
                    </Button>
                </DialogActions>
            </>
        )}
      </Dialog>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}