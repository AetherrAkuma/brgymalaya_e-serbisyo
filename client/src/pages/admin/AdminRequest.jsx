import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Box, Alert, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { adminAPI } from '../../services/api';

const AdminRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Form states
  const [verifyFormData, setVerifyFormData] = useState({
    action: 'Approve',
    rejection_reason: ''
  });
  const [paymentFormData, setPaymentFormData] = useState({
    amount_paid: 0,
    or_number: '',
    payor_name: '',
    payment_status: 'Paid'
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingRequests();
      if (response.data.status === 'success') {
        setRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (request) => {
    setSelectedRequest(request);
    setVerifyFormData({
      action: 'Approve',
      rejection_reason: ''
    });
    setOpenVerifyModal(true);
  };

  const handlePayment = (request) => {
    setSelectedRequest(request);
    setPaymentFormData({
      amount_paid: request.base_fee || 0,
      or_number: '',
      payor_name: `${request.first_name} ${request.last_name}`,
      payment_status: 'Paid'
    });
    setOpenPaymentModal(true);
  };

  const submitVerification = async () => {
    try {
      await adminAPI.verifyRequest(selectedRequest.request_id, verifyFormData.action, verifyFormData.rejection_reason);
      setSuccess('Request verification updated successfully!');
      setOpenVerifyModal(false);
      fetchRequests();
    } catch (err) {
      console.error('Error verifying request:', err);
      setError(err.response?.data?.error || 'Failed to verify request.');
    }
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
      fetchRequests();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.response?.data?.error || 'Failed to process payment.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'default';
      case 'For Verification': return 'warning';
      case 'For Payment': return 'info';
      case 'Processing': return 'primary';
      case 'Ready for Pickup': return 'success';
      case 'Issued': return 'success';
      case 'Rejected': return 'error';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Document Requests Management
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
        requests.map((request) => (
          <Card key={request.request_id} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">
                    {request.type_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reference: {request.reference_no}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Requested: {new Date(request.date_requested).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip 
                    label={request.request_status} 
                    color={getStatusColor(request.request_status)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Fee: ₱{request.base_fee}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Applicant:</Typography>
                  <Typography variant="body2">{request.first_name} {request.last_name}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Purpose:</Typography>
                  <Typography variant="body2">{request.purpose}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {request.request_status === 'Pending' && (
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handleVerify(request)}
                  >
                    Verify Request
                  </Button>
                )}
                
                {request.request_status === 'For Payment' && (
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={() => handlePayment(request)}
                  >
                    Process Payment
                  </Button>
                )}

                {request.request_status === 'Processing' && (
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={async () => {
                      try {
                        await adminAPI.markReadyForPickup(request.request_id);
                        setSuccess('Request marked as Ready for Pickup!');
                        fetchRequests();
                      } catch (err) {
                        setError('Failed to update request status.');
                      }
                    }}
                  >
                    Mark Ready for Pickup
                  </Button>
                )}

                {request.request_status === 'Ready for Pickup' && (
                  <Button 
                    variant="contained" 
                    size="small"
                    onClick={async () => {
                      try {
                        await adminAPI.issueDocument(request.request_id);
                        setSuccess('Document issued successfully!');
                        fetchRequests();
                      } catch (err) {
                        setError('Failed to issue document.');
                      }
                    }}
                  >
                    Issue Document
                  </Button>
                )}

                {request.rejection_reason && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Rejection Reason: {request.rejection_reason}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Verification Modal */}
      <Dialog open={openVerifyModal} onClose={() => setOpenVerifyModal(false)}>
        <DialogTitle>Verify Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Request: {selectedRequest?.reference_no} - {selectedRequest?.type_name}
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={verifyFormData.action}
              label="Action"
              onChange={(e) => setVerifyFormData({...verifyFormData, action: e.target.value})}
            >
              <MenuItem value="Approve">Approve</MenuItem>
              <MenuItem value="Reject">Reject</MenuItem>
            </Select>
          </FormControl>

          {verifyFormData.action === 'Reject' && (
            <TextField
              label="Rejection Reason"
              multiline
              rows={3}
              value={verifyFormData.rejection_reason}
              onChange={(e) => setVerifyFormData({...verifyFormData, rejection_reason: e.target.value})}
              fullWidth
              required
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVerifyModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitVerification}>
            {verifyFormData.action}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={openPaymentModal} onClose={() => setOpenPaymentModal(false)}>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Request: {selectedRequest?.reference_no} - {selectedRequest?.type_name}
          </Typography>
          
          <TextField
            label="Amount Paid"
            type="number"
            value={paymentFormData.amount_paid}
            onChange={(e) => setPaymentFormData({...paymentFormData, amount_paid: parseFloat(e.target.value)})}
            fullWidth
            sx={{ mb: 2 }}
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
    </Container>
  );
};

export default AdminRequest;