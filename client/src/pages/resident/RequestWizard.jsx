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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';

import api from '../../utils/axios';

// NEW: 4-Step Pipeline
const steps = ['Select Document', 'Verify Identity', 'Required Documents', 'Review & Submit'];

export default function RequestWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  
  // File States
  const [selectedFile, setSelectedFile] = useState(null); // Primary ID
  const [supportingFiles, setSupportingFiles] = useState([]); // Now strictly REQUIRED

  // Data States
  const [availableDocs, setAvailableDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ doc_type_id: '', purpose: '' });

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

  const removeFile = () => setSelectedFile(null);

  const handleSupportingFilesChange = (e) => {
    if (e.target.files) {
      setSupportingFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = new FormData();
      payload.append('doc_type_id', formData.doc_type_id);
      payload.append('purpose', formData.purpose);
      
      if (selectedFile) payload.append('id_proof_image', selectedFile);

      supportingFiles.forEach((file) => {
        payload.append('supporting_docs', file);
      });

      await api.post('/requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/resident/requests');
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to submit request.');
      setIsSubmitting(false);
    }
  };

  // --- STEP 1: DOCUMENT SELECTION ---
  const renderStep1 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="700" color="text.primary" gutterBottom>
          What do you need today?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select the document you wish to request and provide a brief reason.
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {loadingDocs ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
        ) : (
          availableDocs.map((doc) => {
            const isSelected = formData.doc_type_id === doc.doc_type_id;
            return (
              <Grid item xs={12} sm={6} key={doc.doc_type_id}>
                <Card 
                  elevation={isSelected ? 3 : 0}
                  sx={{ 
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease',
                    height: '100%',
                    borderRadius: 3,
                    '&:hover': { borderColor: isSelected ? 'primary.main' : 'primary.light', bgcolor: isSelected ? 'primary.50' : '#f9f9f9' }
                  }}
                >
                  <CardActionArea onClick={() => setFormData({ ...formData, doc_type_id: doc.doc_type_id })} sx={{ height: '100%', p: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <InsertDriveFileOutlinedIcon color={isSelected ? "primary" : "action"} fontSize="large" />
                        {isSelected && <CheckCircleIcon color="primary" />}
                      </Box>
                      <Typography variant="subtitle1" fontWeight="700" sx={{ color: isSelected ? 'primary.dark' : 'text.primary', mb: 0.5 }}>
                        {doc.type_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, display: 'flex', alignItems: 'center' }}>
                        Processing Fee: <strong style={{ marginLeft: '4px', color: '#333' }}>₱{doc.base_fee}</strong>
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="subtitle1" fontWeight="600" gutterBottom>
        Purpose of Request
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        rows={3}
        placeholder="e.g., For employment application, school enrollment, bank opening..."
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        variant="outlined"
        helperText="Please be specific so the barangay can process your request faster."
        sx={{ bgcolor: '#fafafa', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </Box>
  );

  // --- STEP 2: ID VERIFICATION (THE GATEWAY) ---
  const renderStep2 = () => (
    <Box sx={{ py: 2, animation: 'fadeIn 0.4s ease-in-out', textAlign: 'center' }}>
      <LockPersonOutlinedIcon color="primary" sx={{ fontSize: 50, mb: 2 }} />
      <Typography variant="h5" fontWeight="700" gutterBottom>Verify Your Identity</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
        To prevent fraud and protect your records, you <b>must</b> upload a clear photo of your Valid Government ID or Barangay ID before proceeding.
      </Typography>
      
      <Box sx={{ maxWidth: 500, mx: 'auto' }}>
        {!selectedFile ? (
          <Button
            component="label"
            sx={{ 
              width: '100%', height: 180, border: '2px dashed', borderColor: 'primary.main', 
              borderRadius: 3, bgcolor: 'primary.50', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', color: 'primary.dark',
              '&:hover': { bgcolor: 'primary.100' }
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Click to Upload Official ID</Typography>
            <Typography variant="caption">JPG, PNG, PDF (Max 5MB)</Typography>
            <input type="file" hidden accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} />
          </Button>
        ) : (
          <Paper elevation={0} sx={{ p: 3, border: '2px solid', borderColor: 'success.main', bgcolor: 'success.50', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon color="success" fontSize="large" />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="success.dark">ID Attached Successfully</Typography>
                <Typography variant="caption" color="text.secondary">{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</Typography>
              </Box>
            </Box>
            <Button color="error" variant="outlined" size="small" onClick={removeFile} sx={{ minWidth: 'auto', p: 1, borderRadius: 2 }}>
              <DeleteOutlineIcon /> Remove
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );

  // --- STEP 3: REQUIRED DOCUMENTS ---
  const renderStep3 = () => {
    const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);
    const dynamicRequirements = selectedDocInfo?.requirements 
      ? selectedDocInfo.requirements 
      : "Please upload the necessary supporting files to process your request.";

    return (
      <Box sx={{ py: 2, animation: 'fadeIn 0.4s ease-in-out' }}>
        <Typography variant="h5" fontWeight="700" gutterBottom textAlign="center">Required Documents</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }} textAlign="center">
          You must upload the documents listed below to complete your application.
        </Typography>

        <Alert 
          severity="info" 
          icon={<InfoOutlinedIcon fontSize="inherit" />}
          sx={{ mb: 4, borderRadius: 2, border: '1px solid', borderColor: 'info.light' }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Specific Requirements for {selectedDocInfo?.type_name}:
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {dynamicRequirements}
          </Typography>
        </Alert>

        <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
          <Button variant="outlined" component="label" size="large" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 3 }}>
            + Upload Required Files
            <input type="file" hidden multiple accept="image/jpeg, image/png, application/pdf" onChange={handleSupportingFilesChange} />
          </Button>

          {supportingFiles.length > 0 ? (
            <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'left' }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" display="block" gutterBottom>
                Attached Requirements ({supportingFiles.length} files):
              </Typography>
              {supportingFiles.map((file, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, py: 0.5 }}>
                  <CheckCircleIcon color="primary" fontSize="small" />
                  <Typography variant="body2" color="text.primary" fontWeight="500">
                    {file.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="error" sx={{ mt: 2, fontStyle: 'italic' }}>
              * You must attach at least one file to proceed.
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // --- STEP 4: FINAL REVIEW ---
  const renderStep4 = () => {
    const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);
    return (
      <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ReceiptLongOutlinedIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight="700" gutterBottom>Final Review</Typography>
          <Typography variant="body2" color="text.secondary">
            Please ensure all details are correct. Documents are processed based on this information.
          </Typography>
        </Box>

        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: 'primary.main', p: 2, color: 'white' }}>
            <Typography variant="subtitle1" fontWeight="bold">Transaction Summary</Typography>
          </Box>
          
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}><Typography color="text.secondary" variant="body2">Requested Service</Typography></Grid>
              <Grid item xs={12} sm={8}><Typography fontWeight="bold" variant="body1">{selectedDocInfo?.type_name}</Typography></Grid>
              
              <Grid item xs={12} sm={4}><Typography color="text.secondary" variant="body2">Stated Purpose</Typography></Grid>
              <Grid item xs={12} sm={8}>
                <Paper elevation={0} sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="body2">{formData.purpose}</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} sm={4}><Typography color="text.secondary" variant="body2">Identity Proof</Typography></Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 'bold' }}>
                  <CheckCircleIcon fontSize="small" /> {selectedFile?.name}
                </Typography>
              </Grid>

              {supportingFiles.length > 0 && (
                <>
                  <Grid item xs={12} sm={4}><Typography color="text.secondary" variant="body2">Required Docs</Typography></Grid>
                  <Grid item xs={12} sm={8}>
                    {supportingFiles.map((file, idx) => (
                      <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" /> {file.name}
                      </Typography>
                    ))}
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
          
          <Divider />
          
          <Box sx={{ bgcolor: '#fafafa', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" color="text.secondary">Total Fee (Payable at Hall)</Typography>
            <Typography variant="h5" fontWeight="800" color="primary.main">₱{selectedDocInfo?.base_fee}</Typography>
          </Box>
        </Paper>
        
        {submitError && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{submitError}</Alert>}
      </Box>
    );
  };

  // --- THE GATEKEEPER LOGIC ---
  const isNextDisabled = () => {
    if (activeStep === 0) return !formData.doc_type_id || !formData.purpose.trim(); // Must select doc & purpose
    if (activeStep === 1) return !selectedFile; // GATEWAY: Must upload ID
    if (activeStep === 2) return supportingFiles.length === 0; // STRICT REQUIREMENT: Must upload at least 1 file
    return false;
  };

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', mt: { xs: 2, md: 4 }, mb: 8 }}>
      <Typography variant="h4" fontWeight="800" gutterBottom color="text.primary" sx={{ px: 2 }}>
        Request a Document
      </Typography>
      
      <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 4, mt: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel StepIconProps={{ sx: { '&.Mui-active': { color: 'primary.main' }, '&.Mui-completed': { color: 'success.main' } } }}>
                <Typography fontWeight={activeStep >= steps.indexOf(label) ? 'bold' : 'medium'}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 350 }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            disabled={activeStep === 0 || isSubmitting} 
            onClick={handleBack} 
            variant="text" 
            color="inherit"
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          >
            ← Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleSubmit} 
              disabled={isSubmitting}
              startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
              sx={{ px: 5, borderRadius: 8, fontWeight: 'bold', textTransform: 'none' }}
            >
              {isSubmitting ? 'Processing...' : 'Submit Request'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              size="large"
              onClick={handleNext} 
              disabled={isNextDisabled()}
              sx={{ px: 5, borderRadius: 8, fontWeight: 'bold', textTransform: 'none' }}
            >
              Continue →
            </Button>
          )}
        </Box>
      </Paper>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}