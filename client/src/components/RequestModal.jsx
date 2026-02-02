import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid, Chip, Divider, Box, TextField, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import axios from 'axios';

const RequestModal = ({ open, handleClose, request, refreshData }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectField, setShowRejectField] = useState(false);
    
    // IMAGE STATE
    const [imageSrc, setImageSrc] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);

    // FETCH SECURE IMAGE WHEN MODAL OPENS
    useEffect(() => {
        if (open && request && request.attachment_found) {
            fetchSecureImage(request.attachment_found);
        } else {
            setImageSrc(null); // Reset if closed or no file
        }
    }, [open, request]);

    const fetchSecureImage = async (filename) => {
        setLoadingImage(true);
        try {
            const token = localStorage.getItem('token');
            // We request the file as a BLOB (Binary Large Object)
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/admin/file/${filename}`,
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob' 
                }
            );
            // Create a temporary URL for the browser to show the image
            const imageUrl = URL.createObjectURL(response.data);
            setImageSrc(imageUrl);
        } catch (err) {
            console.error("Failed to load secure image", err);
        } finally {
            setLoadingImage(false);
        }
    };

    if (!request) return null;

    const handleStatusUpdate = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/admin/requests/${request.request_id}/status`,
                { status: newStatus, reason: rejectReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Request marked as ${newStatus}`);
            refreshData(); 
            handleClose(); 
        } catch (err) {
            alert("Failed to update status");
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            {/* HEADER */}
            <DialogTitle sx={{ bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Request #{request.reference_no}</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Filed on: {new Date(request.date_requested).toLocaleDateString()}
                    </Typography>
                </Box>
                <Chip label={request.request_status} color="primary" />
            </DialogTitle>

            {/* BODY CONTENT */}
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="primary">RESIDENT DETAILS</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {request.first_name} {request.last_name}
                        </Typography>
                        <Typography variant="body2">{request.address_street}</Typography>
                        <Typography variant="body2">{request.contact_number}</Typography>
                    </Grid>

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

                {/* FILE VIEWER (THE SECURE LENS) */}
                <Typography variant="subtitle2" gutterBottom>ATTACHED REQUIREMENT</Typography>
                <Box sx={{ p: 2, bgcolor: '#eeeeee', textAlign: 'center', borderRadius: 1, minHeight: '150px' }}>
                    {loadingImage ? (
                        <CircularProgress size={30} />
                    ) : imageSrc ? (
                        <img 
                            src={imageSrc} 
                            alt="Secure Requirement" 
                            style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }} 
                        />
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            {request.attachment_found ? "Error loading file." : "No file attached."}
                        </Typography>
                    )}
                </Box>

                {/* REJECTION FIELD */}
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

            {/* ACTION BUTTONS */}
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} color="inherit">Close</Button>
                
                {request.request_status !== 'Rejected' && !showRejectField && (
                    <Button color="error" onClick={() => setShowRejectField(true)}>Reject</Button>
                )}

                {showRejectField && (
                    <Button variant="contained" color="error" onClick={() => handleStatusUpdate('Rejected')}>
                        Confirm Rejection
                    </Button>
                )}

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