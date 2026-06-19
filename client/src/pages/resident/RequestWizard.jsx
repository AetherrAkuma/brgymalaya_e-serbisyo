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
      <Box sx={{ mb: 1.5, textAlign: 'center' }}>
        <Typography variant="subtitle1" fontWeight="700" color="text.primary" gutterBottom>
          What do you need today?
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}>
          Choose the type of barangay document you need and provide a clear reason so we can process it faster.
        </Typography>
      </Box>

      <Box sx={{ maxHeight: { xs: '140px', sm: '180px' }, overflowY: 'auto', pr: 1, mb: 1.5 }}>
        <Grid container spacing={1.5}>
          {loadingDocs ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />
          ) : (
            availableDocs.map((doc) => {
              const isSelected = formData.doc_type_id === doc.doc_type_id;
              return (
                <Grid item xs={12} sm={6} key={doc.doc_type_id}>
                  <Card 
                    elevation={isSelected ? 2 : 0}
                    sx={{ 
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'rgba(59,130,246,0.04)' : 'background.paper',
                      transition: 'all 0.2s ease',
                      borderRadius: 2,
                      '&:hover': { borderColor: isSelected ? 'primary.main' : 'primary.light', bgcolor: isSelected ? 'rgba(59,130,246,0.04)' : '#f8fafc' }
                    }}
                  >
                    <CardActionArea onClick={() => setFormData({ ...formData, doc_type_id: doc.doc_type_id })} sx={{ p: 0.5 }}>
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InsertDriveFileOutlinedIcon color={isSelected ? "primary" : "action"} fontSize="small" />
                            <Typography variant="body2" fontWeight="700" sx={{ color: isSelected ? 'primary.dark' : 'text.primary' }}>
                              {doc.type_name}
                            </Typography>
                          </Box>
                          {isSelected && <CheckCircleIcon color="primary" sx={{ fontSize: 18 }} />}
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
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
      </Box>

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="body2" fontWeight="700" gutterBottom>
        Purpose of Request
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Clearly state why you need this document to help the captain verify and approve your request.
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        rows={2}
        placeholder="e.g., For employment application, school enrollment..."
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ py: 1, animation: 'fadeIn 0.4s ease-in-out' }}>
      <Box sx={{ textAlign: 'center', mb: 1.5 }}>
        <Box sx={{ display: 'inline-flex', p: 1, borderRadius: 2, bgcolor: 'rgba(59,130,246,0.08)', mb: 1 }}>
          <LockPersonOutlinedIcon color="primary" sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="subtitle1" fontWeight="700" gutterBottom>Verify Your Identity</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}>
          To prevent fraud, you <strong>must</strong> upload a clear photo of your valid Government or Barangay ID.
        </Typography>
      </Box>
      
      <Box sx={{ maxWidth: 450, mx: 'auto' }}>
        {!selectedFile ? (
          <Button
            component="label"
            sx={{ 
              width: '100%', height: 110, border: '2px dashed', borderColor: 'primary.main', 
              borderRadius: 3, bgcolor: 'rgba(59,130,246,0.04)', display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', color: 'primary.dark',
              '&:hover': { bgcolor: 'rgba(59,130,246,0.08)' }
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 36, mb: 0.5 }} />
            <Typography variant="body2" fontWeight="bold">Click to Upload Official ID</Typography>
            <Typography variant="caption" color="text.secondary">JPG, PNG, PDF (Max 5MB)</Typography>
            <input type="file" hidden accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} />
          </Button>
        ) : (
          <Paper elevation={0} sx={{ p: 1.5, border: '2px solid', borderColor: 'success.main', bgcolor: 'rgba(16,185,129,0.04)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 24 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold" color="success.dark">ID Attached Successfully</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </Typography>
              </Box>
            </Box>
            <Button color="error" variant="outlined" size="small" onClick={removeFile} sx={{ minWidth: 'auto', px: 1.5, py: 0.5, borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}>
              Remove
            </Button>
          </Paper>
        )}

        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2, py: 0.5 }} icon={<InfoOutlinedIcon fontSize="small" />}>
          <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
            Accepted: Barangay ID, Passport, Driver's License, UMID, Postal ID. Must be <strong>valid and not expired</strong>.
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
      <Box sx={{ py: 1, animation: 'fadeIn 0.4s ease-in-out' }}>
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="700" gutterBottom>Required Documents</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}>
            Upload the supporting documents required for <strong>{selectedDocInfo?.type_name}</strong>.
          </Typography>
        </Box>

        <Alert 
          severity="info" 
          icon={<InfoOutlinedIcon fontSize="small" />}
          sx={{ mb: 2, borderRadius: 2, py: 0.5 }}
        >
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }} gutterBottom>
            Requirements for {selectedDocInfo?.type_name}:
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
            {dynamicRequirements}
          </Typography>
        </Alert>

        <Box sx={{ maxWidth: 500, mx: 'auto' }}>
          <Button variant="outlined" component="label" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 1.5, width: '100%', py: 1, borderStyle: 'dashed', fontSize: '0.8rem' }}>
            <CloudUploadOutlinedIcon sx={{ mr: 1, fontSize: 18 }} /> Upload Required Files
            <input type="file" hidden multiple accept="image/jpeg, image/png, application/pdf" onChange={handleSupportingFilesChange} />
          </Button>

          {supportingFiles.length > 0 ? (
            <Box sx={{ maxHeight: 110, overflowY: 'auto', p: 1, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" display="block" sx={{ fontSize: '0.65rem', mb: 0.5 }}>
                Attached Files ({supportingFiles.length})
              </Typography>
              <Stack spacing={0.5}>
                {supportingFiles.map((file, index) => (
                  <Paper key={index} elevation={0} sx={{ p: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="primary" sx={{ fontSize: 14 }} />
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: '500', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.name}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" color="error" onClick={() => removeSupportingFile(index)} sx={{ p: 0.25 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ) : (
            selectedDocInfo?.requirements && 
            selectedDocInfo.requirements.trim() !== '' && 
            !/^(none|no requirements|n\/a|no specific requirements|no specific requirements listed)/i.test(selectedDocInfo.requirements.trim()) ? (
              <Typography variant="caption" color="error" sx={{ textAlign: 'center', display: 'block', fontStyle: 'italic' }}>
                * You must attach at least one file to proceed.
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', fontStyle: 'italic' }}>
                No supporting documents are required for this request. You can optionally upload files if needed.
              </Typography>
            )
          )}
        </Box>
      </Box>
    );
  };

  // --- STEP 1: DATA PRIVACY (redesigned to match dashboard) ---
  const renderStep1 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', mb: 2, background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', color: 'white', position: 'relative' }}>
        <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08 }}>
          <GavelIcon sx={{ fontSize: 100 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 36, height: 36 }}>
              <GavelIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Box>
              <Typography variant="caption" fontWeight="700" sx={{ opacity: 0.85, letterSpacing: 1 }}>RA 10173 COMPLIANCE</Typography>
              <Typography variant="subtitle1" fontWeight="800">Data Privacy Consent</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.9, maxWidth: 600, display: 'block' }}>
            Please review how Barangay Malaya handles your personal information in accordance with the Data Privacy Act of 2012.
          </Typography>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 3, py: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle2" fontWeight="800" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockPersonOutlinedIcon sx={{ fontSize: 18, color: '#10b981' }} /> DATA PRIVACY CONSENT FORM
          </Typography>
        </Box>
        <Box sx={{ p: 2, maxHeight: { xs: '180px', sm: '250px' }, overflowY: 'auto' }}>
          <Grid container spacing={1.5}>
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
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Avatar sx={{ bgcolor: `${section.color}15`, color: section.color, width: 28, height: 28, fontSize: '0.7rem', fontWeight: '800', flexShrink: 0 }}>
                        {section.num}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" fontWeight="800" color={section.color} sx={{ letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
                          {section.title}
                        </Typography>
                        <Typography variant="body2" color="#475569" sx={{ lineHeight: 1.4, fontSize: '0.75rem' }}>
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
          p: 1.5, borderRadius: 3, border: '2px solid',
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
              sx={{ '&.Mui-checked': { color: '#10b981' }, py: 0.5 }}
            />
          }
          label={
            <Typography variant="caption" color="text.primary" fontWeight="500" sx={{ lineHeight: 1.4, display: 'block' }}>
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
      <Box sx={{ py: 0.5, animation: 'fadeIn 0.4s ease-in-out' }}>
        <Box sx={{ textAlign: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'inline-flex', p: 1, borderRadius: 2, bgcolor: 'rgba(59,130,246,0.08)', mb: 1 }}>
            <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="subtitle1" fontWeight="700" gutterBottom>Review & Submit</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', display: 'block' }}>
            Please review your application details carefully before submitting.
          </Typography>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="bold">Transaction Summary</Typography>
            <Chip label="Not yet submitted" size="small" color="warning" variant="outlined" sx={{ fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} />
          </Box>
          
          <Box sx={{ p: 2, maxHeight: 160, overflowY: 'auto' }}>
            <Grid container spacing={1.5}>
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SERVICE</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography fontWeight="bold" sx={{ fontSize: '0.85rem' }}>{selectedDocInfo?.type_name}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PURPOSE</Typography>
              </Grid>
              <Grid item xs={8}>
                <Paper elevation={0} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: '0.8rem' }}>{formData.purpose}</Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ID PROOF</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  <CheckCircleIcon sx={{ fontSize: 14 }} /> {selectedFile?.name}
                </Typography>
              </Grid>

              {supportingFiles.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={4}>
                    <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>SUPPORTING</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    {supportingFiles.map((file, idx) => (
                      <Typography key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25, color: 'success.main', fontSize: '0.8rem' }}>
                        <CheckCircleIcon sx={{ fontSize: 14 }} /> {file.name}
                      </Typography>
                    ))}
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={4}>
                <Typography color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PRIVACY</Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 'bold', fontSize: '0.8rem' }}>
                  <CheckCircleIcon sx={{ fontSize: 14 }} /> Consent provided
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          <Divider />
          
          <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight="600">Total Fee</Typography>
            <Typography variant="h6" fontWeight="800" color="primary.main">₱{selectedDocInfo?.base_fee}</Typography>
          </Box>
        </Paper>
        
        <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2, py: 0.5 }} icon={<InfoOutlinedIcon fontSize="small" />}>
          <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
            Payable <strong>in cash</strong> at the Barangay Hall upon collection. Please bring your reference number.
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
    if (activeStep === 3) {
      const selectedDoc = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);
      const hasReqs = selectedDoc?.requirements && 
        selectedDoc.requirements.trim() !== '' && 
        !/^(none|no requirements|n\/a|no specific requirements|no specific requirements listed)/i.test(selectedDoc.requirements.trim());
      return hasReqs ? supportingFiles.length === 0 : false;
    }
    return false;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 1, md: 2 }, mb: 2, px: { xs: 1, md: 0 } }}>
      <Box sx={{ mb: 1.5, px: 2 }}>
        <Typography variant="h5" fontWeight="800" color="#0f172a" gutterBottom>
          Request a Document
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Follow the steps below to submit your document request to Barangay Malaya.
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, borderRadius: 4, mt: 1, border: '1px solid', borderColor: 'divider' }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3, '& .MuiStepLabel-root .Mui-active': { color: '#3b82f6' }, '& .MuiStepLabel-root .Mui-completed': { color: '#10b981' } }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="caption" fontWeight={activeStep >= steps.indexOf(label) ? '700' : '500'} sx={{ display: { xs: 'none', sm: 'block' } }}>{label}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 280 }}>
          {activeStep === 0 && renderStep1()}
          {activeStep === 1 && renderStep2()}
          {activeStep === 2 && renderStep3()}
          {activeStep === 3 && renderStep4()}
          {activeStep === 4 && renderStep5()}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
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