import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, CircularProgress, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, InputAdornment, Grid, Divider, Alert
} from '@mui/material';

// Modern Icons
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import NumbersOutlinedIcon from '@mui/icons-material/NumbersOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

import api from '../../utils/axios';

export default function PaymentsQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Encoding States
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ or_number: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { 
    fetchQueue(); 
  }, []);

  const fetchQueue = async () => {
    try {
      // Fetch all requests and strictly filter for those awaiting payment
      const res = await api.get('/admin/requests');
      const payableRequests = res.data.data.filter(req => req.request_status === 'For Payment');
      setQueue(payableRequests);
    } catch (err) { 
      console.error("Failed to fetch payment queue", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleOpenModal = (req) => {
    setSelectedReq(req);
    // Auto-fill the amount to the base fee to speed up the Treasurer's workflow
    setPaymentData({ or_number: '', amount: req.base_fee || '' });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedReq(null);
    setPaymentData({ or_number: '', amount: '' });
  };

  const handleProcessPayment = async () => {
    if (!paymentData.or_number || !paymentData.amount) {
      return alert("Both OR Number and Amount are required to finalize the transaction.");
    }
    
    setIsSubmitting(true);
    try {
      await api.put(`/payments/${selectedReq.request_id}`, {
        or_number: paymentData.or_number,
        amount_paid: paymentData.amount
      });
      handleCloseModal();
      fetchQueue(); // Refresh the queue to remove the processed request
    } catch (err) { 
      alert(err.response?.data?.message || "Payment processing failed. Please try again."); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto', animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentsOutlinedIcon fontSize="large" color="success" /> 
        Treasurer's Collection Desk
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Securely encode Official Receipts (OR) and finalize payments to queue documents for printing.
      </Typography>

      {/* THE PAYMENTS TABLE */}
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: 'success.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tracking No.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Payor (Resident)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Requested Document</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount Due</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="subtitle1" color="text.secondary">No pending payments in the queue.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              queue.map((row) => (
                <TableRow key={row.request_id} hover>
                  <TableCell fontWeight="bold" color="primary.main">{row.reference_no}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{row.first_name} {row.last_name}</Typography>
                  </TableCell>
                  <TableCell>{row.type_name}</TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold" color="error.main">
                      ₱{row.base_fee}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="contained" 
                      color="success" 
                      startIcon={<ReceiptLongOutlinedIcon />}
                      onClick={() => handleOpenModal(row)}
                      sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                    >
                      Encode Payment
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* THE RECEIPT ENCODING MODAL */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        {selectedReq && (
          <>
            <DialogTitle sx={{ bgcolor: 'success.main', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaymentsOutlinedIcon /> Official Receipt Encoding
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 0 }}>
              
              {/* SECTION 1: Read-Only Transaction Summary */}
              <Box sx={{ p: 3, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Transaction Summary</Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Tracking Number</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedReq.reference_no}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Document Type</Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary.main">{selectedReq.type_name}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                      <PersonOutlineIcon fontSize="small" /> Payor Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedReq.first_name} {selectedReq.last_name}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* SECTION 2: The Treasurer's Exclusive Inputs */}
              <Box sx={{ p: 4 }}>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  Please collect <strong>₱{selectedReq.base_fee}</strong> and enter the Official Receipt details below to clear this document for printing.
                </Alert>

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="text.primary">
                  1. Enter Official Receipt (OR) Number
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="e.g. OR-998273"
                  value={paymentData.or_number}
                  onChange={(e) => setPaymentData({ ...paymentData, or_number: e.target.value })}
                  sx={{ mb: 4, bgcolor: '#fff', '& .MuiOutlinedInput-root': { fontSize: '1.2rem', fontWeight: 'bold' } }}
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start"><NumbersOutlinedIcon color="primary" /></InputAdornment>
                  }}
                />

                <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="text.primary">
                  2. Confirm Amount Received
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  variant="outlined"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { fontSize: '1.2rem', fontWeight: 'bold', color: 'error.main' } }}
                  InputProps={{ 
                    startAdornment: <InputAdornment position="start"><Typography variant="h6" color="error">₱</Typography></InputAdornment>
                  }}
                />
              </Box>

            </DialogContent>
            
            <DialogActions sx={{ p: 2, px: 3, bgcolor: '#fafafa' }}>
              <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 'bold' }}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                size="large"
                onClick={handleProcessPayment}
                disabled={!paymentData.or_number || !paymentData.amount || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                sx={{ borderRadius: 2, fontWeight: 'bold', px: 4 }}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Payment & Finalize'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}