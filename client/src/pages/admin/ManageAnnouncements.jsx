import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, FormControlLabel, Switch, Stack, 
  IconButton, CircularProgress, Alert, Tooltip, Divider
} from '@mui/material';

import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PushPinIcon from '@mui/icons-material/PushPin';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArticleIcon from '@mui/icons-material/Article';

import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

const STATUS_CONFIG = {
  'Published': { color: 'success', label: 'Published' },
  'Pending Approval': { color: 'info', label: 'Awaiting Approval' },
  'Draft': { color: 'warning', label: 'Draft' },
  'Archived': { color: 'default', label: 'Archived' }
};

export default function ManageAnnouncements() {
  const showSnackbar = useSnackbar();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionReasons, setRejectionReasons] = useState({}); // { announcement_id: reason_string }
  const [imageFile, setImageFile] = useState(null);       // File object pending upload
  const [imagePreview, setImagePreview] = useState('');   // local blob or server URL for preview
  const [uploadingImage, setUploadingImage] = useState(false);


  const [formData, setFormData] = useState({
    title: '', content_text: '', target_audience: 'All', 
    status: 'Draft', is_pinned: false, expiry_date: '',
    image_path: '', external_link: ''
  });

  const userRole = localStorage.getItem('role') || 'Official';
  const isCaptainOrSecretary = ['Captain', 'Secretary'].includes(userRole);
  const isAdmin = userRole === 'Admin';
  const canDelete = ['Super Admin', 'Captain'].includes(userRole);

  const pendingItems = announcements.filter(a => a.status === 'Pending Approval');

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/announcements');
      const list = res.data.data;
      setAnnouncements(list);

      // Fetch rejection reasons from AuditLogs for any Draft items (previously rejected)
      // This replaces reading from the dropped rejection_reason column
      const draftIds = list
        .filter(a => a.status === 'Draft')
        .map(a => a.announcement_id);

      if (draftIds.length > 0) {
        const reasonMap = {};
        await Promise.all(draftIds.map(async (id) => {
          try {
            const r = await api.get(`/admin/announcements/${id}/rejection-reason`);
            if (r.data.rejection_reason) reasonMap[id] = r.data.rejection_reason;
          } catch (_) { /* non-critical */ }
        }));
        setRejectionReasons(reasonMap);
      } else {
        setRejectionReasons({});
      }
    } catch (err) { console.error("Failed to fetch announcements", err); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (announcement = null) => {
    setImageFile(null);
    if (announcement) {
      setEditingId(announcement.announcement_id);
      const formattedDate = announcement.expiry_date 
        ? new Date(announcement.expiry_date).toISOString().split('T')[0] : '';
      const parts = (announcement.content_body || '').split('|||LINK|||');
      const existingImage = announcement.image_path || '';
      setImagePreview(existingImage
        ? (existingImage.startsWith('/uploads/')
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1','') || 'http://localhost:3000'}${existingImage}`
            : existingImage)
        : '');
      setFormData({
        title: announcement.title,
        content_text: parts[0] || '',
        target_audience: announcement.target_audience,
        status: announcement.status,
        is_pinned: announcement.is_pinned === 1,
        expiry_date: formattedDate,
        image_path: existingImage,
        external_link: parts[1] || ''
      });
    } else {
      setEditingId(null);
      setImagePreview('');
      setFormData({ 
        title: '', content_text: '', target_audience: 'All', status: 'Draft', 
        is_pinned: false, expiry_date: '', image_path: '', external_link: '' 
      });
    }
    setModalOpen(true);
  };


  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(f => ({ ...f, image_path: '' }));
  };


  const handleSubmit = async () => {
    if (!formData.title || !formData.content_text) return showSnackbar("Title and Content are required.", "warning");
    setIsSubmitting(true);

    try {
      let finalImagePath = formData.image_path || null;

      // If a new image file was selected, upload it first
      if (imageFile) {
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('announcement_image', imageFile);
        const uploadRes = await api.post('/admin/announcements/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImagePath = uploadRes.data.image_path;
        setUploadingImage(false);
      }

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
        image_path: finalImagePath
      };

      if (editingId) {
        await api.put(`/admin/announcements/${editingId}`, payload);
      } else {
        await api.post('/admin/announcements', payload);
      }
      handleCloseModal();
      fetchAnnouncements();
      showSnackbar(editingId ? "Announcement updated." : "Announcement created.", "success");
    } catch (err) { 
      setUploadingImage(false);
      showSnackbar(err.response?.data?.error || err.response?.data?.message || "Failed to save.", "error"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };


  const handleToggleStatus = async (id, currentStatus, currentPinned) => {
    if (isAdmin && currentStatus === 'Pending Approval') {
      return showSnackbar("Awaiting review by Captain or Secretary.", "info");
    }
    const newStatus = currentStatus === 'Published' ? 'Archived' : 'Published';
    try {
      await api.put(`/admin/announcements/${id}`, { status: newStatus, is_pinned: currentPinned });
      fetchAnnouncements();
    } catch (err) { showSnackbar("Failed to update status.", "error"); }
  };

  const handleTogglePin = async (id, currentStatus, currentPinned) => {
    try {
      await api.put(`/admin/announcements/${id}`, { status: currentStatus, is_pinned: !currentPinned });
      fetchAnnouncements();
    } catch (err) { showSnackbar("Failed to update pin status.", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
    try {
      await api.delete(`/admin/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) { showSnackbar("Failed to delete announcement.", "error"); }
  };

  const openRejectDialog = (announcement) => {
    setRejectTarget(announcement);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/announcements/${id}`, { status: 'Published', is_pinned: 0 });
      fetchAnnouncements();
      showSnackbar("Announcement approved and published.", "success");
    } catch (err) { showSnackbar("Failed to approve.", "error"); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return showSnackbar("Please provide a reason.", "warning");
    try {
      await api.put(`/admin/announcements/${rejectTarget.announcement_id}`, {
        status: 'Draft', is_pinned: rejectTarget.is_pinned, rejection_reason: rejectionReason
      });
      setRejectDialogOpen(false);
      setRejectTarget(null);
      fetchAnnouncements();
      showSnackbar("Announcement rejected. Creator has been notified.", "success");
    } catch (err) { showSnackbar(err.response?.data?.error || "Failed to reject.", "error"); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}><CircularProgress /></Box>;

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

      {isCaptainOrSecretary && pendingItems.length > 0 && (
        <Paper elevation={0} sx={{ mb: 3, borderRadius: 3, border: '2px solid', borderColor: '#bfdbfe', bgcolor: '#eff6ff', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, bgcolor: '#dbeafe', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RateReviewIcon sx={{ color: '#1d4ed8' }} />
            <Typography fontWeight="800" color="#1e3a5f">Review Queue — {pendingItems.length} announcement{pendingItems.length > 1 ? 's' : ''} pending approval</Typography>
          </Box>
          <Stack divider={<Divider />}>
            {pendingItems.map(item => (
              <Box key={item.announcement_id} sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">{item.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {item.posted_by_name} &middot; {new Date(item.date_posted).toLocaleDateString()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View details" arrow>
                    <IconButton size="small" color="primary" onClick={() => handleOpenModal(item)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />}
                    onClick={() => handleApprove(item.announcement_id)} sx={{ fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}>
                    Approve
                  </Button>
                  <Button size="small" variant="outlined" color="error" startIcon={<BlockIcon />}
                    onClick={() => openRejectDialog(item)} sx={{ fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}>
                    Reject
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#1e293b' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Author</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Audience</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No announcements yet.</TableCell></TableRow>
            ) : (
              announcements.map((row) => {
                const statusConfig = STATUS_CONFIG[row.status] || { color: 'default', label: row.status };
                const isOwn = row.posted_by === parseInt(localStorage.getItem('user_id'));
                return (
                  <TableRow key={row.announcement_id} hover
                    sx={{
                      bgcolor: row.is_pinned ? '#fffbeb' : 'inherit',
                      opacity: row.status === 'Archived' ? 0.6 : 1
                    }}>
                    <TableCell>
                      <Typography fontWeight="bold" display="flex" alignItems="center" gap={1}>
                        {row.is_pinned === 1 && <PushPinIcon color="warning" fontSize="small" />}
                        {row.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{row.posted_by_name || 'Unknown'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.target_audience} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(row.date_posted).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={statusConfig.label} color={statusConfig.color} size="small" sx={{ fontWeight: 'bold' }} />
                      {row.status === 'Pending Approval' && isOwn && isAdmin && (
                        <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.3, fontStyle: 'italic', fontSize: '0.65rem' }}>
                          Awaiting review
                        </Typography>
                      )}
                      {row.status === 'Draft' && rejectionReasons[row.announcement_id] && isOwn && (
                        <Tooltip title={`Rejected: ${rejectionReasons[row.announcement_id]}`} arrow>
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.3, fontStyle: 'italic', cursor: 'pointer', fontSize: '0.65rem' }}>
                            View rejection reason
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {row.status !== 'Pending Approval' && (
                          <IconButton size="small" color="primary" onClick={() => handleOpenModal(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {row.status !== 'Pending Approval' && (
                          <Button size="small" variant="outlined"
                            color={row.status === 'Published' ? 'warning' : 'success'}
                            onClick={() => handleToggleStatus(row.announcement_id, row.status, row.is_pinned)}
                            sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.3 }}>
                            {row.status === 'Published' ? 'Archive' : 'Publish'}
                          </Button>
                        )}
                        {row.status === 'Pending Approval' && isCaptainOrSecretary && (
                          <>
                            <Button size="small" color="success" onClick={() => handleApprove(row.announcement_id)}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.3, minWidth: 60 }}>
                              Approve
                            </Button>
                            <Button size="small" color="error" onClick={() => openRejectDialog(row)}
                              sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.3, minWidth: 50 }}>
                              Reject
                            </Button>
                          </>
                        )}
                        <IconButton size="small" color={row.is_pinned ? 'warning' : 'default'}
                          onClick={() => handleTogglePin(row.announcement_id, row.status, row.is_pinned)}>
                          <PushPinIcon fontSize="small" />
                        </IconButton>
                        {canDelete && (
                          <IconButton size="small" color="error" onClick={() => handleDelete(row.announcement_id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon /> {editingId ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>

            <Typography variant="overline" fontWeight="800" color="text.secondary" sx={{ letterSpacing: 1 }}>Content</Typography>
            <TextField label="Announcement Title" fullWidth required value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              helperText={`${formData.title.length}/255 characters`} inputProps={{ maxLength: 255 }} />
            <TextField label="Content Body" fullWidth required multiline rows={5}
              value={formData.content_text}
              onChange={(e) => setFormData({...formData, content_text: e.target.value})}
              helperText="This is what residents will see on their dashboard and the public homepage." />

            <Divider />
            <Typography variant="overline" fontWeight="800" color="text.secondary" sx={{ letterSpacing: 1 }}>Media &amp; Link</Typography>

            {/* Image Upload Zone */}
            <Box>
              <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>Announcement Banner Image</Typography>
              {imagePreview ? (
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                    <Button size="small" variant="contained"
                      component="label"
                      sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                      Change
                      <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} />
                    </Button>
                    <Button size="small" variant="contained" color="error"
                      onClick={handleRemoveImage}
                      sx={{ fontSize: '0.7rem' }}>
                      Remove
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  component="label"
                  htmlFor="announcement-image-input"
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '2px dashed #cbd5e1', borderRadius: 2, p: 4, cursor: 'pointer',
                    bgcolor: '#f8fafc', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#3b82f6', bgcolor: '#eff6ff' }
                  }}
                >
                  <Typography variant="body2" fontWeight="600" color="text.secondary" sx={{ mb: 0.5 }}>📷 Click to upload an image</Typography>
                  <Typography variant="caption" color="text.disabled">JPG, PNG, WebP — max 5 MB</Typography>
                  <input id="announcement-image-input" type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} />
                </Box>
              )}
            </Box>

            <TextField label="External Link (Optional)" placeholder="e.g. https://facebook.com/barangay" fullWidth
              value={formData.external_link}
              onChange={(e) => setFormData({...formData, external_link: e.target.value})}
              helperText="Optional — link to a full article, PDF, or social media post." />


            <Divider />
            <Typography variant="overline" fontWeight="800" color="text.secondary" sx={{ letterSpacing: 1 }}>Publishing</Typography>
            {isAdmin ? (
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Switch checked={formData.status === 'Pending Approval'}
                    onChange={(e) => setFormData({...formData, status: e.target.checked ? 'Pending Approval' : 'Draft'})}
                    color="info" />}
                  label={<Box><Typography variant="body2" fontWeight="600">Submit for Approval</Typography>
                    <Typography variant="caption" color="text.secondary">Captain or Secretary must approve before this goes live.</Typography></Box>}
                  sx={{ alignItems: 'flex-start', mx: 0 }} />
                {formData.status === 'Draft' && (
                  <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
                    Saved as draft — only you can see this.
                  </Typography>
                )}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {[
                  { value: 'Draft', label: 'Save as Draft', desc: 'Hidden from public, you can edit later.' },
                  { value: 'Published', label: 'Publish Now', desc: 'Immediately visible to the target audience.' },
                  { value: 'Archived', label: 'Archive', desc: 'Hide from public view.' }
                ].map(opt => (
                  <Button key={opt.value} variant={formData.status === opt.value ? 'contained' : 'outlined'}
                    color={opt.value === 'Published' ? 'success' : opt.value === 'Archived' ? 'default' : 'warning'}
                    onClick={() => setFormData({...formData, status: opt.value})}
                    sx={{ borderRadius: 2, textTransform: 'none', flex: 1, py: 1.5, flexDirection: 'column', gap: 0.3 }}>
                    <Typography variant="body2" fontWeight="700">{opt.label}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>{opt.desc}</Typography>
                  </Button>
                ))}
              </Stack>
            )}

            <Divider />
            <Typography variant="overline" fontWeight="800" color="text.secondary" sx={{ letterSpacing: 1 }}>Display Options</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={<Switch checked={formData.is_pinned} onChange={(e) => setFormData({...formData, is_pinned: e.target.checked})} color="warning" />}
                label={<Box><Typography variant="body2" fontWeight="600">Pin to Top</Typography>
                  <Typography variant="caption" color="text.secondary">Pinned announcements appear first in all lists.</Typography></Box>}
                sx={{ alignItems: 'flex-start', mx: 0 }} />
              <TextField select label="Target Audience" value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})} size="small" sx={{ minWidth: 180 }}>
                <MenuItem value="All">All Users</MenuItem>
                <MenuItem value="Residents">Residents Only</MenuItem>
                <MenuItem value="Officials">Officials Only</MenuItem>
              </TextField>
              <TextField type="date" label="Expiry Date" InputLabelProps={{ shrink: true }}
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} size="small"
                helperText="Optional auto-hide" />
            </Box>

            <Divider />
            <Typography variant="overline" fontWeight="800" color="text.secondary" sx={{ letterSpacing: 1 }}>Preview</Typography>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {formData.is_pinned && <Chip label="PRIORITY" size="small" sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: '800', height: 20, fontSize: '0.6rem' }} />}
                <Chip label={formData.target_audience} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.6rem' }} />
                {!['Captain', 'Secretary'].includes(userRole) && formData.status === 'Pending Approval' && (
                  <Chip label="Awaiting Approval" size="small" color="info" sx={{ height: 20, fontSize: '0.6rem' }} />
                )}
              </Box>
              <Typography variant="subtitle2" fontWeight="700" color="#0f172a">
                {formData.title || 'Untitled Announcement'}
              </Typography>
              <Typography variant="caption" color="#64748b" sx={{
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                lineHeight: 1.5, mt: 0.5
              }}>
                {formData.content_text || 'No content written yet.'}
              </Typography>
            </Paper>

          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fafafa' }}>
          <Button onClick={handleCloseModal} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
          {isAdmin && formData.status === 'Pending Approval' && (
            <Typography variant="caption" color="info.main" sx={{ mr: 1, fontStyle: 'italic' }}>
              Will be submitted for review
            </Typography>
          )}
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting || uploadingImage}
            startIcon={(isSubmitting || uploadingImage) ? <CircularProgress size={20} color="inherit" /> : null}
            className={(isSubmitting || uploadingImage) ? 'btn-loading' : ''} sx={{ fontWeight: 'bold' }}>
            {uploadingImage ? 'Uploading image...' : isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlockIcon color="error" /> Reject Announcement
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This announcement will be returned to Draft. The creator will be notified via email with the reason below.
          </Typography>
          {rejectTarget && (
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
              "{rejectTarget.title}"
            </Typography>
          )}
          <TextField fullWidth required multiline rows={3} label="Reason for Rejection"
            value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Content needs clarification, inappropriate material..." variant="filled" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}
            startIcon={<BlockIcon />} sx={{ fontWeight: 'bold' }}>
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}