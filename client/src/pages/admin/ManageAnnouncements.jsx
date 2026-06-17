import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, FormControlLabel, Switch, Stack, IconButton 
} from '@mui/material';

// Icons
import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';

import api from '../../utils/axios';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // FORM STATE: We keep content_text and external_link separate for the user interface
  const [formData, setFormData] = useState({
    title: '', content_text: '', target_audience: 'All', 
    status: 'Published', is_pinned: false, expiry_date: '',
    image_path: '', external_link: ''
  });

  const userRole = localStorage.getItem('role') || 'Official';
  const canDelete = ['Super Admin', 'Captain'].includes(userRole);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data.data);
    } catch (err) { console.error("Failed to fetch announcements", err); }
  };

  // --- THE PARSER: Splits DB content into text and link ---
  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setEditingId(announcement.announcement_id);
      
      const formattedDate = announcement.expiry_date 
        ? new Date(announcement.expiry_date).toISOString().split('T')[0] : '';

      // Split the content_body using our secret separator
      const parts = announcement.content_body.split('|||LINK|||');
      const extractedText = parts[0] || '';
      const extractedLink = parts[1] || '';

      setFormData({
        title: announcement.title,
        content_text: extractedText,
        target_audience: announcement.target_audience,
        status: announcement.status,
        is_pinned: announcement.is_pinned === 1,
        expiry_date: formattedDate,
        image_path: announcement.image_path || '',
        external_link: extractedLink
      });
    } else {
      setEditingId(null);
      setFormData({ 
        title: '', content_text: '', target_audience: 'All', status: 'Published', 
        is_pinned: false, expiry_date: '', image_path: '', external_link: '' 
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  // --- THE MERGER: Combines text and link before saving to DB ---
  const handleSubmit = async () => {
    if (!formData.title || !formData.content_text) return alert("Title and Content are required.");
    setIsSubmitting(true);
    
    // Combine them into a single string for the database's content_body column
    const mergedContentBody = formData.external_link.trim() !== '' 
      ? `${formData.content_text}|||LINK|||${formData.external_link}`
      : formData.content_text;

    const payload = {
      title: formData.title,
      content_body: mergedContentBody, 
      target_audience: formData.target_audience,
      status: formData.status,
      is_pinned: formData.is_pinned,
      expiry_date: formData.expiry_date,
      image_path: formData.image_path
    };

    try {
      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, payload);
      } else {
        await api.post('/admin/announcements', payload);
      }
      handleCloseModal();
      fetchAnnouncements();
    } catch (err) { alert(err.response?.data?.error || "Failed to save announcement."); }
    finally { setIsSubmitting(false); }
  };

  // Quick Action Handlers
  const handleToggleStatus = async (id, currentStatus, currentPinned) => {
    const newStatus = currentStatus === 'Published' ? 'Archived' : 'Published';
    try {
      await api.put(`/admin/announcements/${id}`, { status: newStatus, is_pinned: currentPinned });
      fetchAnnouncements();
    } catch (err) { alert("Failed to update status."); }
  };

  const handleTogglePin = async (id, currentStatus, currentPinned) => {
    try {
      await api.put(`/admin/announcements/${id}`, { status: currentStatus, is_pinned: !currentPinned });
      fetchAnnouncements();
    } catch (err) { alert("Failed to update pin status."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) { alert("Failed to delete announcement."); }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Published': return 'success';
      case 'Draft': return 'warning';
      case 'Archived': return 'default';
      default: return 'primary';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3, animation: 'fadeIn 0.5s' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CampaignIcon fontSize="large" color="primary" /> 
            Broadcast Center
          </Typography>
          <Typography color="text.secondary">Manage barangay news, alerts, and public advisories.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenModal()} sx={{ borderRadius: 2, fontWeight: 'bold' }}>
          New Announcement
        </Button>
      </Box>

      {/* ANNOUNCEMENTS TABLE */}
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Audience</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date Posted</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No announcements found.</TableCell></TableRow>
            ) : (
              announcements.map((row) => (
                <TableRow key={row.announcement_id} hover sx={{ bgcolor: row.is_pinned ? '#fffbeb' : 'inherit' }}>
                  <TableCell>
                    <Typography fontWeight="bold" display="flex" alignItems="center" gap={1}>
                      {row.is_pinned === 1 && <PushPinIcon color="warning" fontSize="small" />}
                      {row.title}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.target_audience}</TableCell>
                  <TableCell>{new Date(row.date_posted).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={row.status} color={getStatusColor(row.status)} size="small" sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpenModal(row)}>
                        <EditIcon />
                      </IconButton>
                      <Button size="small" variant="outlined" color={row.status === 'Published' ? "warning" : "success"} onClick={() => handleToggleStatus(row.announcement_id, row.status, row.is_pinned)}>
                        {row.status === 'Published' ? 'Archive' : 'Publish'}
                      </Button>
                      <IconButton size="small" color={row.is_pinned ? "warning" : "default"} onClick={() => handleTogglePin(row.announcement_id, row.status, row.is_pinned)}>
                        <PushPinIcon />
                      </IconButton>
                      {canDelete && (
                        <IconButton size="small" color="error" onClick={() => handleDelete(row.announcement_id)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* CREATE / EDIT MODAL */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold' }}>
          {editingId ? 'Edit Announcement' : 'Draft New Announcement'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            
            <TextField label="Announcement Title" fullWidth required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            
            <TextField label="Content Body" fullWidth required multiline rows={5} value={formData.content_text} onChange={(e) => setFormData({...formData, content_text: e.target.value})} />
            
            <Stack direction="row" spacing={2}>
              <TextField select label="Target Audience" fullWidth value={formData.target_audience} onChange={(e) => setFormData({...formData, target_audience: e.target.value})}>
                <MenuItem value="All">All Users</MenuItem>
                <MenuItem value="Residents">Residents Only</MenuItem>
                <MenuItem value="Officials">Officials Only</MenuItem>
              </TextField>

              <TextField select label="Status" fullWidth value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <MenuItem value="Published">Published (Live)</MenuItem>
                <MenuItem value="Draft">Draft (Hidden)</MenuItem>
                <MenuItem value="Archived">Archived</MenuItem>
              </TextField>
            </Stack>

            {/* ATTACHMENTS SECTION */}
            <Typography variant="overline" color="text.secondary" fontWeight="bold">Optional Attachments</Typography>
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Image URL" 
                placeholder="e.g. https://imgur.com/image.jpg" 
                fullWidth 
                value={formData.image_path} 
                onChange={(e) => setFormData({...formData, image_path: e.target.value})} 
              />
              <TextField 
                label="Redirect Link" 
                placeholder="e.g. https://facebook.com/barangay" 
                fullWidth 
                value={formData.external_link} 
                onChange={(e) => setFormData({...formData, external_link: e.target.value})} 
              />
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <FormControlLabel 
                control={<Switch checked={formData.is_pinned} onChange={(e) => setFormData({...formData, is_pinned: e.target.checked})} color="warning" />} 
                label={<Typography fontWeight="bold">Pin to Top</Typography>} 
              />
              <TextField 
                type="date" 
                label="Expiry Date (Optional)" 
                InputLabelProps={{ shrink: true }} 
                value={formData.expiry_date} 
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} 
                size="small" 
              />
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
          <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting} sx={{ fontWeight: 'bold' }}>
            {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Publish Broadcast')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}