import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, Divider, Stack, TextField, InputAdornment
} from '@mui/material';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import PrintIcon from '@mui/icons-material/Print';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

import api from '../../utils/axios';

export default function RequestsQueue() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal States
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  
  // Data States
  const [extraFiles, setExtraFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Payment State
  const [paymentData, setPaymentData] = useState({ or_number: '', amount_received: '' });

  // Role Control
  const userRole = localStorage.getItem('role') || 'Official';
  const isSecretaryOrAdmin = ['Secretary', 'Super Admin'].includes(userRole);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/admin/requests');
      setRequests(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCloseAll = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setReviewModalOpen(false);
    setPaymentModalOpen(false);
    setRejectDialogOpen(false);
    setSelectedReq(null);
    setPreviewUrl(null);
    setPaymentData({ or_number: '', amount_received: '' });
  };

  // --- MODAL TRIGGERS ---
  const handleOpenReview = async (req) => {
    setSelectedReq(req);
    setReviewModalOpen(true);
    try {
      const res = await api.get(`/admin/request-files/${req.reference_no}`);
      setExtraFiles(res.data.files);
    } catch (err) { console.error(err); }
  };

  const handleOpenPayment = (req) => {
    setSelectedReq(req);
    setPaymentData({ or_number: '', amount_received: req.base_fee || '' });
    setPaymentModalOpen(true);
  };

  const handlePreview = async (filename) => {
    if (!filename) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    try {
      const response = await api.get(`/admin/view-file/${filename}`, { responseType: 'blob' });
      setPreviewUrl(URL.createObjectURL(response.data));
      setPreviewType(filename.toLowerCase().includes('.pdf') ? 'pdf' : 'image');
    } catch (err) { alert("Could not decrypt file for viewing."); }
  };

  // --- ACTION HANDLERS ---
  const handleVerifyRequest = async () => {
    setIsProcessing(true);
    try {
      await api.put(`/requests/${selectedReq.request_id}/verify`, { action: 'Approve' });
      handleCloseAll();
      fetchRequests();
    } catch (err) { alert("Verification failed."); } 
    finally { setIsProcessing(false); }
  };

  const handleRejectRequest = async () => {
    if (!rejectionReason.trim()) return alert("Provide a rejection reason.");
    setIsProcessing(true);
    try {
      await api.put(`/requests/${selectedReq.request_id}/verify`, { action: 'Reject', rejection_reason: rejectionReason });
      handleCloseAll();
      fetchRequests();
    } catch (err) { alert("Rejection failed."); } 
    finally { setIsProcessing(false); }
  };

  const handleProcessPayment = async () => {
    if (!paymentData.or_number || !paymentData.amount_received) return alert("Required fields missing.");
    if (Number(paymentData.amount_received) < Number(selectedReq.base_fee)) return alert("Amount received is less than the fee.");
    
    setIsProcessing(true);
    try {
      await api.put(`/payments/${selectedReq.request_id}`, {
        or_number: paymentData.or_number,
        amount_paid: paymentData.amount_received
      });
      handleCloseAll();
      fetchRequests();
    } catch (err) { alert(err.response?.data?.message || "Payment failed."); } 
    finally { setIsProcessing(false); }
  };

  // --- NEW SECRETARY FULFILLMENT HANDLERS ---
  const handleGeneratePDF = async (id, refNo) => {
    setIsProcessing(true);
    try {
      const res = await api.get(`/requests/${id}/generate-pdf`, { responseType: 'blob' });
      
      // Force the browser to download the binary PDF blob
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${refNo}_Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) { 
      alert("Failed to generate PDF. Make sure the document template and Captain's signature are configured."); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleMarkReady = async (id) => {
    setIsProcessing(true);
    try {
      await api.put(`/requests/${id}/ready`);
      handleCloseAll();
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error || "Failed to mark as ready."); } 
    finally { setIsProcessing(false); }
  };

  const handleIssueDocument = async (id) => {
    if (!window.confirm("Confirm issuance: Has the resident physically received the document?")) return;
    setIsProcessing(true);
    try {
      await api.put(`/requests/${id}/issue`);
      handleCloseAll();
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error || "Failed to issue document."); } 
    finally { setIsProcessing(false); }
  };

  // Change Calculator
  const amountDue = selectedReq ? Number(selectedReq.base_fee) : 0;
  const amountReceived = Number(paymentData.amount_received) || 0;
  const changeDue = amountReceived >= amountDue ? amountReceived - amountDue : 0;
  const isPaymentValid = paymentData.or_number && amountReceived >= amountDue;

  const getStatusColor = (status) => {
    const colors = { 'Pending': 'warning', 'For Payment': 'info', 'Processing': 'primary', 'Ready for Pickup': 'secondary', 'Issued': 'success', 'Rejected': 'error' };
    return colors[status] || 'default';
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>Master Requests & Collection Queue</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Verify documents, encode payments, and print certificates from a single unified dashboard.
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tracking No.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Resident Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Document</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fee</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((row) => (
              <TableRow key={row.request_id} hover>
                <TableCell fontWeight="bold" color="primary.main">{row.reference_no}</TableCell>
                <TableCell>{row.first_name} {row.last_name}</TableCell>
                <TableCell>{row.type_name}</TableCell>
                <TableCell>₱{row.base_fee}</TableCell>
                <TableCell><Chip label={row.request_status} color={getStatusColor(row.request_status)} size="small" sx={{ fontWeight: 'bold' }} /></TableCell>
                <TableCell align="center">
                  
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {/* ID Verification */}
                    {row.request_status === 'Pending' && (
                      <Button variant="contained" color="warning" size="small" onClick={() => handleOpenReview(row)} sx={{ borderRadius: 2 }}>Review</Button>
                    )}
                    
                    {/* Treasurer Encoding */}
                    {row.request_status === 'For Payment' && (
                      <Button variant="contained" color="info" size="small" onClick={() => handleOpenPayment(row)} startIcon={<PaymentsOutlinedIcon />} sx={{ borderRadius: 2 }}>Payment</Button>
                    )}
                    
                    {/* 🖨️ SECRETARY FULFILLMENT: Print & Mark Ready */}
                    {row.request_status === 'Processing' && isSecretaryOrAdmin && (
                      <>
                        <Button variant="contained" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2 }} size="small" onClick={() => handleGeneratePDF(row.request_id, row.reference_no)} startIcon={<PrintIcon />} disabled={isProcessing}>
                          Print PDF
                        </Button>
                        <Button variant="contained" color="primary" size="small" onClick={() => handleMarkReady(row.request_id)} startIcon={<TaskAltIcon />} disabled={isProcessing} sx={{ borderRadius: 2 }}>
                          Mark Ready
                        </Button>
                      </>
                    )}

                    {/* 🖨️ SECRETARY FULFILLMENT: Final Issuance */}
                    {row.request_status === 'Ready for Pickup' && isSecretaryOrAdmin && (
                      <Button variant="contained" color="success" size="small" onClick={() => handleIssueDocument(row.request_id)} startIcon={<AssignmentTurnedInIcon />} disabled={isProcessing} sx={{ borderRadius: 2 }}>
                        Issue Document
                      </Button>
                    )}

                    {/* Universal View Button */}
                    {['Processing', 'Ready for Pickup', 'Issued', 'Rejected'].includes(row.request_status) && (
                      <Button variant="outlined" size="small" onClick={() => handleOpenReview(row)} startIcon={<VisibilityIcon />} sx={{ borderRadius: 2 }}>
                        View
                      </Button>
                    )}
                  </Stack>

                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 1. THE VERIFICATION & REVIEW MODAL */}
      <Dialog open={reviewModalOpen} onClose={handleCloseAll} maxWidth="lg" fullWidth>
        {selectedReq && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <InfoOutlinedIcon sx={{ mr: 1, verticalAlign: 'middle' }}/> Reviewing: {selectedReq.reference_no}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <Grid container sx={{ height: '70vh' }}>
                <Grid item xs={12} md={4} sx={{ p: 3, borderRight: '1px solid #ddd', overflowY: 'auto' }}>
                  
                  <Typography variant="subtitle2" color="text.secondary">RESIDENT PROFILE</Typography>
                  <Typography variant="h6" fontWeight="bold">{selectedReq.first_name} {selectedReq.last_name}</Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>{selectedReq.address_street}</Typography>
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>DOCUMENT & PURPOSE</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box>
                      <Typography variant="body1" fontWeight="bold" color="primary.main">{selectedReq.type_name}</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">Fee: ₱{selectedReq.base_fee}</Typography>
                    </Box>
                    {['Processing', 'Ready for Pickup', 'Issued'].includes(selectedReq.request_status) && (
                      <Chip label="Payment Cleared" color="success" size="small" icon={<CheckCircleIcon />} sx={{ fontWeight: 'bold' }} />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1.5, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    {selectedReq.purpose}
                  </Typography>

                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle2" color="text.secondary">ATTACHMENTS</Typography>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Button variant="outlined" startIcon={<FilePresentIcon />} onClick={() => handlePreview(selectedReq.id_proof_image)}>Official ID Proof</Button>
                    {extraFiles.map((file, idx) => (
                      <Button key={idx} variant="text" color="secondary" startIcon={<FilePresentIcon />} onClick={() => handlePreview(file)} sx={{ border: '1px dashed' }}>Requirement {idx + 1}</Button>
                    ))}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={8} sx={{ bgcolor: '#2c3e50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!previewUrl ? <Typography color="#95a5a6">Select a document to preview</Typography> : 
                   previewType === 'image' ? <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : 
                   <iframe src={previewUrl} width="100%" height="100%" style={{ border: 'none' }} />}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
              <Button onClick={handleCloseAll} color="inherit" sx={{ fontWeight: 'bold' }}>Close</Button>
              
              {selectedReq.request_status === 'Pending' && (
                <>
                  <Button variant="outlined" color="error" onClick={() => setRejectDialogOpen(true)} disabled={isProcessing}>Reject Request</Button>
                  <Button variant="contained" color="success" onClick={handleVerifyRequest} disabled={isProcessing}>Verify & Approve</Button>
                </>
              )}

              {/* Secretary Controls inside the modal for convenience */}
              {selectedReq.request_status === 'Processing' && isSecretaryOrAdmin && (
                <>
                  <Button variant="contained" sx={{ bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }} onClick={() => handleGeneratePDF(selectedReq.request_id, selectedReq.reference_no)} startIcon={<PrintIcon />} disabled={isProcessing}>Print PDF</Button>
                  <Button variant="contained" color="primary" onClick={() => handleMarkReady(selectedReq.request_id)} disabled={isProcessing}>Mark Ready for Pickup</Button>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 2. THE REJECTION SUB-MODAL */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Reason for Rejection</DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth multiline rows={3} placeholder="Please provide the exact reason for rejecting this document..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectRequest} disabled={isProcessing}>Confirm Rejection</Button>
        </DialogActions>
      </Dialog>

      {/* 3. THE PAYMENT & CHANGE ENCODING MODAL (Code Unchanged) */}
      <Dialog open={paymentModalOpen} onClose={handleCloseAll} maxWidth="xs" fullWidth>
        {selectedReq && (
          <>
            <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold' }}>
              <PaymentsOutlinedIcon sx={{ mr: 1, verticalAlign: 'middle' }}/> Process Payment
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">Total Amount Due</Typography>
                <Typography variant="h3" fontWeight="bold" color="error.main">₱{amountDue.toFixed(2)}</Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>1. Official Receipt (OR) Number</Typography>
              <TextField fullWidth variant="outlined" placeholder="e.g. OR-998273" sx={{ mb: 3 }} value={paymentData.or_number} onChange={(e) => setPaymentData({ ...paymentData, or_number: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><NumbersOutlinedIcon color="primary" /></InputAdornment> }} />

              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>2. Cash Amount Received</Typography>
              <TextField fullWidth type="number" variant="outlined" sx={{ mb: 3 }} value={paymentData.amount_received} onChange={(e) => setPaymentData({ ...paymentData, amount_received: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }} />

              <Paper elevation={0} sx={{ p: 2, bgcolor: changeDue > 0 ? '#e8f5e9' : '#f5f5f5', border: '1px solid', borderColor: changeDue > 0 ? 'success.main' : 'divider', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" display="flex" justifyContent="space-between" alignItems="center">
                  Change to give Resident:
                  <Typography component="span" variant="h6" fontWeight="bold" color={changeDue > 0 ? "success.main" : "text.primary"}>₱{changeDue.toFixed(2)}</Typography>
                </Typography>
              </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
              <Button onClick={handleCloseAll} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
              <Button variant="contained" color="success" onClick={handleProcessPayment} disabled={!isPaymentValid || isProcessing} sx={{ fontWeight: 'bold' }}>
                {isProcessing ? 'Processing...' : 'Confirm Payment'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}