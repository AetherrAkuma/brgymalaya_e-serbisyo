import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Box, Alert, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { adminAPI } from '../../services/api';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openExemptModal, setOpenExemptModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form states
  const [paymentFormData, setPaymentFormData] = useState({
    amount_paid: 0,
    or_number: '',
    payor_name: '',
    payment_status: 'Paid'
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // This would need a proper endpoint in the API
      // For now, we'll simulate by fetching requests with payment status
      const response = await adminAPI.getPendingRequests();
      if (response.data.status === 'success') {
        setPayments(response.data.data.filter(req => req.request_status === 'For Payment'));
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = (request) => {
    setSelectedRequest(request);
    setPaymentFormData({
      amount_paid: request.base_fee || 0,
      or_number: '',
      payor_name: `${request.first_name} ${request.last_name}`,
      payment_status: 'Paid'
    });
    setOpenPaymentModal(true);
  };

  const handleExemptPayment = (request) => {
    setSelectedRequest(request);
    setOpenExemptModal(true);
  };

  const submitPayment = async () => {
    try {
      await adminAPI.processPayment({
        request_id: selectedRequest.request_id,
        amount_paid: paymentFormData.amount_paid,
        or_number: paymentFormData.or_number,
        payor_name: paymentFormData.payor_name,
        payment_status: paymentFormData.payment_status
      });
      setSuccess('Payment processed successfully!');
      setOpenPaymentModal(false);
      fetchPayments();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.error || 'Failed to process payment.');
    }
  };

  const submitExemption = async () => {
    try {
      await adminAPI.exemptPayment(selectedRequest.request_id, `${selectedRequest.first_name} ${selectedRequest.last_name}`);
      setSuccess('Payment exempted successfully!');
      setOpenExemptModal(false);
      fetchPayments();
    } catch (err) {
      console.error('Error exempting payment:', err);
      setError(err.response?.data?.error || 'Failed to exempt payment.');
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Unpaid': return 'warning';
      case 'Refunded': return 'error';
      case 'Exempted': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payment Processing
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Reference No</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((request) => (
                <TableRow key={request.request_id}>
                  <TableCell>{request.reference_no}</TableCell>
                  <TableCell>{request.first_name} {request.last_name}</TableCell>
                  <TableCell>{request.type_name}</TableCell>
                  <TableCell>₱{request.base_fee}</TableCell>
                  <TableCell>
                    <Chip 
                      label="For Payment" 
                      color="info"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="contained" 
                        size="small"
                        onClick={() => handleProcessPayment(request)}
                      >
                        Process Payment
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleExemptPayment(request)}
                      >
                        Exempt Payment
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Payment Modal */}
      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)}>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Request: {selectedRequest?.reference_no} - {selectedRequest?.type_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Applicant: {selectedRequest?.first_name} {selectedRequest?.last_name}
          </Typography>
          
          <TextField
            label="Amount Paid"
            type="number"
            value={paymentFormData.amount_paid}
            onChange={(e) => setPaymentFormData({...paymentFormData, amount_paid: parseFloat(e.target.value)})}
            fullWidth
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            label="OR Number"
            value={paymentFormData.or_number}
            onChange={(e) => setPaymentFormData({...paymentFormData, or_number: e.target.value})}
            fullWidth
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            label="Payor Name"
            value={paymentFormData.payor_name}
            onChange={(e) => setPaymentFormData({...paymentFormData, payor_name: e.target.value})}
            fullWidth
            sx={{ mb: 2 }}
            required
          />
          
          <FormControl fullWidth>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={paymentFormData.payment_status}
              label="Payment Status"
              onChange={(e) => setPaymentFormData({...paymentFormData, payment_status: e.target.value})}
            >
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Unpaid">Unpaid</MenuItem>
              <MenuItem value="Refunded">Refunded</MenuItem>
              <MenuItem value="Exempted">Exempted</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitPayment}>
            Process Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Exemption Modal */}
      <Dialog open={openExemptModal} onClose={() => setOpenExemptModal(false)}>
        <DialogTitle>Exempt Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Request: {selectedRequest?.reference_no} - {selectedRequest?.type_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Applicant: {selectedRequest?.first_name} {selectedRequest?.last_name}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to exempt this payment? This will mark the document as free of charge.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExemptModal(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={submitExemption}
          >
            Confirm Exemption
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPayments;