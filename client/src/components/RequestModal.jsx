import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
    Grid, // <--- Correct Import
    Chip, Divider, Box, TextField, CircularProgress, Alert 
} from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';

const RequestModal = ({ open, handleClose, request, refreshData }) => {
    const userRole = localStorage.getItem('role') || 'Admin'; 

    // STATES
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectField, setShowRejectField] = useState(false);
    
    // TREASURER STATES
    const [paymentDetails, setPaymentDetails] = useState({ or_number: '', amount: '' });
    const [showPaymentFields, setShowPaymentFields] = useState(false);
    
    // IMAGE STATE
    const [imageSrc, setImageSrc] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);

    // RESET ON OPEN
    useEffect(() => {
        if (open) {
            setShowRejectField(false);
            setShowPaymentFields(false);
            setPaymentDetails({ or_number: '', amount: '' });
            setRejectReason('');
            if (request && request.base_fee) {
                setPaymentDetails(prev => ({ ...prev, amount: request.base_fee }));
            }
        }
    }, [open, request]);

    // FETCH IMAGE
    useEffect(() => {
        if (open && request && request.attachment_found) {
            fetchSecureImage(request.attachment_found);
        } else {
            setImageSrc(null);
        }
    }, [open, request]);

    const fetchSecureImage = async (filename) => {
        setLoadingImage(true);
        setImageSrc(null); // Reset
        try {
            const token = localStorage.getItem('token');
            
            // NOTE: We removed 'responseType: blob' because we now expect JSON
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/admin/file/${filename}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Directly set the Base64 string as the source
                console.log("Image loaded successfully!");
                setImageSrc(response.data.image);
            } else {
                console.error("Server returned success: false");
            }
        } catch (err) {
            console.error("Failed to load image:", err);
            // Optional: Set a placeholder error image here
        } finally {
            setLoadingImage(false);
        }
    };

    if (!request) return null;

    const handleStatusUpdate = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            const payload = { 
                status: newStatus, 
                reason: rejectReason,
                or_number: newStatus === 'Approved' ? paymentDetails.or_number : null,
                amount_paid: newStatus === 'Approved' ? paymentDetails.amount : null
            };

            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/admin/requests/${request.request_id}/status`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Success: Request marked as ${newStatus}`);
            refreshData(); 
            handleClose(); 
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update status.");
        }
    };

    const isSecretary = userRole === 'Secretary' || userRole === 'Admin'; 
    const isTreasurer = userRole === 'Treasurer' || userRole === 'Admin';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Request #{request.reference_no}</Typography>
                    <Typography variant="caption" color="textSecondary">Role: {userRole}</Typography>
                </Box>
                <Chip label={request.request_status} color="primary" />
            </DialogTitle>

            <DialogContent dividers>
                {/* --- THE FIX: Using 'size' prop for Grid --- */}
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="primary">RESIDENT</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {request.first_name} {request.last_name}
                        </Typography>
                        <Typography variant="body2">{request.address_street}</Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="subtitle2" color="primary">DETAILS</Typography>
                        <Typography variant="body1" fontWeight="bold">{request.type_name}</Typography>
                        <Typography variant="body2">Purpose: {request.purpose}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                            Fee: ₱{request.base_fee}
                        </Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* IMAGE VIEWER */}
                <Typography variant="subtitle2" gutterBottom>REQUIREMENT (SECURE VIEW)</Typography>
                <Box sx={{ p: 2, bgcolor: '#eeeeee', textAlign: 'center', borderRadius: 1, minHeight: '150px' }}>
                    {loadingImage ? <CircularProgress /> : imageSrc ? (
                        <img src={imageSrc} alt="Requirement" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                    ) : <Typography variant="body2">No file attached.</Typography>}
                </Box>

                {/* TREASURER FIELDS */}
                {showPaymentFields && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="primary">TREASURER PAYMENT ENTRY</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    fullWidth label="OR Number" required
                                    value={paymentDetails.or_number}
                                    onChange={(e) => setPaymentDetails({...paymentDetails, or_number: e.target.value})}
                                />
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    fullWidth label="Amount (₱)" type="number"
                                    value={paymentDetails.amount}
                                    InputProps={{ readOnly: true }} 
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* REJECTION FIELD */}
                {showRejectField && (
                    <TextField
                        fullWidth label="Reason for Rejection" margin="normal"
                        value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                        color="error"
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose}>Close</Button>

                {isSecretary && request.request_status === 'Pending' && (
                    <Button variant="contained" color="warning" onClick={() => handleStatusUpdate('ForPayment')}>
                        Verify & Bill
                    </Button>
                )}

                {isSecretary && request.request_status === 'Pending' && !showRejectField && (
                    <Button color="error" onClick={() => setShowRejectField(true)}>Reject</Button>
                )}

                {showRejectField && (
                    <Button variant="contained" color="error" onClick={() => handleStatusUpdate('Rejected')}>Confirm Rejection</Button>
                )}

                {isTreasurer && request.request_status === 'ForPayment' && !showPaymentFields && (
                    <Button variant="contained" color="success" onClick={() => setShowPaymentFields(true)}>Process Payment</Button>
                )}
                
                {isTreasurer && showPaymentFields && (
                    <Button variant="contained" color="success" disabled={!paymentDetails.or_number} onClick={() => handleStatusUpdate('Approved')}>Confirm Payment</Button>
                )}

                {isSecretary && request.request_status === 'Approved' && (
                    <Button variant="contained" color="primary" onClick={() => handleStatusUpdate('Completed')}>Release Document</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RequestModal;