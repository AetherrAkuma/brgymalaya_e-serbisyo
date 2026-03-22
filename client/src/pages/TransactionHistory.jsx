import { useState, useEffect } from 'react';
import { 
    Container, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, Paper, CircularProgress, Box
} from '@mui/material';
import { residentAPI } from '../services/api';

const TransactionHistory = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await residentAPI.getDashboard();
                if (res.data.status === 'success') {
                    setRequests(res.data.data);
                }
            } catch (err) {
                console.error("Failed to load history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'warning';
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>My Transactions</Typography>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell>Reference No</TableCell>
                            <TableCell>Document</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow><TableCell colSpan={4} align="center">No requests found</TableCell></TableRow>
                        ) : (
                            requests.map((row) => (
                                <TableRow key={row.request_id}>
                                    <TableCell><strong>{row.reference_no}</strong></TableCell>
                                    <TableCell>{row.type_name}</TableCell>
                                    <TableCell>{new Date(row.date_requested).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Chip label={row.request_status} color={getStatusColor(row.request_status)} size="small" />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default TransactionHistory;