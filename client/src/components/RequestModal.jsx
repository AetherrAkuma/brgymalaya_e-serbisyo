import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Chip, Divider, Box, TextField } from '@mui/material';
import { useState } from 'react';
import axios from 'axios';

const RequestModal = ({ open, handleClose, request, refreshData }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectField, setShowRejectField] = useState(false);

    if (!request) return null;

    // Helper to send status updates
    const handleStatusUpdate = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/admin/requests/${request.request_id}/status`,
                { status: newStatus, reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Request marked as ${newStatus}`);
            refreshData(); // Reload the table
            handleClose(); // Close the modal
        } catch (err) {
            alert("Failed to update status");
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {/* 1. HEADER */}
            <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Request #{request.reference_no}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Filed on: {new Date(request.date_requested).toLocaleDateString()}
                    </Typography>
                </Box>
                <Chip label={request.request_status} color="primary" />
            </DialogTitle>

            {/* 2. BODY CONTENT */}
            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* LEFT: Resident Info */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="primary">RESIDENT DETAILS</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {request.first_name} {request.last_name}
                        </Typography>
                        <Typography variant="body2">{request.address_street}</Typography>
                        <Typography variant="body2">{request.contact_number}</Typography>
                        <Typography variant="body2">Status: {request.civil_status}</Typography>
                    </Grid>

                    {/* RIGHT: Document Info */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="primary">REQUEST DETAILS</Typography>
                        <Typography variant="body1" fontWeight="bold">{request.type_name}</Typography>
                        <Typography variant="body2">Purpose: {request.purpose}</Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                            Fee: ₱{request.base_fee}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* 3. FILE VIEWER PLACEHOLDER (Phase 5.6b) */}
                <Box sx={{ p: 2, bgcolor: '#eeeeee', textAlign: 'center', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                        [ Attached Files will appear here in the next update ]
                    </Typography>
                </Box>

                {/* REJECTION REASON FIELD */}
                {showRejectField && (
                    <TextField
                        fullWidth
                        label="Reason for Rejection"
                        margin="normal"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                )}
            </DialogContent>

            {/* 4. ACTION BUTTONS */}
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} color="inherit">Close</Button>
                
                {/* Logic: Only show 'Reject' if not already rejected */}
                {request.request_status !== 'Rejected' && !showRejectField && (
                    <Button color="error" onClick={() => setShowRejectField(true)}>
                        Reject
                    </Button>
                )}

                {/* Show Confirm Reject if field is open */}
                {showRejectField && (
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={() => handleStatusUpdate('Rejected')}
                    >
                        Confirm Rejection
                    </Button>
                )}

                {/* APPROVE / PROCESS BUTTONS */}
                {request.request_status === 'Pending' && (
                    <Button variant="contained" color="warning" onClick={() => handleStatusUpdate('ForPayment')}>
                        Verify & Request Payment
                    </Button>
                )}

                {request.request_status === 'ForPayment' && (
                    <Button variant="contained" color="success" onClick={() => handleStatusUpdate('Approved')}>
                        Confirm Payment
                    </Button>
                )}
                
                {request.request_status === 'Approved' && (
                    <Button variant="contained" color="primary" onClick={() => handleStatusUpdate('Completed')}>
                        Release Document
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RequestModal;