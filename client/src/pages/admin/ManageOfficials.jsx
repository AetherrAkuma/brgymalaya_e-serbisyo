import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Stack, IconButton, CircularProgress,
  Card, Divider
} from '@mui/material';

// Icons for the Administrative UI
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupsIcon from '@mui/icons-material/Groups';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';

// Modular import from our new utility file
import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

export default function ManageOfficials() {
  const showSnackbar = useSnackbar();
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for the Registration Form - Maps to tbl_barangayofficials
  const [formData, setFormData] = useState({
    official_id: '',
    full_name: '',
    email_official: '',
    username: '',
    password: '',
    role: 'Secretary'
  });

  // Load officials list on component mount
  useEffect(() => {
    fetchOfficials();
  }, []);

  const fetchOfficials = async () => {
    setLoading(true);
    try {
      // Connects to GET /api/v1/admin/officials (Super Admin / Captain access)
      const res = await api.get('/admin/officials');
      setOfficials(res.data.data);
    } catch (err) {
      console.error("Error fetching officials:", err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      // Connects to POST /api/v1/admin/officials
      await api.post('/admin/officials', formData);
      setModalOpen(false);
      setFormData({ official_id: '', full_name: '', email_official: '', username: '', password: '', role: 'Secretary' });
      fetchOfficials();
      showSnackbar("Official account created successfully.", "success");
    } catch (err) {
      showSnackbar(err.response?.data?.error || "Failed to create account.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      // Connects to PUT /api/v1/admin/officials/:id/status
      await api.put(`/admin/officials/${id}/status`, { account_status: nextStatus });
      fetchOfficials();
    } catch (err) {
      showSnackbar("Failed to update status. Check permissions.", "error");
    }
  };

  const handleDelete = async (id, name) => {
    // Explicit confirmation for accountability
    if (window.confirm(`Are you sure you want to PERMANENTLY delete the account for ${name}? This action will be logged in the forensic audit trail.`)) {
      try {
        // Connects to DELETE /api/v1/admin/officials/:id
        await api.delete(`/admin/officials/${id}`);
        fetchOfficials();
      } catch (err) {
        showSnackbar(err.response?.data?.error || "Deletion failed. Ensure you are not deleting your own logged-in account.", "error");
      }
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">Fetching official records...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', animation: 'fadeIn 0.6s' }}>
      
      {/* HEADER SECTION */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupsIcon color="primary" fontSize="large" /> Official Staff Management
          </Typography>
          <Typography color="text.secondary">
            Provision roles and manage system access for Barangay Secretaries, Treasurers, and Admin Staff.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<PersonAddIcon />} 
          onClick={() => setModalOpen(true)}
          sx={{ borderRadius: '12px', fontWeight: 'bold', px: 3, py: 1.2, textTransform: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)' }}
        >
          Authorize New Official
        </Button>
      </Stack>

      {/* STAFF DIRECTORY TABLE (Desktop) */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>OFFICIAL ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>FULL NAME</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>ASSIGNED ROLE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569' }}>ACCESS CONTROL</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {officials.map((o) => (
              <TableRow key={o.user_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BadgeIcon fontSize="small" sx={{ opacity: 0.5 }} />
                    {o.official_id}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{o.full_name}</Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.7 }}>
                    <EmailIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption">{o.email_official}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={o.role} 
                    size="small" 
                    variant="outlined" 
                    color={o.role === 'Captain' ? 'secondary' : 'primary'} 
                    sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }} 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={o.account_status} 
                    size="small" 
                    color={o.account_status === 'Active' ? 'success' : 'default'} 
                    sx={{ fontWeight: 'bold' }} 
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton 
                      color={o.account_status === 'Active' ? 'success' : 'error'}
                      onClick={() => handleToggleStatus(o.user_id, o.account_status)}
                      title={o.account_status === 'Active' ? 'Deactivate Access' : 'Activate Access'}
                      sx={{ bgcolor: o.account_status === 'Active' ? '#f0fdf4' : '#fef2f2', border: '1px solid #e2e8f0' }}
                    >
                      {o.account_status === 'Active' ? <ToggleOnIcon /> : <ToggleOffIcon />}
                    </IconButton>
                    
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(o.user_id, o.full_name)}
                      title="Permanently Delete Account"
                      sx={{ border: '1px solid #fee2e2' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {officials.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <Typography color="text.secondary">No staff accounts managed yet. Click "Authorize New Official" to begin.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mobile Card List View */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {officials.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
            <Typography color="text.secondary">No staff accounts managed yet.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {officials.map((o) => (
              <Card key={o.user_id} variant="outlined" sx={{ borderRadius: 3, p: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <BadgeIcon fontSize="inherit" /> {o.official_id}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">{o.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <EmailIcon sx={{ fontSize: 12 }} /> {o.email_official}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      label={o.role} 
                      size="small" 
                      variant="outlined" 
                      color={o.role === 'Captain' ? 'secondary' : 'primary'} 
                      sx={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.6rem' }} 
                    />
                    <Chip 
                      label={o.account_status} 
                      size="small" 
                      color={o.account_status === 'Active' ? 'success' : 'default'} 
                      sx={{ fontWeight: 'bold' }} 
                    />
                  </Stack>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    color={o.account_status === 'Active' ? 'warning' : 'success'}
                    onClick={() => handleToggleStatus(o.user_id, o.account_status)}
                    startIcon={o.account_status === 'Active' ? <ToggleOffIcon /> : <ToggleOnIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                  >
                    {o.account_status === 'Active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleDelete(o.user_id, o.full_name)}
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                  >
                    Delete
                  </Button>
                </Box>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* REGISTRATION MODAL */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="sm" disableRestoreFocus PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f8fafc', py: 2.5 }}>Register Authorized Official</DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              label="Official ID Number" fullWidth required
              placeholder="e.g., BRGY-SEC-001"
              value={formData.official_id} onChange={(e) => setFormData({...formData, official_id: e.target.value})} 
            />
            <TextField 
              label="Full Name" fullWidth required
              placeholder="Complete Name of Official"
              value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
            />
            <TextField 
              label="Official Email" fullWidth required type="email"
              placeholder="official@barangay.gov.ph"
              value={formData.email_official} onChange={(e) => setFormData({...formData, email_official: e.target.value})} 
            />
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Username" fullWidth required
                value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} 
              />
              <TextField 
                select label="System Role" fullWidth required
                value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <MenuItem value="Secretary">Secretary</MenuItem>
                <MenuItem value="Treasurer">Treasurer</MenuItem>
                <MenuItem value="Captain">Barangay Captain</MenuItem>
                <MenuItem value="Admin">Admin / Clerk</MenuItem>
              </TextField>
            </Stack>
            <TextField 
              label="Temporary Password" type="password" fullWidth required
              helperText="The official will be required to update this upon first login."
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setModalOpen(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreate} 
            disabled={isSubmitting || !formData.official_id || !formData.username || !formData.password}
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            className={isSubmitting ? 'btn-loading' : ''}
            sx={{ fontWeight: 'bold', px: 4, borderRadius: '8px' }}
          >
            {isSubmitting ? 'Provisioning Access...' : 'Register Official Account'}
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}