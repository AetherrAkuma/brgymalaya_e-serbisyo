import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Button, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { adminAPI } from '../../services/api';

const AdminDocumentTypes = () => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    type_name: '',
    description: '',
    base_fee: 0,
    requirements: '',
    validity_days: 180,
    is_available: true
  });

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings(); // This should be adminAPI.getDocumentTypes() but we'll use settings for now
      // TODO: Implement proper getDocumentTypes endpoint in adminAPI
      setDocumentTypes([]); // Placeholder
    } catch (err) {
      console.error('Error fetching document types:', err);
      setError('Failed to load document types.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      type_name: '',
      description: '',
      base_fee: 0,
      requirements: '',
      validity_days: 180,
      is_available: true
    });
    setOpenAddModal(true);
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      type_name: doc.type_name,
      description: doc.description,
      base_fee: doc.base_fee,
      requirements: doc.requirements,
      validity_days: doc.validity_days,
      is_available: doc.is_available
    });
    setOpenEditModal(true);
  };

  const handleSubmit = async (isEdit = false) => {
    try {
      if (isEdit) {
        await adminAPI.updateDocumentType(editingDoc.doc_type_id, formData);
        setSuccess('Document type updated successfully!');
      } else {
        await adminAPI.createDocumentType(formData);
        setSuccess('Document type created successfully!');
      }
      
      setOpenAddModal(false);
      setOpenEditModal(false);
      fetchDocumentTypes();
    } catch (err) {
      console.error('Error submitting document type:', err);
      setError(err.response?.data?.error || 'Failed to save document type.');
    }
  };

  const handleLayoutConfig = async (docId) => {
    const layoutConfig = prompt('Enter layout configuration (JSON format):', '{}');
    if (layoutConfig) {
      try {
        await adminAPI.updateLayoutConfig(docId, JSON.parse(layoutConfig));
        setSuccess('Layout configuration updated successfully!');
        fetchDocumentTypes();
      } catch (err) {
        setError('Failed to update layout configuration. Please check JSON format.');
      }
    }
  };

  const handleTemplateUpload = async (docId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await adminAPI.uploadTemplate(docId, file);
          setSuccess('Template uploaded successfully!');
          fetchDocumentTypes();
        } catch (err) {
          setError('Failed to upload template.');
        }
      }
    };
    
    fileInput.click();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Document Types Management
        </Typography>
        <Button variant="contained" onClick={handleAdd}>
          Add Document Type
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        documentTypes.map((doc) => (
          <Card key={doc.doc_type_id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{doc.type_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fee: ₱{doc.base_fee} | Validity: {doc.validity_days} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {doc.is_available ? 'Available' : 'Not Available'}
                  </Typography>
                </Box>
                <Box>
                  <Button size="small" onClick={() => handleEdit(doc)} sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button size="small" onClick={() => handleLayoutConfig(doc.doc_type_id)} sx={{ mr: 1 }}>
                    Layout Config
                  </Button>
                  <Button size="small" onClick={() => handleTemplateUpload(doc.doc_type_id)}>
                    Upload Template
                  </Button>
                </Box>
              </Box>
              {doc.description && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {doc.description}
                </Typography>
              )}
              {doc.requirements && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Requirements: {doc.requirements}
                </Typography>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Add Document Type Modal */}
      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <DialogTitle>Add New Document Type</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Document Name"
              value={formData.type_name}
              onChange={(e) => setFormData({...formData, type_name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Base Fee"
              type="number"
              value={formData.base_fee}
              onChange={(e) => setFormData({...formData, base_fee: parseFloat(e.target.value)})}
              fullWidth
            />
            <TextField
              label="Validity Days"
              type="number"
              value={formData.validity_days}
              onChange={(e) => setFormData({...formData, validity_days: parseInt(e.target.value)})}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_available}
                  onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                />
              }
              label="Available"
            />
          </Box>
          <TextField
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Requirements (comma-separated)"
            value={formData.requirements}
            onChange={(e) => setFormData({...formData, requirements: e.target.value})}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleSubmit(false)}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Document Type Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <DialogTitle>Edit Document Type</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Document Name"
              value={formData.type_name}
              onChange={(e) => setFormData({...formData, type_name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Base Fee"
              type="number"
              value={formData.base_fee}
              onChange={(e) => setFormData({...formData, base_fee: parseFloat(e.target.value)})}
              fullWidth
            />
            <TextField
              label="Validity Days"
              type="number"
              value={formData.validity_days}
              onChange={(e) => setFormData({...formData, validity_days: parseInt(e.target.value)})}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_available}
                  onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                />
              }
              label="Available"
            />
          </Box>
          <TextField
            label="Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Requirements (comma-separated)"
            value={formData.requirements}
            onChange={(e) => setFormData({...formData, requirements: e.target.value})}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleSubmit(true)}>Update</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDocumentTypes;