import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress, Alert, Tooltip, IconButton, Button
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import api from '../../utils/axios';

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        console.log("FETCHING REQUESTS STARTED...");
        const response = await api.get('/requests/resident/me');
        console.log("SERVER DATA RECEIVED:", response.data.data);
        setRequests(response.data.data);
      } catch (err) {
        setError('Failed to load your request history. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRequests();
  }, []);

  const getStatusChip = (status, rejectionReason) => {
    let color = 'default';
    switch (status) {
      case 'Pending': color = 'warning'; break;
      case 'For Verification': color = 'info'; break;
      case 'For Payment': color = 'secondary'; break;
      case 'Processing': color = 'primary'; break;
      case 'Ready for Pickup': color = 'success'; break;
      case 'Issued': color = 'default'; break;
      case 'Rejected': color = 'error'; break;
      case 'Cancelled': color = 'error'; break;
      default: color = 'default';
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />
        {status === 'Rejected' && rejectionReason && (
          <Tooltip title={`Reason: ${rejectionReason}`} arrow placement="top">
            <IconButton size="small" color="error">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
        My Document Requests
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track the real-time status of your requested barangay documents.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography sx={{ mt: 3, fontWeight: 'medium' }} color="text.secondary">
            Fetching your records...
          </Typography>
        </Box>
      ) : requests.length === 0 ? (
        /* MODERN EMPTY STATE UI */
        <Paper 
          elevation={0} 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            borderRadius: 4, 
            border: '2px dashed', 
            borderColor: 'divider',
            bgcolor: 'rgba(0,0,0,0.01)'
          }}
        >
          <InboxOutlinedIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
            No Requests Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            It looks like you haven't requested any barangay documents yet. When you file a request, you will be able to track its progress right here.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate('/resident/wizard')}
            sx={{ px: 4, py: 1.5, borderRadius: 8, fontWeight: 'bold' }}
          >
            Start a New Request
          </Button>
        </Paper>
      ) : (
        /* DATA TABLE UI */
        <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reference No.</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Document Type</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date Requested</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pickup Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((row) => (
                <TableRow key={row.request_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                    {row.reference_no}
                  </TableCell>
                  <TableCell>{row.type_name}</TableCell>
                  <TableCell>
                    {new Date(row.date_requested).toLocaleDateString('en-PH', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(row.request_status, row.rejection_reason)}
                  </TableCell>
                  <TableCell>
                    {row.pickup_date 
                      ? new Date(row.pickup_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) 
                      : <Typography variant="caption" color="text.secondary">TBD</Typography>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}