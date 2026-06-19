import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Stepper, Step, StepLabel, Button, 
  TextField, Grid, Alert, CircularProgress, Card, CardContent, CardActionArea, Divider,
  FormControlLabel, Checkbox, Stack, Chip, IconButton, Avatar
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

import api from '../../utils/axios';

const steps = ['Data Privacy', 'Select Document', 'Verify Identity', 'Required Documents', 'Review & Submit'];

export default function RequestWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [dpaConsentChecked, setDpaConsentChecked] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);

  const [availableDocs, setAvailableDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const removeSupportingFile = (index) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSupportingFilesChange = (e) => {
    if (e.target.files) {
      setSupportingFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = new FormData();
      payload.append('doc_type_id', formData.doc_type_id);
      payload.append('purpose', formData.purpose);
      payload.append('dpa_consent', 'true');
      
      if (selectedFile) payload.append('id_proof_image', selectedFile);

      supportingFiles.forEach((file) => {
        payload.append('supporting_docs', file);
      });

      await api.post('/requests', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/resident/requests?submitted=true');
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to submit request.');
      setIsSubmitting(false);
    }
  };

  const renderStep2 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight="700" color="text.primary" gutterBottom>
          What do you need today?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
          Choose the type of barangay document you need and provide a clear reason so we can process it faster.
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
                    bgcolor: isSelected ? 'rgba(59,130,246,0.04)' : 'background.paper',
                    transition: 'all 0.2s ease',
                    height: '100%',
                    borderRadius: 3,
                    '&:hover': { borderColor: isSelected ? 'primary.main' : 'primary.light', bgcolor: isSelected ? 'rgba(59,130,246,0.04)' : '#f8fafc' }
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
                      <Typography variant="body2" color="text.secondary">
                        Fee: <strong>₱{doc.base_fee}</strong>
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
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Clearly state why you need this document. A detailed purpose helps the barangay captain verify and approve your request promptly.
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        rows={3}
        placeholder="e.g., For employment application at ABC Company, school enrollment for S.Y. 2025-2026, bank loan requirement..."
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ py: 2, animation: 'fadeIn 0.4s ease-in-out' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, bgcolor: 'rgba(59,130,246,0.08)', mb: 2 }}>
          <LockPersonOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h5" fontWeight="700" gutterBottom>Verify Your Identity</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 550, mx: 'auto' }}>
          To prevent fraud and protect your records, you <strong>must</strong> upload a clear photo of your valid Government ID or Barangay ID. This will be verified by the barangay secretary before processing.
        </Typography>
      </Box>
      
      <Box sx={{ maxWidth: 500, mx: 'auto' }}>
        {!selectedFile ? (
          <Button
            component="label"
            sx={{ 
              width: '100%', height: 180, border: '2px dashed', borderColor: 'primary.main', 
              borderRadius: 3, bgcolor: 'rgba(59,130,246,0.04)', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', color: 'primary.dark',
              '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' }
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">Click to Upload Official ID</Typography>
            <Typography variant="caption" color="text.secondary">JPG, PNG, PDF (Max 5MB)</Typography>
            <input type="file" hidden accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} />
          </Button>
        ) : (
          <Paper elevation={0} sx={{ p: 3, border: '2px solid', borderColor: 'success.main', bgcolor: 'rgba(16,185,129,0.04)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }} icon={<InfoOutlinedIcon />}>
          <Typography variant="caption">
            Accepted IDs: Barangay ID, Passport, Driver's License, UMID, Postal ID, or any government-issued ID. The ID must be <strong>valid and not expired</strong>.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );

  const renderStep4 = () => {
    const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);
    const dynamicRequirements = selectedDocInfo?.requirements 
      ? selectedDocInfo.requirements 
      : "Please upload the necessary supporting files to process your request.";

    return (
      <Box sx={{ py: 2, animation: 'fadeIn 0.4s ease-in-out' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight="700" gutterBottom>Required Documents</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 550, mx: 'auto' }}>
            Upload the supporting documents required for <strong>{selectedDocInfo?.type_name}</strong>. These will be reviewed along with your application.
          </Typography>
        </Box>

        <Alert 
          severity="info" 
          icon={<InfoOutlinedIcon fontSize="inherit" />}
          sx={{ mb: 4, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Requirements for {selectedDocInfo?.type_name}:
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {dynamicRequirements}
          </Typography>
        </Alert>

        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Button variant="outlined" component="label" size="large" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 3, width: '100%', py: 1.5, borderStyle: 'dashed' }}>
            <CloudUploadOutlinedIcon sx={{ mr: 1 }} /> Upload Required Files
            <input type="file" hidden multiple accept="image/jpeg, image/png, application/pdf" onChange={handleSupportingFilesChange} />
          </Button>

          {supportingFiles.length > 0 ? (
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" display="block" gutterBottom>
                Attached Files ({supportingFiles.length})
              </Typography>
              <Stack spacing={1}>
                {supportingFiles.map((file, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircleIcon color="primary" fontSize="small" />
                      <Box>
                        <Typography variant="body2" fontWeight="500">{file.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{(file.size / 1024).toFixed(1)} KB</Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => removeSupportingFile(index)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" color="error" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
              * You must attach at least one file to proceed.
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // --- STEP 1: DATA PRIVACY (redesigned to match dashboard) ---
  const renderStep1 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', color: 'white', position: 'relative' }}>
        <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08 }}>
          <GavelIcon sx={{ fontSize: 140 }} />
        </Box>
        <Box sx={{ p: { xs: 3, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
              <GavelIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="700" sx={{ opacity: 0.85, letterSpacing: 1 }}>RA 10173 COMPLIANCE</Typography>
              <Typography variant="h5" fontWeight="800">Data Privacy Consent</Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9, maxWidth: 600, mt: 1 }}>
            Before we proceed with your request, please review how Barangay Malaya handles your personal information in accordance with the Data Privacy Act of 2012.
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle2" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockPersonOutlinedIcon sx={{ fontSize: 20, color: '#10b981' }} /> DATA PRIVACY CONSENT FORM
          </Typography>
        </Box>
        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={3}>
            {[
              {
                num: '01', title: 'COLLECTION OF PERSONAL INFORMATION', color: '#065f46',
                body: 'I understand that Barangay Malaya will collect the following personal information from me: full name, address, contact number, email address, date of birth, civil status, and a copy of my valid government-issued ID. These are necessary to process my document request and verify my identity as a resident.'
              },
              {
                num: '02', title: 'PURPOSE OF PROCESSING', color: '#047857',
                body: 'My personal data will be used solely for the purpose of evaluating, processing, and issuing the barangay document I am requesting. This includes verification of my identity, maintaining official barangay records, and communicating updates regarding the status of my request.'
              },
              {
                num: '03', title: 'DATA SHARING AND RETENTION', color: '#059669',
                body: 'I acknowledge that my information may be shared with authorized barangay officials and personnel strictly on a need-to-know basis. My data will be retained in the barangay\'s secure database for as long as necessary to fulfill the purpose and as required by applicable laws and regulations.'
              },
              {
                num: '04', title: 'RIGHTS UNDER RA 10173', color: '#10b981',
                body: 'I understand that I have the right to access, correct, and request the deletion of my personal data. I may also withdraw this consent at any time by contacting the Barangay Hall, although this may affect the processing of my request.'
              }
            ].map((section) => (
              <Grid item xs={12} key={section.num}>
                <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, transition: 'all 0.2s', '&:hover': { borderColor: section.color, boxShadow: `0 2px 8px ${section.color}15` } }}>
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: `${section.color}15`, color: section.color, width: 36, height: 36, fontSize: '0.8rem', fontWeight: '800', flexShrink: 0 }}>
                        {section.num}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" fontWeight="800" color={section.color} sx={{ letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                          {section.title}
                        </Typography>
                        <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.7 }}>
                          {section.body}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        onClick={() => setDpaConsentChecked(!dpaConsentChecked)}
        sx={{
          p: 3, borderRadius: 3, border: '2px solid',
          borderColor: dpaConsentChecked ? '#10b981' : '#e2e8f0',
          bgcolor: dpaConsentChecked ? 'rgba(16,185,129,0.04)' : 'transparent',
          transition: 'all 0.2s ease', cursor: 'pointer',
          '&:hover': { borderColor: dpaConsentChecked ? '#10b981' : '#94a3b8' }
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={dpaConsentChecked}
              onChange={(e) => { e.stopPropagation(); setDpaConsentChecked(e.target.checked); }}
              sx={{ '&.Mui-checked': { color: '#10b981' } }}
            />
          }
          label={
            <Typography variant="body2" color="text.primary" fontWeight="500" sx={{ lineHeight: 1.5 }}>
              I have read and understood the above terms. I hereby give my free and informed consent to Barangay Malaya
              to collect, process, and retain my personal data in accordance with the Data Privacy Act of 2012 (RA 10173)
              for the purpose of processing this document request.
            </Typography>
          }
          sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
        />
      </Paper>
    </Box>
  );

  // --- STEP 5: FINAL REVIEW ---
  const renderStep5 = () => {
    const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);
    return (
      <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: 3, bgcolor: 'rgba(59,130,246,0.08)', mb: 2 }}>
            <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 40 }} />
          </Box>
          <Typography variant="h5" fontWeight="700" gutterBottom>Review & Submit</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Please review your application carefully before submitting. Incomplete or incorrect submissions may be rejected.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">Transaction Summary</Typography>
            <Chip label="Not yet submitted" size="small" color="warning" variant="outlined" sx={{ fontWeight: 'bold' }} />
          </Box>
          
          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Typography color="text.secondary" variant="caption" fontWeight="bold">REQUESTED SERVICE</Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography fontWeight="bold" variant="body1">{selectedDocInfo?.type_name}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography color="text.secondary" variant="caption" fontWeight="bold">STATED PURPOSE</Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="body2">{formData.purpose}</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography color="text.secondary" variant="caption" fontWeight="bold">IDENTITY PROOF</Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 'bold' }}>
                  <CheckCircleIcon fontSize="small" /> {selectedFile?.name}
                </Typography>
              </Grid>

              {supportingFiles.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography color="text.secondary" variant="caption" fontWeight="bold">SUPPORTING DOCUMENTS</Typography>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    {supportingFiles.map((file, idx) => (
                      <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, color: 'success.main' }}>
                        <CheckCircleIcon fontSize="small" /> {file.name}
                      </Typography>
                    ))}
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography color="text.secondary" variant="caption" fontWeight="bold">DATA PRIVACY</Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main', fontWeight: 'bold' }}>
                  <CheckCircleIcon fontSize="small" /> Consent provided
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Divider />
          
          <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="600">Total Fee</Typography>
            <Typography variant="h5" fontWeight="800" color="primary.main">₱{selectedDocInfo?.base_fee}</Typography>
          </Box>
        </Paper>
        
        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }} icon={<InfoOutlinedIcon />}>
          <Typography variant="caption">
            The fee is payable <strong>in cash</strong> at the Barangay Hall when your document is ready for pickup. 
            Please bring your reference number for verification.
          </Typography>
        </Alert>
        
        {submitError && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{submitError}</Alert>}
      </Box>
    );
  };

  const isNextDisabled = () => {
    if (activeStep === 0) return !dpaConsentChecked;
    if (activeStep === 1) return !formData.doc_type_id || !formData.purpose.trim();
    if (activeStep === 2) return !selectedFile;
    if (activeStep === 3) return supportingFiles.length === 0;
    return false;
  };

  const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', mt: { xs: 2, md: 4 }, mb: 8, px: { xs: 1, md: 0 } }}>
      <Box sx={{ mb: 3, px: 2 }}>
        <Typography variant="h4" fontWeight="800" color="#0f172a" gutterBottom>
          Request a Document
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Follow the steps below to submit your document request to Barangay Malaya.
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ p: { xs: 2, md: 5 }, borderRadius: 4, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5, '& .MuiStepLabel-root .Mui-active': { color: '#3b82f6' }, '& .MuiStepLabel-root .Mui-completed': { color: '#10b981' } }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="caption" fontWeight={activeStep >= steps.indexOf(label) ? '700' : '500'}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 380 }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
          {activeStep === 4 && renderStep5()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
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
              size="large"
              onClick={handleSubmit} 
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <AssignmentTurnedInIcon />}
              className={isSubmitting ? 'btn-loading' : ''}
              sx={{ px: 5, borderRadius: 8, fontWeight: 'bold', textTransform: 'none', py: 1.5 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              size="large"
              onClick={handleNext} 
              disabled={isNextDisabled()}
              sx={{ px: 5, borderRadius: 8, fontWeight: 'bold', textTransform: 'none', py: 1.5 }}
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