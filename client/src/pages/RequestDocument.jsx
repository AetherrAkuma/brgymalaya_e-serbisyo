import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, TextField, Button, MenuItem, Box, Stepper, Step, StepLabel, Alert, Divider, useTheme, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { residentAPI, fileAPI } from '../services/api';

const steps = ['Select Document', 'Purpose & File', 'Review'];

const RequestDocument = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [docTypes, setDocTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    doc_type_id: '',
    purpose: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState('');

  // Fetch Document Types on Load
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await residentAPI.getDocumentTypes();
        if (response.data.status === 'success') {
          setDocTypes(response.data.data);
        }
      } catch (err) {
        console.error("Failed to load document types:", err);
        setError('Failed to load document types. Please try again later.');
      }
    };
    fetchTypes();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation (Must be Image or PDF, max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File is too large! Max 5MB.");
        return;
      }
      setSelectedFile(file);
      setError(''); // Clear any previous file errors
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return null;
    
    try {
      const response = await fileAPI.uploadFile(selectedFile);
      if (response.data.status === 'success') {
        setUploadedFileId(response.data.filename);
        return response.data.filename;
      }
      return null;
    } catch (err) {
      console.error("File upload failed:", err);
      throw new Error('Failed to upload file. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Upload file first if exists
      let fileId = uploadedFileId;
      if (selectedFile && !uploadedFileId) {
        fileId = await uploadFile();
      }

      // Prepare request data
      const requestData = {
        doc_type_id: formData.doc_type_id,
        purpose: formData.purpose
      };

      // Submit request
      const response = await residentAPI.submitRequest(requestData);
      
      if (response.data.status === 'success') {
        setSuccess(`Request submitted successfully! Reference: ${response.data.reference_no}`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Failed to submit request');
      }
      
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const selectedDoc = docTypes.find(d => d.doc_type_id === formData.doc_type_id);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        New Document Request
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card variant="outlined">
        <CardContent sx={{ minHeight: isMobile ? '400px' : '350px' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* STEP 1: SELECT TYPE */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>What document do you need?</Typography>
              <TextField
                select
                label="Document Type"
                fullWidth
                value={formData.doc_type_id}
                onChange={(e) => setFormData({...formData, doc_type_id: e.target.value})}
                sx={{ mt: 2 }}
                required
              >
                {docTypes.map((type) => (
                  <MenuItem key={type.doc_type_id} value={type.doc_type_id}>
                    {type.type_name} - {type.base_fee > 0 ? `₱${type.base_fee}` : 'Free'}
                  </MenuItem>
                ))}
              </TextField>
              
              {selectedDoc && (
                <Alert severity="info" sx={{ mt: 3 }}>
                  <strong>Requirements:</strong> {selectedDoc.requirements || 'Valid ID'}
                  {selectedDoc.description && (
                    <>
                      <br />
                      <strong>Description:</strong> {selectedDoc.description}
                    </>
                  )}
                </Alert>
              )}
            </Box>
          )}

          {/* STEP 2: PURPOSE & FILE */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Details & Requirements</Typography>
              
              <TextField
                label="Purpose of Request"
                multiline
                rows={3}
                fullWidth
                placeholder="e.g., Employment Requirement, Scholarship Application, etc."
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                sx={{ mt: 2, mb: 3 }}
                required
                error={!formData.purpose}
                helperText={!formData.purpose ? 'Purpose is required' : ''}
              />

              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Upload Requirement (ID / Proof)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ height: 50, borderStyle: 'dashed', mb: 1 }}
              >
                {selectedFile ? selectedFile.name : "Click to Upload Image or PDF"}
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </Button>
              <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                Max Size: 5MB. Formats: JPG, PNG, PDF.
              </Typography>
              
              {uploadedFileId && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  File uploaded successfully: {uploadedFileId}
                </Alert>
              )}
            </Box>
          )}

          {/* STEP 3: REVIEW */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Review Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Document Type:</Typography>
                  <Typography variant="body1">{selectedDoc?.type_name || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Fee:</Typography>
                  <Typography variant="body1">₱{selectedDoc?.base_fee || '0.00'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Purpose:</Typography>
                  <Typography variant="body1">{formData.purpose || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Attachment:</Typography>
                  <Typography variant="body1">{selectedFile ? selectedFile.name : "None"}</Typography>
                </Box>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Note:</strong> Once submitted, you cannot edit this request. Please review all details carefully.
              </Alert>
            </Box>
          )}
        </CardContent>

        {/* NAVIGATION BUTTONS */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee' }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={
              loading || 
              (activeStep === 0 && !formData.doc_type_id) ||
              (activeStep === 1 && !formData.purpose)
            }
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Processing...' : (activeStep === steps.length - 1 ? 'Submit Request' : 'Next')}
          </Button>
        </Box>
      </Card>
    </Container>
  );
};

export default RequestDocument;
