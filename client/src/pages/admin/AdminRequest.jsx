import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
    TableHead, TableRow, Chip, IconButton, Button, Tabs, Tab, Alert, CircularProgress 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import RequestModal from '../../components/RequestModal'; 

const AdminRequests = () => {
    // 1. IDENTITY CHECK
    const userRole = localStorage.getItem('role') || 'Admin'; 

    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterTab, setFilterTab] = useState(userRole === 'Treasurer' ? 'ForPayment' : 'All');
    const [loading, setLoading] = useState(false);

    // 2. FETCH DATA
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRequests(res.data.requests);
            }
        } catch (err) {
            console.error("Failed to load queue", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // 3. ROLE-BASED FILTERING (Internal Control)
    const getFilteredRequests = () => {
        if (userRole === 'Treasurer') {
            // Treasurer can ONLY see payments to be processed
            return requests.filter(r => r.request_status === 'ForPayment'); 
        }
        if (filterTab === 'All') return requests;
        return requests.filter(r => r.request_status === filterTab);
    };

    const handleOpen = (req) => {
        setSelectedRequest(req);
        setModalOpen(true);
    };

    const handleClose = () => {
        setModalOpen(false);
        setSelectedRequest(null);
    };

    const filteredData = getFilteredRequests();

    return (
        <Box sx={{ p: 3 }}>
            {/* HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    {userRole === 'Treasurer' ? '💸 Financial Transaction Queue' : '📂 Document Request Queue'}
                </Typography>
                <Button startIcon={<RefreshIcon />} onClick={fetchRequests} variant="outlined">
                    Refresh
                </Button>
            </Box>

            {/* ROLE ALERT */}
            {userRole === 'Treasurer' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Treasurer Mode Active:</strong> Showing unpaid transactions only.
                </Alert>
            )}

            {/* TABS (Hidden for Treasurer) */}
            {userRole !== 'Treasurer' && (
                <Paper sx={{ mb: 2 }}>
                    <Tabs 
                        value={filterTab} 
                        onChange={(e, newVal) => setFilterTab(newVal)}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="All" value="All" />
                        <Tab label="Pending" value="Pending" />
                        <Tab label="For Payment" value="ForPayment" />
                        <Tab label="Approved" value="Approved" />
                        <Tab label="Completed" value="Completed" />
                    </Tabs>
                </Paper>
            )}

            {/* DATA TABLE */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>Ref No.</strong></TableCell>
                            <TableCell><strong>Resident</strong></TableCell>
                            <TableCell><strong>Document</strong></TableCell>
                            <TableCell><strong>Date Filed</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Action</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((req) => (
                                <TableRow key={req.request_id} hover>
                                    <TableCell>{req.reference_no}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {req.resident_name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{req.type_name}</TableCell>
                                    <TableCell>{new Date(req.date_requested).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={req.request_status} 
                                            color={
                                                req.request_status === 'Pending' ? 'warning' :
                                                req.request_status === 'ForPayment' ? 'info' :
                                                req.request_status === 'Approved' ? 'success' : 'default'
                                            } 
                                            size="small" 
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => handleOpen(req)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <Typography color="textSecondary">
                                        {userRole === 'Treasurer' ? "No pending payments found." : "No requests found."}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODAL */}
            <RequestModal 
                open={modalOpen} 
                handleClose={handleClose} 
                request={selectedRequest}
                refreshData={fetchRequests} 
            />
        </Box>
    );
};

export default AdminRequests;