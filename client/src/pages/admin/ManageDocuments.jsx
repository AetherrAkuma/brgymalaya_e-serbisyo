import { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, IconButton, InputAdornment, Switch,
  FormControlLabel, CircularProgress, Alert
} from '@mui/material';

// Icons
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PrintIcon from '@mui/icons-material/Print';

import api from '../../utils/axios';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

const DEFAULT_LAYOUT = {
  name: { x: 100, y: 200 },
  purpose: { x: 70, y: 300 }, // Renamed from 'body'
  signature: { x: 380, y: 600 },
  qr: { x: 50, y: 700 },
  reference: { x: 50, y: 800 }
};

export default function ManageDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ type_name: '', description: '', base_fee: 0, requirements: '', validity_days: 180, is_available: true });

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [templateFile, setTemplateFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState({ type: '', text: '' });

  const [layoutData, setLayoutData] = useState(DEFAULT_LAYOUT);
  const [draggingRef, setDraggingRef] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [templatePreviewUrl, setTemplatePreviewUrl] = useState(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/admin/document-types');
      setDocuments(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleOpenEdit = (doc = null) => {
    if (doc) {
      setEditingId(doc.doc_type_id);
      setFormData({ type_name: doc.type_name, description: doc.description || '', base_fee: doc.base_fee, requirements: doc.requirements || '', validity_days: doc.validity_days || 180, is_available: doc.is_available === 1 });
    } else {
      setEditingId(null);
      setFormData({ type_name: '', description: '', base_fee: 0, requirements: '', validity_days: 180, is_available: true });
    }
    setEditModalOpen(true);
  };

  const handleSaveDocument = async () => {
    if (!formData.type_name) return alert("Document Name is required.");
    setIsSubmitting(true);
    try {
      if (editingId) await api.put(`/admin/document-types/${editingId}`, formData);
      else await api.post('/admin/document-types', formData);
      setEditModalOpen(false);
      fetchDocuments();
    } catch (err) { alert(err.response?.data?.error || "Failed to save."); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenTemplate = (doc) => {
    setSelectedDoc(doc);
    setTemplateFile(null);
    setUploadMsg({ type: '', text: '' });
    setTemplateModalOpen(true);
  };

  const handleUploadTemplate = async () => {
    if (!templateFile) return setUploadMsg({ type: 'error', text: 'Select a file.' });
    setIsSubmitting(true);
    const payload = new FormData();
    payload.append('file', templateFile);
    try {
      await api.post(`/admin/document-types/${selectedDoc.doc_type_id}/template`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMsg({ type: 'success', text: 'Template Uploaded!' });
      fetchDocuments();
      setTimeout(() => setTemplateModalOpen(false), 1500);
    } catch (err) { setUploadMsg({ type: 'error', text: 'Upload failed.' }); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenLayout = async (doc) => {
    setSelectedDoc(doc);
    let config = {};
    try {
      if (doc.layout_config) {
        config = JSON.parse(doc.layout_config);
        if (config.body && !config.purpose) {
          config.purpose = config.body;
          delete config.body;
        }
      }
    } catch (e) { }

    setLayoutData({ ...DEFAULT_LAYOUT, ...config });
    setLayoutModalOpen(true);

    if (doc.template_file) {
      try {
        // Fetch background for mapper
        const res = await api.get(`/admin/view-file/${doc.template_file}`, { responseType: 'blob' });
        setTemplatePreviewUrl(URL.createObjectURL(res.data));
      } catch (err) { setTemplatePreviewUrl(null); }
    }
  };

  const handleCloseLayout = () => {
    if (templatePreviewUrl) URL.revokeObjectURL(templatePreviewUrl);
    setTemplatePreviewUrl(null);
    setLayoutModalOpen(false);
  };

  const handleMouseMove = (e) => {
    if (!draggingRef) return;
    const dx = e.clientX - draggingRef.startX;
    const dy = e.clientY - draggingRef.startY;
    setLayoutData(prev => ({
      ...prev,
      [draggingRef.key]: {
        x: Math.max(0, Math.min(A4_WIDTH, Math.round(draggingRef.origX + dx))),
        y: Math.max(0, Math.min(A4_HEIGHT, Math.round(draggingRef.origY + dy)))
      }
    }));
  };

  const handleSaveLayout = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/admin/document-types/${selectedDoc.doc_type_id}/layout`, { layout_config: layoutData });
      handleCloseLayout();
      fetchDocuments();
    } catch (err) { alert("Failed to save."); }
    finally { setIsSubmitting(false); }
  };

  const handleTestPrint = async () => {
    try {
      const res = await api.post(`/admin/document-types/${selectedDoc.doc_type_id}/test-pdf`, { layout_config: layoutData }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) { alert("Failed to generate test PDF. Ensure the template is uploaded."); }
  };

  const handleTestPrintRow = async (row) => {
    try {
      // row.layout_config might be a string from db or parsed depending on interceptor, server handles both
      let config = row.layout_config;
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch (e) { config = {}; }
      }
      const res = await api.post(`/admin/document-types/${row.doc_type_id}/test-pdf`, { layout_config: config }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) { alert("Failed to generate test PDF. Ensure the template is uploaded."); }
  };

  if (loading) return <Box sx={{ mt: 10, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Service Catalog</Typography>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => handleOpenEdit()}>Add Document</Button>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#0f172a' }}>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Document Name</TableCell>
              <TableCell sx={{ color: 'white' }}>Base Fee</TableCell>
              <TableCell sx={{ color: 'white' }}>Background</TableCell>
              <TableCell align="center" sx={{ color: 'white' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((row) => (
              <TableRow key={row.doc_type_id} hover>
                <TableCell sx={{ fontWeight: 'bold' }}>{row.type_name}</TableCell>
                <TableCell>₱{row.base_fee}</TableCell>
                <TableCell>{row.template_file ? <Chip label="Uploaded" color="success" size="small" /> : <Chip label="Missing" color="error" size="small" />}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton color="primary" onClick={() => handleOpenEdit(row)}><EditIcon /></IconButton>
                    <Button size="small" variant="outlined" onClick={() => handleOpenTemplate(row)}>Background</Button>
                    <Button size="small" variant="outlined" color="primary" onClick={() => handleTestPrintRow(row)}>Test Print</Button>
                    <Button size="small" variant="outlined" color="secondary" onClick={() => handleOpenLayout(row)}>Layout</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={layoutModalOpen} onClose={handleCloseLayout} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
          Visual Layout Mapper: {selectedDoc?.type_name}
          <Typography variant="caption">A4 (595x842 pt)</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', p: 0, bgcolor: '#f1f5f9', userSelect: draggingRef ? 'none' : 'auto' }} onMouseMove={handleMouseMove} onMouseUp={() => setDraggingRef(null)}>
          <Box sx={{ flex: 1, p: 4, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
            <Box sx={{
              width: A4_WIDTH, height: A4_HEIGHT, bgcolor: 'white', position: 'relative', boxShadow: 3, border: '1px solid #cbd5e1',
              backgroundImage: templatePreviewUrl ? `url(${templatePreviewUrl})` : 'none',
              backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat'
            }}>
              {Object.keys(layoutData).map(key => {
                const isDragging = draggingRef?.key === key;
                let content, sxOverrides;

                if (key === 'name') {
                  sxOverrides = { fontSize: 14, fontWeight: 'bold', color: 'black', fontFamily: 'Helvetica, sans-serif', border: '1px dashed #ef4444', bgcolor: isDragging ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.7)', p: 0, lineHeight: 1 };
                  content = "JUAN DELA CRUZ";
                } else if (key === 'purpose' || key === 'body') {
                  sxOverrides = { fontSize: 11, width: 450, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', lineHeight: 1, color: 'black', fontFamily: 'Helvetica, sans-serif', border: '1px dashed #ef4444', bgcolor: isDragging ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.7)', p: 0 };
                  content = "FOR MEDICAL ASSISTANCE";
                } else if (key === 'signature') {
                  sxOverrides = { width: 150, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ef4444', bgcolor: isDragging ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.7)', color: '#ef4444', fontWeight: 'bold' };
                  content = "[SIGNATURE: 150x70]";
                } else if (key === 'qr') {
                  sxOverrides = { width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ef4444', bgcolor: isDragging ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.7)', color: '#ef4444', fontWeight: 'bold' };
                  content = "[QR: 90x90]";
                } else if (key === 'reference') {
                  sxOverrides = { fontSize: 7, color: 'black', fontFamily: 'Helvetica, sans-serif', border: '1px dashed #ef4444', bgcolor: isDragging ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.7)', p: 0, lineHeight: 1 };
                  content = "VERIFICATION REF: TEST-0000-XYZ";
                } else {
                  sxOverrides = { bgcolor: isDragging ? 'secondary.main' : 'primary.main', color: 'white', px: 2, py: 0.5, borderRadius: 1, border: '1px solid white' };
                  content = <Typography variant="caption" fontWeight="bold">{key.toUpperCase()}</Typography>;
                }

                return (
                  <Box key={key} onMouseDown={(e) => { e.preventDefault(); setDraggingRef({ key, startX: e.clientX, startY: e.clientY, origX: layoutData[key].x, origY: layoutData[key].y }); setSelectedNode(key); }} sx={{
                    position: 'absolute', left: layoutData[key].x, top: layoutData[key].y,
                    cursor: 'grab', zIndex: 10, whiteSpace: 'nowrap',
                    ...sxOverrides
                  }}>
                    {content}
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box sx={{ width: 300, p: 3, bgcolor: 'white', borderLeft: '1px solid #e2e8f0' }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedNode === 'name' && "The Name node dynamically prints the requesting Resident's Full Name in bold."}
              {selectedNode === 'purpose' && "The Purpose node dynamically prints exactly what the resident types when making the request."}
              {selectedNode === 'signature' && "The Signature node injects the current Active Punong Barangay signature."}
              {selectedNode === 'qr' && "The QR node maps the unique anti-forgery QR verification block."}
              {selectedNode === 'reference' && "The Reference node prints the tracking ID string for the document."}
              {!selectedNode && "Click any red dashed element on the canvas to see its layout properties."}
            </Alert>
            {Object.keys(layoutData).map(key => (
              <Paper key={key} sx={{ p: 1.5, mb: 2, bgcolor: '#f8fafc' }} variant="outlined">
                <Typography variant="caption" fontWeight="bold">{key}</Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <TextField label="X" size="small" type="number" value={layoutData[key].x} onChange={(e) => setLayoutData({ ...layoutData, [key]: { ...layoutData[key], x: parseInt(e.target.value) || 0 } })} />
                  <TextField label="Y" size="small" type="number" value={layoutData[key].y} onChange={(e) => setLayoutData({ ...layoutData, [key]: { ...layoutData[key], y: parseInt(e.target.value) || 0 } })} />
                </Stack>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLayout}>Cancel</Button>
          <Button variant="outlined" color="primary" onClick={handleTestPrint}>Test Print</Button>
          <Button variant="contained" color="secondary" onClick={handleSaveLayout}>Save Mapping</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Background Template</DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center' }}>
          {uploadMsg.text && <Alert severity={uploadMsg.type} sx={{ mb: 2 }}>{uploadMsg.text}</Alert>}
          <Button component="label" variant="outlined" fullWidth sx={{ py: 4, borderStyle: 'dashed' }}>
            {templateFile ? templateFile.name : "Select Image/PDF"}
            <input type="file" hidden accept="image/*,.pdf" onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              if (file.type === 'application/pdf') {
                setTemplateFile(file);
              } else if (file.type.startsWith('image/')) {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                  canvas.toBlob((blob) => {
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".png", { type: 'image/png' });
                    setTemplateFile(newFile);
                    URL.revokeObjectURL(img.src);
                  }, 'image/png');
                };
                img.onerror = () => {
                  setUploadMsg({ type: 'error', text: 'Invalid image file.' });
                  URL.revokeObjectURL(img.src);
                };
              } else {
                setUploadMsg({ type: 'error', text: 'Please select an image or PDF.' });
              }
            }} />
          </Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setTemplateModalOpen(false)}>Close</Button><Button variant="contained" onClick={handleUploadTemplate}>Upload</Button></DialogActions>
      </Dialog>

      {/* Edit/Add Document Dialog */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Document Type' : 'Add Document Type'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Document Name" fullWidth required
              value={formData.type_name} onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
            />
            <TextField label="Description" fullWidth multiline rows={2}
              value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField label="Requirements" fullWidth multiline rows={2}
              value={formData.requirements} onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g. Valid ID, 1x1 Picture"
            />
            <Stack direction="row" spacing={2}>
              <TextField label="Base Fee" type="number" fullWidth
                value={formData.base_fee} onChange={(e) => setFormData({ ...formData, base_fee: Number(e.target.value) })}
                InputProps={{ startAdornment: <InputAdornment position="start">₱</InputAdornment> }}
              />
              <TextField label="Validity (Days)" type="number" fullWidth
                value={formData.validity_days} onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
              />
            </Stack>
            <FormControlLabel
              control={<Switch checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} />}
              label="Available to Public"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDocument} disabled={!formData.type_name || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}