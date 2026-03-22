import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, 
    Grid,
    Chip, Divider, Box, TextField, CircularProgress, Alert 
} from '@mui/material';
import { useState, useEffect } from 'react';
import { adminAPI, fileAPI } from '../services/api';

const RequestModal = ({ open, handleClose, request, refreshData }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'Admin'; 

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
        if (open && request && request.id_proof_image) {
            fetchSecureImage(request.id_proof_image);
        } else {
            setImageSrc(null);
        }
    }, [open, request]);

    const fetchSecureImage = async (filename) => {
        setLoadingImage(true);
        setImageSrc(null);
        try {
            const response = await fileAPI.getFile(filename);
            // Convert arraybuffer to base64
            const base64 = btoa(
                new Uint8Array(response.data).reduce(
                    (data, byte) => data + String.fromCharCode(byte),
                    ''
                )
            );
            const mimeType = filename.includes('.png') ? 'image/png' : 'image/jpeg';
            setImageSrc(`data:${mimeType};base64,${base64}`);
        } catch (err) {
            console.error("Failed to load image:", err);
        } finally {
            setLoadingImage(false);
        }
    };

    if (!request) return null;

    const handleVerify = async (action) => {
        try {
            await adminAPI.verifyRequest(request.request_id, action, rejectReason);
            alert(`Success: Request ${action === 'Approve' ? 'approved' : 'rejected'}`);
            refreshData();
            handleClose();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update status.");
        }
    };

    const handlePayment = async () => {
        try {
            await adminAPI.processPayment({
                request_id: request.request_id,
                amount_paid: parseFloat(paymentDetails.amount),
                or_number: paymentDetails.or_number,
                payor_name: `${request.first_name} ${request.last_name}`,
                payment_status: 'Paid'
            });
            alert('Success: Payment processed');
            refreshData();
            handleClose();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to process payment.");
        }
    };

    const handleReadyForPickup = async () => {
        try {
            await adminAPI.markReadyForPickup(request.request_id);
            alert('Success: Document marked as Ready for Pickup');
            refreshData();
            handleClose();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to update status.");
        }
    };

    const handleIssue = async () => {
        try {
            await adminAPI.issueDocument(request.request_id);
            alert('Success: Document issued');
            refreshData();
            handleClose();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to issue document.");
        }
    };

    const isSecretary = userRole === 'Secretary' || userRole === 'Super Admin'; 
    const isTreasurer = userRole === 'Treasurer' || userRole === 'Super Admin';

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
                    <Button variant="contained" color="warning" onClick={() => handleVerify('Approve')}>
                        Approve
                    </Button>
                )}

                {isSecretary && request.request_status === 'Pending' && !showRejectField && (
                    <Button color="error" onClick={() => setShowRejectField(true)}>Reject</Button>
                )}

                {showRejectField && (
                    <Button variant="contained" color="error" onClick={() => handleVerify('Reject')}>Confirm Rejection</Button>
                )}

                {isTreasurer && request.request_status === 'For Payment' && !showPaymentFields && (
                    <Button variant="contained" color="success" onClick={() => setShowPaymentFields(true)}>Process Payment</Button>
                )}
                
                {isTreasurer && showPaymentFields && (
                    <Button variant="contained" color="success" disabled={!paymentDetails.or_number} onClick={handlePayment}>Confirm Payment</Button>
                )}

                {isSecretary && request.request_status === 'Processing' && (
                    <Button variant="contained" color="primary" onClick={handleReadyForPickup}>Mark Ready for Pickup</Button>
                )}

                {isSecretary && request.request_status === 'Ready for Pickup' && (
                    <Button variant="contained" color="success" onClick={handleIssue}>Issue Document</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RequestModal;