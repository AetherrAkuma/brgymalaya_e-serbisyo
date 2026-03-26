import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Stepper, Step, StepLabel, Button, 
  TextField, Grid, Alert, CircularProgress, Card, CardContent, CardActionArea, Divider
} from '@mui/material';

// Modern Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import api from '../../utils/axios';

const steps = ['Select Service', 'Upload Requirements', 'Review & Submit'];

export default function RequestWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  
  // Data States
  const [availableDocs, setAvailableDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ doc_type_id: '', purpose: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/public/document-types');
        setAvailableDocs(res.data.data);
      } catch (error) {
        console.error("Failed to load documents", error);
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchDocs();
  }, []);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = new FormData();
      payload.append('doc_type_id', formData.doc_type_id);
      payload.append('purpose', formData.purpose);
      if (selectedFile) payload.append('id_proof_image', selectedFile);

      await api.post('/requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/resident/requests');
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to submit request.');
      setIsSubmitting(false);
    }
  };

  // --- MODERNIZED STEP VIEWS ---

  // STEP 1: Card-Based Selection
  const renderStep1 = () => (
    <Box sx={{ animation: 'fadeIn 0.5s' }}>
      <Typography variant="h6" fontWeight="600" gutterBottom>What document do you need?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the specific barangay document you are requesting.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {loadingDocs ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
        ) : (
          availableDocs.map((doc) => {
            const isSelected = formData.doc_type_id === doc.doc_type_id;
            return (
              <Grid item xs={12} sm={6} key={doc.doc_type_id}>
                <Card 
                  elevation={isSelected ? 4 : 1}
                  sx={{ 
                    border: isSelected ? '2px solid' : '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease-in-out',
                    height: '100%'
                  }}
                >
                  <CardActionArea onClick={() => setFormData({ ...formData, doc_type_id: doc.doc_type_id })} sx={{ height: '100%', p: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <InsertDriveFileOutlinedIcon color={isSelected ? "primary" : "action"} />
                        {isSelected && <CheckCircleIcon color="primary" fontSize="small" />}
                      </Box>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isSelected ? 'primary.main' : 'text.primary' }}>
                        {doc.type_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, minHeight: 40 }}>
                        Fee: ₱{doc.base_fee}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <TextField
        fullWidth
        required
        multiline
        rows={3}
        label="Purpose of Request"
        placeholder="Briefly explain why you need this document..."
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        variant="outlined"
        sx={{ bgcolor: '#fafafa' }}
      />
    </Box>
  );

  // STEP 2: Modern Dropzone Styling
  const renderStep2 = () => (
    <Box sx={{ textAlign: 'center', py: 4, animation: 'fadeIn 0.5s' }}>
      <Typography variant="h6" fontWeight="600" gutterBottom>Verify Your Identity</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: { xs: 2, md: 8 } }}>
        To prevent fraud, please attach a clear photo of your Valid Government ID or Barangay ID.
      </Typography>
      
      {!selectedFile ? (
        <Button
          component="label"
          sx={{ 
            width: '100%', 
            maxWidth: 500, 
            height: 200, 
            border: '2px dashed', 
            borderColor: 'primary.light', 
            borderRadius: 4,
            bgcolor: 'rgba(25, 118, 210, 0.02)',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary',
            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.05)', borderColor: 'primary.main' }
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" color="primary">Click to browse files</Typography>
          <Typography variant="caption">Supports JPG, PNG, PDF (Max 5MB)</Typography>
          <input type="file" hidden accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} />
        </Button>
      ) : (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'success.main', bgcolor: '#f1f8e9', borderRadius: 3, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="subtitle2" fontWeight="bold">{selectedFile.name}</Typography>
            <Typography variant="caption" color="text.secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Typography>
          </Box>
          <Button color="error" size="small" onClick={removeFile} sx={{ minWidth: 'auto', p: 1, ml: 2 }}>
            <DeleteOutlineIcon />
          </Button>
        </Paper>
      )}
    </Box>
  );

  // STEP 3: Clean Summary Receipt
  const renderStep3 = () => {
    const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);
    return (
      <Box sx={{ animation: 'fadeIn 0.5s' }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>Final Review</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please confirm your details before submitting to the Barangay Office.
        </Typography>

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" textTransform="uppercase">Transaction Summary</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><Typography color="text.secondary">Requested Document</Typography></Grid>
              <Grid item xs={12} sm={8}><Typography fontWeight="bold" color="primary.main">{selectedDocInfo?.type_name}</Typography></Grid>
              
              <Grid item xs={12} sm={4}><Typography color="text.secondary">Stated Purpose</Typography></Grid>
              <Grid item xs={12} sm={8}><Typography variant="body2">{formData.purpose}</Typography></Grid>
              
              <Grid item xs={12} sm={4}><Typography color="text.secondary">Attached Identity Proof</Typography></Grid>
              <Grid item xs={12} sm={8}><Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" /> {selectedFile?.name}
              </Typography></Grid>
            </Grid>
          </Box>
          <Divider />
          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Total Fee Due Upon Pickup</Typography>
            <Typography variant="h5" fontWeight="bold">₱{selectedDocInfo?.base_fee}</Typography>
          </Box>
        </Paper>
        {submitError && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{submitError}</Alert>}
      </Box>
    );
  };

  const isNextDisabled = () => {
    if (activeStep === 0) return !formData.doc_type_id || !formData.purpose.trim();
    if (activeStep === 1) return !selectedFile;
    return false;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="text.primary">
        New Document Request
      </Typography>
      
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, mt: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: 'primary.main' }, '&.Mui-completed': { color: 'success.main' } } }}>
                <Typography fontWeight={activeStep >= steps.indexOf(label) ? 'bold' : 'normal'}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300 }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            disabled={activeStep === 0 || isSubmitting} 
            onClick={handleBack} 
            variant="text" 
            color="inherit"
            sx={{ fontWeight: 'bold' }}
          >
            Go Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleSubmit} 
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
              sx={{ px: 4, borderRadius: 8, fontWeight: 'bold' }}
            >
              {isSubmitting ? 'Processing...' : 'Submit Final Request'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              size="large"
              onClick={handleNext} 
              disabled={isNextDisabled()}
              sx={{ px: 4, borderRadius: 8, fontWeight: 'bold' }}
            >
              Continue to Next Step
            </Button>
          )}
        </Box>
      </Paper>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}