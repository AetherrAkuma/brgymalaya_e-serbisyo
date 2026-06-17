import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, Alert, 
  Stack, Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions, Card, CardContent, Grid, Divider, IconButton 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RestoreIcon from '@mui/icons-material/Restore';
import BackupIcon from '@mui/icons-material/Backup';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import api from '../../utils/axios';

export default function BackupManagement() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Dialog states
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/backups');
      setBackups(res.data.data || []);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to fetch database backup list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await api.post('/admin/backups/create');
      setMsg({ type: 'success', text: res.data.message || 'Backup created successfully.' });
      fetchBackups();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create database backup.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (filename) => {
    setMsg(null);
    try {
      const res = await api.get(`/admin/backups/download/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Error downloading the backup file.' });
    }
  };

  const handleDeleteClick = (backup) => {
    setSelectedBackup(backup);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setOpenDeleteDialog(false);
    if (!selectedBackup) return;

    setActionLoading(true);
    setMsg(null);
    try {
      await api.delete(`/admin/backups/${selectedBackup.filename}`);
      setMsg({ type: 'success', text: `Backup file ${selectedBackup.filename} deleted successfully.` });
      fetchBackups();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to delete backup.' });
    } finally {
      setActionLoading(false);
      setSelectedBackup(null);
    }
  };

  const handleRestoreClick = (backup) => {
    setSelectedBackup(backup);
    setOpenRestoreDialog(true);
  };

  const handleConfirmRestore = async () => {
    setOpenRestoreDialog(false);
    if (!selectedBackup) return;

    setActionLoading(true);
    setMsg(null);
    try {
      await api.post(`/admin/backups/restore/${selectedBackup.filename}`);
      setMsg({ 
        type: 'success', 
        text: `System successfully restored to backup version: ${selectedBackup.filename}. All data has been synchronized.` 
      });
      fetchBackups();
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.error || 'System restoration failed.' });
    } finally {
      setActionLoading(false);
      setSelectedBackup(null);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const totalSize = backups.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Backup & System Recovery</Typography>
        <Button 
          variant="contained" 
          startIcon={<BackupIcon />} 
          onClick={handleCreateBackup}
          disabled={actionLoading || loading}
          sx={{ py: 1.2, px: 3, fontWeight: 'bold', borderRadius: 2 }}
        >
          Create New Backup
        </Button>
      </Stack>

      {msg && <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }}>{msg.text}</Alert>}

      {actionLoading && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} color="inherit" />
            <Typography variant="body2">System operation is in progress. Please do not close this tab...</Typography>
          </Stack>
        </Alert>
      )}

      {/* --- STATISTICS CARDS --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">TOTAL BACKUPS SAVED</Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: '#0f172a' }}>{backups.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">TOTAL STORAGE USED</Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: '#3b82f6' }}>{formatBytes(totalSize)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 3, boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">AUTO-BACKUP STATUS</Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, color: '#10b981' }}>Daily</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* --- BACKUP FILES TABLE --- */}
      <Paper sx={{ width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Backup Filename</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">Created At</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">File Size</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No system backup files found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((row) => (
                  <TableRow key={row.filename} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{row.filename}</TableCell>
                    <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{formatBytes(row.size)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button 
                          size="small"
                          variant="outlined" 
                          startIcon={<CloudDownloadIcon />} 
                          onClick={() => handleDownload(row.filename)}
                          disabled={actionLoading}
                        >
                          Download
                        </Button>
                        <Button 
                          size="small"
                          variant="outlined" 
                          color="warning"
                          startIcon={<RestoreIcon />} 
                          onClick={() => handleRestoreClick(row)}
                          disabled={actionLoading}
                        >
                          Restore
                        </Button>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteClick(row)}
                          disabled={actionLoading}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* --- CONFIRM RESTORE DIALOG --- */}
      <Dialog open={openRestoreDialog} onClose={() => setOpenRestoreDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main', fontWeight: 'bold' }}>
          <HelpOutlineIcon /> System Restoration Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You are about to restore the system from the backup file: <strong>{selectedBackup?.filename}</strong>.
          </DialogContentText>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <strong>CRITICAL WARNING:</strong> This will completely overwrite all active database tables and uploads with the backup's data. Any modifications made since this backup was created will be permanently lost.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmRestore} variant="contained" color="warning" autoFocus>
            Confirm & Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- CONFIRM DELETE DIALOG --- */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>Delete Backup File</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete the backup file <strong>{selectedBackup?.filename}</strong>? This file cannot be recovered.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete File
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
