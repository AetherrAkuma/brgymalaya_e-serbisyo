import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Chip, Paper 
} from '@mui/material';

const TransactionHistory = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/requests/history`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setRequests(res.data.data);
            } catch (err) {
                console.error("Failed to load history");
            }
        };
        fetchHistory();
    }, []);

    const getStatusColor = (status) => {
        if (status === 'Pending') return 'warning';
        if (status === 'Approved') return 'success';
        return 'default';
    };

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
                                    <TableCell>{new Date(row.request_date).toLocaleDateString()}</TableCell>
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