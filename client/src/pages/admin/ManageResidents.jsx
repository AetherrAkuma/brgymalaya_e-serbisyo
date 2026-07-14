import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, Grid, TextField, InputAdornment, Tooltip, CircularProgress,
  Card, Divider, Stack
} from '@mui/material';

// Icons
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BlockIcon from '@mui/icons-material/Block';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

export default function ManageResidents() {
  const showSnackbar = useSnackbar();
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Processing States
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Secure Image Viewer State
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // --- ROLE-BASED ACCESS CONTROL ---
  const userRole = localStorage.getItem('role') || 'Official';
  
  // Who can activate an account?
  const canActivate = ['Super Admin', 'Captain', 'Admin', 'Secretary'].includes(userRole);
  
  // Who can block or suspend an account?
  const canBlockOrSuspend = ['Super Admin', 'Captain'].includes(userRole);

  useEffect(() => { 
    fetchResidents(); 
  }, []);

  const fetchResidents = async () => {
    try {
      const res = await api.get('/admin/residents');
      setResidents(res.data.data);
      setFilteredResidents(res.data.data);
    } catch (err) { 
      console.error("Failed to fetch residents", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = residents.filter(r => 
      r.first_name.toLowerCase().includes(lowerQuery) || 
      r.last_name.toLowerCase().includes(lowerQuery) ||
      r.email_address.toLowerCase().includes(lowerQuery)
    );
    setFilteredResidents(filtered);
  }, [searchQuery, residents]);

  const handleOpenModal = async (user) => {
    setSelectedUser(user);
    setModalOpen(true);
    
    // Auto-fetch and decrypt ID proof securely
    if (user.id_proof_image) {
      try {
        const response = await api.get(`/admin/view-file/${user.id_proof_image}`, { responseType: 'blob' });
        setPreviewUrl(URL.createObjectURL(response.data));
      } catch (err) {
        console.error("Failed to decrypt ID proof");
      }
    }
  };

  const handleCloseModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setModalOpen(false);
    setSelectedUser(null);
    setPreviewUrl(null);
  };

  const handleUpdateStatus = async (newStatus) => {
    setIsProcessing(true);
    try {
      await api.put(`/admin/residents/${selectedUser.resident_id}/status`, { account_status: newStatus });
      handleCloseModal();
      fetchResidents();
      showSnackbar(`Account status changed to ${newStatus}.`, "success");
    } catch (err) { 
      showSnackbar(err.response?.data?.error || "Failed to update account status.", "error"); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleRejectRegistration = async () => {
    if (!rejectReason.trim()) return showSnackbar("Please provide a reason.", "warning");
    setIsProcessing(true);
    try {
      await api.put(`/admin/residents/${selectedUser.resident_id}/reject`, { rejection_reason: rejectReason });
      setRejectDialogOpen(false);
      setRejectReason('');
      handleCloseModal();
      fetchResidents();
      showSnackbar("Registration rejected. Resident has been notified.", "success");
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Failed to reject registration.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'warning';
      case 'Active': return 'success';
      case 'Blocked': return 'error';
      default: return 'default';
    }
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HowToRegIcon fontSize="large" color="primary" /> 
        Resident Management
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Verify identities and manage portal access for barangay constituents.
      </Typography>

      {/* SEARCH BAR */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search residents by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 4, bgcolor: '#fff' }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
        }}
      />

      {/* RESIDENTS TABLE (Desktop) */}
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3, overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Street Address</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Account Status</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResidents.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No residents found.</TableCell></TableRow>
            ) : (
              filteredResidents.map((row) => (
                <TableRow key={row.resident_id} hover>
                  <TableCell sx={{ fontWeight: 'bold' }}>{row.first_name} {row.last_name}</TableCell>
                  <TableCell>{row.email_address}</TableCell>
                  <TableCell>{row.address_street}</TableCell>
                  <TableCell>
                    <Chip label={row.account_status} color={getStatusColor(row.account_status)} size="small" sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Button 
                      variant="outlined" 
                      color="primary"
                      size="small" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenModal(row)}
                      sx={{ borderRadius: 2 }}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredResidents.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
            <Typography color="text.secondary">No residents found.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredResidents.map((row) => (
              <Card key={row.resident_id} variant="outlined" sx={{ borderRadius: 3, p: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">{row.first_name} {row.last_name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{row.email_address}</Typography>
                  </Box>
                  <Chip label={row.account_status} color={getStatusColor(row.account_status)} size="small" sx={{ fontWeight: 'bold' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  <strong>Address:</strong> {row.address_street}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => handleOpenModal(row)}
                    startIcon={<VisibilityIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                  >
                    View Profile
                  </Button>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* VERIFICATION MODAL */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth disableRestoreFocus>
        {selectedUser && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
              Resident Profile Review
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <Grid container sx={{ minHeight: 400 }}>
                
                {/* Left Side: Profile Information */}
                <Grid size={{ xs: 12, md: 5 }} sx={{ p: 3, borderRight: '1px solid #ddd', bgcolor: '#fafafa' }}>
                  <Typography variant="overline" color="text.secondary" fontWeight="bold">Personal Information</Typography>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {selectedUser.first_name} {selectedUser.middle_name || ''} {selectedUser.last_name}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                    <Typography variant="body2" fontWeight="500" gutterBottom>{selectedUser.email_address}</Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block">Address</Typography>
                    <Typography variant="body2" fontWeight="500" gutterBottom>{selectedUser.address_street}</Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>Current Status</Typography>
                    <Chip label={selectedUser.account_status} color={getStatusColor(selectedUser.account_status)} sx={{ fontWeight: 'bold', mt: 0.5 }} />
                  </Box>
                </Grid>

                {/* Right Side: Secure ID Viewer */}
                <Grid size={{ xs: 12, md: 7 }} sx={{ bgcolor: '#2c3e50', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                  <Typography variant="overline" color="white" sx={{ mb: 1, opacity: 0.7 }}>Secure ID Vault</Typography>
                  
                  {selectedUser.id_proof_image ? (
                    previewUrl ? (
                      <Box sx={{ flexGrow: 1, width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: 2 }}>
                        <img src={previewUrl} alt="ID Proof" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                      </Box>
                    ) : (
                      <CircularProgress color="inherit" sx={{ color: 'white' }} />
                    )
                  ) : (
                    <Typography color="#95a5a6" textAlign="center">
                      No Identity Document uploaded.<br/>Account should not be activated.
                    </Typography>
                  )}
                  {selectedUser.account_status === 'Pending' && selectedUser.id_proof_image && (
                    <Typography variant="caption" color="#94a3b8" sx={{ mt: 1.5, textAlign: 'center', opacity: 0.75 }}>
                      This ID proof is automatically deleted from the server after the configured retention period for data privacy compliance.
                    </Typography>
                  )}
                </Grid>

              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, bgcolor: '#fff' }}>
              <Button onClick={handleCloseModal} color="inherit" sx={{ mr: 'auto', fontWeight: 'bold' }}>Close</Button>
              
              {/* 🛡️ CAPTAIN & SUPER ADMIN ONLY: Block or Set Pending */}
              {canBlockOrSuspend && (
                <>
                  {selectedUser.account_status !== 'Blocked' && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={() => handleUpdateStatus('Blocked')}
                      disabled={isProcessing}
                      startIcon={<BlockIcon />}
                    >
                      Block Account
                    </Button>
                  )}

                  {selectedUser.account_status !== 'Pending' && (
                    <Button 
                      variant="outlined" 
                      color="warning" 
                      onClick={() => handleUpdateStatus('Pending')}
                      disabled={isProcessing}
                      startIcon={<PendingIcon />}
                    >
                      Set to Pending
                    </Button>
                  )}
                </>
              )}

              {/* REJECT REGISTRATION: For Pending residents */}
              {selectedUser.account_status === 'Pending' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isProcessing}
                  startIcon={<HighlightOffIcon />}
                >
                  Reject Registration
                </Button>
              )}
              
              {/* 🛡️ ADMIN, SECRETARY, CAPTAIN, SUPER ADMIN: Activate */}
              {canActivate && selectedUser.account_status !== 'Active' && (
                <Tooltip 
                  title={!selectedUser.id_proof_image ? "Account cannot be activated: Missing ID Proof." : ""} 
                  placement="top"
                  arrow
                >
                  {/* The span is required by MUI to trigger tooltips on disabled elements */}
                  <span> 
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={() => handleUpdateStatus('Active')}
                      disabled={!selectedUser.id_proof_image || isProcessing}
                      startIcon={isProcessing && selectedUser?.account_status === 'Pending' ? <CircularProgress size={20} color="inherit" /> : <VerifiedUserIcon />}
                      className={isProcessing ? 'btn-loading' : ''}
                      sx={{ fontWeight: 'bold' }}
                    >
                      Approve & Activate
                    </Button>
                  </span>
                </Tooltip>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* REJECT REGISTRATION DIALOG */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth disableRestoreFocus PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HighlightOffIcon color="error" /> Reject Registration
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This resident's registration will be blocked. They will be notified via email with the reason below.
          </Typography>
          <TextField fullWidth required multiline rows={3} label="Reason for Rejection"
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Blurry or invalid ID, incomplete information..." variant="filled" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectRegistration} disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : <HighlightOffIcon />}
            className={isProcessing ? 'btn-loading' : ''} sx={{ fontWeight: 'bold' }}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}