import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, Paper, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, Button, Box, CircularProgress 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RequestModal from '../../components/RequestModal'; // <--- IMPORT MODAL

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // MODAL STATE
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRequests(res.data.requests);
            }
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    // OPEN MODAL FUNCTION
    const handleView = async (id) => {
        try {
            const token = localStorage.getItem('token');
            // Fetch full details
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/requests/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSelectedRequest(res.data.request);
                setIsModalOpen(true);
            }
        } catch (err) {
            alert("Error loading details");
        }
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s === 'pending') return 'warning';
        if (s === 'forpayment') return 'info';
        if (s === 'approved') return 'primary';
        if (s === 'completed' || s === 'released') return 'success';
        if (s === 'rejected') return 'error';
        return 'default';
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    Request Queue
                </Typography>
                <Button variant="contained" onClick={fetchRequests}>Refresh</Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Reference No</strong></TableCell>
                                <TableCell><strong>Resident</strong></TableCell>
                                <TableCell><strong>Type</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell align="center"><strong>Action</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.request_id} hover>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{req.reference_no}</TableCell>
                                    <TableCell>{req.resident_name}</TableCell>
                                    <TableCell>
                                        {req.type_name}
                                        <Typography variant="caption" display="block" color="textSecondary">
                                            {req.purpose}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={req.request_status} 
                                            color={getStatusColor(req.request_status)} 
                                            size="small" 
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(req.date_requested).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => handleView(req.request_id)} // <--- CLICK HANDLER
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* THE POPUP COMPONENT */}
            <RequestModal 
                open={isModalOpen} 
                handleClose={() => setIsModalOpen(false)} 
                request={selectedRequest}
                refreshData={fetchRequests} 
            />
        </Container>
    );
};

export default AdminRequests;