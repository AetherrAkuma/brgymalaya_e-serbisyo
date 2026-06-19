import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, CircularProgress, Alert, Tooltip, IconButton, 
  Button, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, 
  Stack, Grid, Card, Divider
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

export default function MyRequests() {
  const showSnackbar = useSnackbar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const response = await api.get('/requests/resident/me');
        setRequests(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (err) {
        setError('Failed to load your request history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyRequests();
    if (searchParams.get('submitted') === 'true') {
      setTimeout(() => showSnackbar("Your request has been submitted successfully. You can track its status below.", "success"), 100);
      navigate('/resident/requests', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🛠️ FILTERING LOGIC
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch = (req.reference_no?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                            (req.type_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || req.type_name === typeFilter;
      const matchesStatus = statusFilter === 'All' || req.request_status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter, requests]);

  // Unique types for the dropdown
  const docTypes = ['All', ...new Set(requests.map(r => r.type_name))];
  const statuses = ['All', 'Pending', 'For Verification', 'For Payment', 'Processing', 'Ready for Pickup', 'Issued', 'Rejected', 'Cancelled'];

  const getStatusChip = (status, reason) => {
    const colors = { 
      'Pending': 'warning', 
      'For Verification': 'info', 
      'For Payment': 'secondary', 
      'Processing': 'primary', 
      'Ready for Pickup': 'success', 
      'Issued': 'default', 
      'Rejected': 'error',
      'Cancelled': 'default'
    };
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={status} color={colors[status] || 'default'} size="small" sx={{ fontWeight: 'bold' }} />
        {status === 'Rejected' && reason && (
          <Tooltip title={`Reason: ${reason}`} arrow>
            <IconButton size="small" color="error">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: { xs: 2, md: 4 }, pb: 5 }}>
      
      {/* HEADER & PRIMARY ACTION */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        spacing={2} 
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight="800" color="text.primary">My Requests</Typography>
          <Typography variant="body2" color="text.secondary">View and manage your document applications.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => navigate('/resident/wizard')}
          sx={{ borderRadius: 3, px: 3, py: 1.2, fontWeight: 'bold', boxShadow: 3 }}
        >
          New Request
        </Button>
      </Stack>

      {/* FILTER BAR */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Reference # or Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>),
                sx: { borderRadius: 2, bgcolor: 'white' }
              }}
            />
          </Grid>
          <Grid item xs={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select 
                label="Document Type" 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: 'white' }}
              >
                {docTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select 
                label="Status" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2, bgcolor: 'white' }}
              >
                {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">Loading records...</Typography>
        </Box>
      ) : filteredRequests.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 10, textAlign: 'center', borderRadius: 4, borderStyle: 'dashed', bgcolor: 'transparent' }}>
          <InboxOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No requests found.</Typography>
          <Button variant="text" onClick={() => { setSearchTerm(''); setTypeFilter('All'); setStatusFilter('All'); }}>
            Clear All Filters
          </Button>
        </Paper>
      ) : (
        <>
          {/* Desktop Table View */}
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reference No.</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Document Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date Filed</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Pickup Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((row) => (
                  <TableRow key={row.request_id} hover>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{row.reference_no}</TableCell>
                    <TableCell>{row.type_name}</TableCell>
                    <TableCell>
                      {new Date(row.date_requested).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{getStatusChip(row.request_status, row.rejection_reason)}</TableCell>
                    <TableCell align="right">
                      {row.pickup_date 
                        ? <Typography fontWeight="500">{new Date(row.pickup_date).toLocaleDateString()}</Typography>
                        : <Typography variant="caption" color="text.secondary">TBD</Typography>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Card List View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={2}>
              {filteredRequests.map((row) => (
                <Card key={row.request_id} variant="outlined" sx={{ borderRadius: 3, p: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
                      {row.reference_no}
                    </Typography>
                    {getStatusChip(row.request_status, row.rejection_reason)}
                  </Box>
                  <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                    {row.type_name}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'text.secondary', fontSize: '0.85rem' }}>
                    <Box>
                      <Typography variant="caption" display="block">Filed Date</Typography>
                      <Typography variant="body2" fontWeight="500">
                        {new Date(row.date_requested).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" display="block">Pickup Date</Typography>
                      <Typography variant="body2" fontWeight="500">
                        {row.pickup_date 
                          ? new Date(row.pickup_date).toLocaleDateString()
                          : 'TBD'}
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
}