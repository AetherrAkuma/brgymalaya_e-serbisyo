import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Stepper, Step, StepLabel, Button, 
  TextField, Grid, Alert, CircularProgress, Card, CardContent, CardActionArea, Divider,
  FormControlLabel, Checkbox, Stack, Chip, IconButton, Autocomplete, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import api from '../../utils/axios';
import { useSnackbar } from '../../context/SnackbarContext.jsx';

const steps = ['Select Resident', 'Request Details', 'Review & Submit'];

export default function WalkinRequest() {
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [residents, setResidents] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);

  // Quick Register Modal
  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerIdProof, setRegisterIdProof] = useState(null);
  const [registerForm, setRegisterForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    civil_status: 'Single',
    address_street: '',
    email_address: '',
    contact_number: ''
  });
  const [registerActiveStep, setRegisterActiveStep] = useState(0);
  const registerSteps = ['Profile', 'Contact', 'Verification', 'Review'];

  const handleRegisterClose = () => {
    setRegisterOpen(false);
    setRegisterActiveStep(0);
    setRegisterForm({
      first_name: '',
      middle_name: '',
      last_name: '',
      date_of_birth: '',
      civil_status: 'Single',
      address_street: '',
      email_address: '',
      contact_number: ''
    });
    setRegisterIdProof(null);
  };

  const isRegisterNextDisabled = () => {
    if (registerActiveStep === 0) {
      return (
        !registerForm.first_name.trim() ||
        !registerForm.last_name.trim() ||
        !registerForm.date_of_birth ||
        !registerForm.civil_status
      );
    }
    if (registerActiveStep === 1) {
      const phPhoneRegex = /^(09|\+639)\d{9}$/;
      return (
        !registerForm.email_address.includes('@') ||
        !phPhoneRegex.test(registerForm.contact_number.replace(/\s+/g, '')) ||
        !registerForm.address_street.trim()
      );
    }
    if (registerActiveStep === 2) {
      return !registerIdProof;
    }
    return false;
  };

  // Document selection & Jobseeker
  const [availableDocs, setAvailableDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [formData, setFormData] = useState({ doc_type_id: '', purpose: '' });
  const [isJobseeker, setIsJobseeker] = useState(false);

  // Supporting Files
  const [supportingFiles, setSupportingFiles] = useState([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  useEffect(() => {
    fetchResidents();
    fetchDocs();
  }, []);

  const fetchResidents = async () => {
    try {
      const res = await api.get('/admin/residents');
      // Only active/approved residents can file requests
      setResidents(res.data.data.filter(r => r.account_status === 'Active'));
    } catch (error) {
      console.error("Failed to load residents", error);
      showSnackbar("Failed to load residents list.", "error");
    } finally {
      setLoadingResidents(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const res = await api.get('/public/document-types');
      setAvailableDocs(res.data.data);
    } catch (error) {
      console.error("Failed to load document types", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Quick Registration Handlers
  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerActiveStep < registerSteps.length - 1) {
      // Prevent premature submit via Enter key on earlier steps, advance instead
      if (!isRegisterNextDisabled()) {
        setRegisterActiveStep(prev => prev + 1);
      }
      return;
    }
    if (!registerIdProof) {
      return showSnackbar("Official ID proof image is required.", "warning");
    }
    setRegisterLoading(true);
    try {
      const data = new FormData();
      Object.keys(registerForm).forEach((key) => {
        data.append(key, registerForm[key]);
      });
      data.append('id_proof_image', registerIdProof);

      const res = await api.post('/admin/residents/quick-register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSnackbar(`Resident registered! Temp password: ${res.data.temp_password}`, "success");
      
      // Refresh list and select the new resident
      const updatedRes = await api.get('/admin/residents');
      const activeResidents = updatedRes.data.data.filter(r => r.account_status === 'Active');
      setResidents(activeResidents);
      
      const newResidentObj = activeResidents.find(r => r.resident_id === res.data.resident_id);
      setSelectedResident(newResidentObj);
      
      handleRegisterClose();
    } catch (error) {
      showSnackbar(error.response?.data?.error || "Failed to register resident.", "error");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Supporting Files Handlers
  const handleSupportingFilesChange = (e) => {
    if (e.target.files) {
      setSupportingFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeSupportingFile = (index) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedDocInfo = availableDocs.find(d => d.doc_type_id === formData.doc_type_id);

  // Submit Handler
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = new FormData();
      payload.append('resident_id', selectedResident.resident_id);
      payload.append('doc_type_id', formData.doc_type_id);
      
      const finalPurpose = isJobseeker ? `[FIRST-TIME JOBSEEKER] ${formData.purpose}` : formData.purpose;
      payload.append('purpose', finalPurpose);

      supportingFiles.forEach((file) => {
        payload.append('supporting_docs', file);
      });

      const res = await api.post('/admin/walkin-request', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSubmitResult({
        reference_no: res.data.reference_no,
        request_id: res.data.request_id,
        isJobseeker
      });
      showSnackbar("Walk-in request created successfully!", "success");
      handleNext();
    } catch (error) {
      setSubmitError(error.response?.data?.message || error.response?.data?.error || 'Failed to submit walk-in request.');
      showSnackbar("Walk-in submission failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (activeStep === 0) return !selectedResident;
    if (activeStep === 1) {
      if (!formData.doc_type_id || !formData.purpose.trim()) return true;
      if (isJobseeker && supportingFiles.length === 0) return true;
      return false;
    }
    return false;
  };

  // --- STEP Renderers ---
  const renderStep1 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc', mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="700" color="text.primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon color="primary" /> Lookup Resident Profile
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Search for an existing constituent profile in the database to link this walk-in request.
        </Typography>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
          <Autocomplete
            fullWidth
            options={residents}
            loading={loadingResidents}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email_address})`}
            value={selectedResident}
            onChange={(event, newValue) => setSelectedResident(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by Name or Email"
                size="small"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingResidents ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => { setRegisterActiveStep(0); setRegisterOpen(true); }}
            sx={{ textTransform: 'none', fontWeight: 'bold', px: 3, borderRadius: 2 }}
          >
            Register
          </Button>
        </Stack>
      </Paper>

      {selectedResident && (
        <Card variant="outlined" sx={{ borderRadius: 3, border: '2px solid', borderColor: 'primary.main', bgcolor: 'rgba(59,130,246,0.02)' }}>
          <CardContent>
            <Typography variant="overline" color="primary.main" fontWeight="bold">Constituent Selected</Typography>
            <Typography variant="h6" fontWeight="bold" color="#0f172a">{selectedResident.first_name} {selectedResident.last_name}</Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                <Typography variant="body2" fontWeight="500">{selectedResident.email_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">Street Address</Typography>
                <Typography variant="body2" fontWeight="500">{selectedResident.address_street}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderStep2 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Typography variant="subtitle1" fontWeight="700" color="text.primary" gutterBottom textAlign="center">
        Select Request Service
      </Typography>
      
      <Box sx={{ maxHeight: 160, overflowY: 'auto', pr: 1, mb: 2, mt: 1.5 }}>
        <Grid container spacing={1.5}>
          {loadingDocs ? (
            <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />
          ) : (
            availableDocs.map((doc) => {
              const isSelected = formData.doc_type_id === doc.doc_type_id;
              return (
                <Grid item xs={12} sm={6} key={doc.doc_type_id}>
                  <Card 
                    elevation={isSelected ? 1 : 0}
                    sx={{ 
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : '#e2e8f0',
                      bgcolor: isSelected ? 'rgba(59,130,246,0.04)' : 'background.paper',
                      transition: 'all 0.2s ease',
                      borderRadius: 2.5
                    }}
                  >
                    <CardActionArea onClick={() => setFormData({ ...formData, doc_type_id: doc.doc_type_id })} sx={{ p: 0.5 }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" fontWeight="700" color={isSelected ? 'primary.dark' : 'text.primary'}>
                            {doc.type_name}
                          </Typography>
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

      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isJobseeker}
              onChange={(e) => setIsJobseeker(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" fontWeight="700" color="text.primary">
              First-Time Jobseeker (Exempt from Fee under RA 11261)
            </Typography>
          }
        />
        {isJobseeker && (
          <Alert severity="info" sx={{ mt: 1, borderRadius: 2, py: 0.5 }}>
            <Typography sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
              ⚠️ Resident claims First-Time Jobseeker. You <strong>must</strong> scan and attach their signed Oath/Agreement below to proceed.
            </Typography>
          </Alert>
        )}
      </Box>

      <Typography variant="body2" fontWeight="700" gutterBottom>
        Purpose of Request
      </Typography>
      <TextField
        fullWidth
        required
        multiline
        rows={2}
        placeholder="Reason for requesting this certificate (e.g. Scholarship application, job employment, local clearance...)"
        value={formData.purpose}
        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        variant="outlined"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 }, mb: 2 }}
      />

      <Typography variant="body2" fontWeight="700" gutterBottom>
        Attach Supporting Files {isJobseeker ? '(Mandatory Jobseeker Oath/Agreement)' : '(Optional)'}
      </Typography>
      <Button variant="outlined" component="label" sx={{ width: '100%', py: 1.5, borderStyle: 'dashed', borderRadius: 2, textTransform: 'none', mb: 1 }}>
        <CloudUploadOutlinedIcon sx={{ mr: 1 }} /> Browse / Scan Documents
        <input type="file" hidden multiple onChange={handleSupportingFilesChange} />
      </Button>

      {supportingFiles.length > 0 ? (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {supportingFiles.map((file, index) => (
            <Paper key={index} elevation={0} sx={{ p: 1, border: '1px solid #cbd5e1', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" fontWeight="bold">{file.name}</Typography>
              <IconButton size="small" color="error" onClick={() => removeSupportingFile(index)}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Stack>
      ) : (
        isJobseeker && (
          <Typography variant="caption" color="error" fontWeight="bold" display="block" sx={{ mt: 0.5 }}>
            * You must attach the constituent's First-Time Jobseeker Oath/Agreement to enable submission.
          </Typography>
        )
      )}
    </Box>
  );

  const renderStep3 = () => (
    <Box sx={{ animation: 'fadeIn 0.4s ease-in-out' }}>
      <Typography variant="subtitle1" fontWeight="700" gutterBottom textAlign="center">
        Review Walk-in Details
      </Typography>

      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc', mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">CONSTITUENT</Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2" fontWeight="bold">{selectedResident?.first_name} {selectedResident?.last_name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">{selectedResident?.email_address}</Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">REQUEST SERVICE</Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2" fontWeight="bold">{selectedDocInfo?.type_name}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {isJobseeker ? `[FIRST-TIME JOBSEEKER] ${formData.purpose}` : formData.purpose}
            </Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">SUPPORTING FILES</Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2">{supportingFiles.length > 0 ? `${supportingFiles.length} file(s) attached` : 'None'}</Typography>
          </Grid>

          <Grid item xs={12}><Divider /></Grid>

          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL FEE</Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              {isJobseeker ? '₱0.00 (Exempted under RA 11261)' : `₱${selectedDocInfo?.base_fee || 0}`}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
        Walk-in requests route straight to the **Treasurer Queue** for billing verification and collection.
      </Alert>

      {submitError && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{submitError}</Alert>}
    </Box>
  );

  const renderSuccess = () => (
    <Box sx={{ py: 4, textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
      <CheckCircleIcon color="success" sx={{ fontSize: 72, mb: 2 }} />
      <Typography variant="h5" fontWeight="900" gutterBottom>
        Walk-In Request Registered!
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tracking Code: <strong style={{ color: '#2563eb', fontSize: '1.1rem' }}>{submitResult?.reference_no}</strong>
      </Typography>

      <Paper elevation={0} sx={{ p: 3, border: '1px dashed #cbd5e1', bgcolor: '#f8fafc', maxWidth: 500, mx: 'auto', mb: 4, borderRadius: 3 }}>
        <Typography variant="body2" color="text.primary" fontWeight="bold" gutterBottom>
          Treasurer Collection Slip
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2, textAlign: 'left', lineHeight: 1.4 }}>
          This walk-in request has been successfully queued.
          <br /><br />
          • **Reference Number**: {submitResult?.reference_no}
          <br />
          • **Fee State**: {submitResult?.isJobseeker ? "Exempted (First-Time Jobseeker)" : "Requires Cash Payment"}
          <br /><br />
          Please direct the constituent to the **Treasurer's Desk** with their Tracking Code to clear the fee or complete exemption verification.
        </Typography>

        <Stack spacing={2} sx={{ width: '100%' }}>
          <Button 
            variant="contained"
            color="primary"
            onClick={() => {
              setActiveStep(0);
              setSelectedResident(null);
              setFormData({ doc_type_id: '', purpose: '' });
              setIsJobseeker(false);
              setSupportingFiles([]);
              setSubmitResult(null);
            }}
            sx={{ py: 1.2, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
          >
            Register Another Walk-in Request
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin/requests')}
            sx={{ py: 1, borderRadius: 2, textTransform: 'none' }}
          >
            Go to Master Queue
          </Button>
        </Stack>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 850, mx: 'auto', p: { xs: 2, md: 3 }, animation: 'fadeIn 0.5s ease-out' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HowToRegIcon color="primary" /> Walk-In Service Desk
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register document applications for constituents physically visiting the Barangay Hall.
        </Typography>
      </Box>

      {submitResult ? (
        renderSuccess()
      ) : (
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-root .Mui-active': { color: '#3b82f6' } }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>
                  <Typography variant="caption" fontWeight={activeStep >= steps.indexOf(label) ? '700' : '500'}>{label}</Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 280, mb: 4 }}>
            {activeStep === 0 && renderStep1()}
            {activeStep === 1 && renderStep2()}
            {activeStep === 2 && renderStep3()}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid #e2e8f0' }}>
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
                sx={{ px: 4, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
              >
                {isSubmitting ? 'Registering...' : 'Register Walk-In'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                size="large"
                onClick={handleNext} 
                disabled={isNextDisabled()}
                sx={{ px: 4, borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
              >
                Continue →
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* QUICK REGISTER RESIDENT DIALOG */}
      <Dialog open={registerOpen} onClose={handleRegisterClose} maxWidth="md" fullWidth disableRestoreFocus PaperProps={{ sx: { borderRadius: 4 } }}>
        <form onSubmit={handleRegisterSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, py: 2.5, bgcolor: '#f8fafc' }}>
            <HowToRegIcon color="primary" sx={{ fontSize: 24 }} /> Quick Register Constituent
          </DialogTitle>
          <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 440 }}>
            
            {/* LEFT SIDE PANEL: Explanatory Column */}
            <Box sx={{ 
              width: { xs: '100%', md: '35%' }, 
              bgcolor: '#f8fafc', 
              p: 3.5, 
              borderRight: { xs: 'none', md: '1px solid #e2e8f0' }, 
              borderBottom: { xs: '1px solid #e2e8f0', md: 'none' },
              display: 'flex', 
              flexDirection: 'column', 
              gap: 2 
            }}>
              {registerActiveStep === 0 && (
                <>
                  <HowToRegIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">Personal Profile</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Gather the constituent's official name and demographics. Ensure the names match their birth certificate or secondary valid identification.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 2, borderLeft: '3px solid', borderColor: 'primary.main', mt: 1 }}>
                    <strong>Note:</strong> A temporary password will be auto-generated using their Date of Birth and Last Name.
                  </Typography>
                </>
              )}
              {registerActiveStep === 1 && (
                <>
                  <InfoOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">Contact & Address</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Provide valid contact metrics. The registered email address will receive their temporary login credentials and automated document status alerts.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 2, borderLeft: '3px solid', borderColor: 'primary.main', mt: 1 }}>
                    <strong>Important:</strong> The street address must be situated inside the physical boundaries of Barangay Malaya.
                  </Typography>
                </>
              )}
              {registerActiveStep === 2 && (
                <>
                  <InsertDriveFileOutlinedIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">Identity Verification</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    A clear image or document copy of the constituent's ID is mandatory for security verification and record integrity.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 2, borderLeft: '3px solid', borderColor: 'primary.main', mt: 1 }}>
                    <strong>Standard IDs:</strong> Voter's ID, Unified Multi-Purpose ID, Passport, Driver's License, or Student ID.
                  </Typography>
                </>
              )}
              {registerActiveStep === 3 && (
                <>
                  <AssignmentTurnedInIcon color="primary" sx={{ fontSize: 40 }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="text.primary">Verify & Register</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Please do a final visual check on the resident's registered details. Clicking submit registers their profile immediately.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'primary.50', p: 1.5, borderRadius: 2, borderLeft: '3px solid', borderColor: 'primary.main', mt: 1 }}>
                    <strong>Audit Trail:</strong> This action is digitally logged under your administrative credentials.
                  </Typography>
                </>
              )}
            </Box>

            {/* RIGHT SIDE PANEL: Inputs Form */}
            <Box sx={{ width: { xs: '100%', md: '65%' }, p: 3.5, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Stepper activeStep={registerActiveStep} alternativeLabel sx={{ mb: 4, '& .MuiStepLabel-root .Mui-active': { color: '#3b82f6' } }}>
                  {registerSteps.map((label) => (
                    <Step key={label}>
                      <StepLabel>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }} fontWeight={registerActiveStep >= registerSteps.indexOf(label) ? '700' : '500'}>{label}</Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step 0: Profile */}
                {registerActiveStep === 0 && (
                  <Grid container spacing={3} sx={{ animation: 'fadeInStep 0.3s ease-out' }}>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth label="First Name" name="first_name" value={registerForm.first_name} onChange={handleRegisterChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Middle Name (Optional)" name="middle_name" value={registerForm.middle_name} onChange={handleRegisterChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField required fullWidth label="Last Name" name="last_name" value={registerForm.last_name} onChange={handleRegisterChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth type="date" name="date_of_birth" label="Date of Birth" InputLabelProps={{ shrink: true }} value={registerForm.date_of_birth} onChange={handleRegisterChange} inputProps={{ max: new Date().toISOString().split('T')[0] }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl required fullWidth>
                        <InputLabel>Civil Status</InputLabel>
                        <Select name="civil_status" value={registerForm.civil_status} label="Civil Status" onChange={handleRegisterChange}>
                          <MenuItem value="Single">Single</MenuItem>
                          <MenuItem value="Married">Married</MenuItem>
                          <MenuItem value="Widowed">Widowed</MenuItem>
                          <MenuItem value="Divorced">Divorced</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                )}

                {/* Step 1: Contact & Address */}
                {registerActiveStep === 1 && (
                  <Grid container spacing={3} sx={{ animation: 'fadeInStep 0.3s ease-out' }}>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth type="email" name="email_address" label="Email Address" value={registerForm.email_address} onChange={handleRegisterChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth name="contact_number" label="Contact Number" placeholder="09XXXXXXXXX" value={registerForm.contact_number} onChange={handleRegisterChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField required fullWidth name="address_street" label="Complete Street Address" placeholder="House/Block/Lot No., Street Name, Sitio/Purok" multiline rows={3} value={registerForm.address_street} onChange={handleRegisterChange} />
                    </Grid>
                  </Grid>
                )}

                {/* Step 2: Verification */}
                {registerActiveStep === 2 && (
                  <Box sx={{ animation: 'fadeInStep 0.3s ease-out' }}>
                    <Box sx={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: 3,
                      p: 4.5,
                      textAlign: 'center',
                      bgcolor: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 180,
                      gap: 1.5,
                      '&:hover': { bgcolor: '#f0fdf4', borderColor: 'success.main' }
                    }} component="label">
                      <CloudUploadOutlinedIcon color="primary" sx={{ fontSize: 44 }} />
                      <Typography variant="subtitle1" fontWeight="bold">Upload ID Proof Document</Typography>
                      <Typography variant="caption" color="text.secondary">Accepted formats: JPG, PNG, PDF (Max 5MB)</Typography>
                      <input type="file" required hidden accept="image/*,application/pdf" onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setRegisterIdProof(e.target.files[0]);
                        }
                      }} />
                    </Box>
                    {registerIdProof && (
                      <Typography variant="body2" sx={{ mt: 2, display: 'bold', color: 'success.main', textAlign: 'center' }}>
                        ✓ File Selected: {registerIdProof.name} ({(registerIdProof.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Step 3: Review */}
                {registerActiveStep === 3 && (
                  <Box sx={{ animation: 'fadeInStep 0.3s ease-out' }}>
                    <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: '#f8fafc', fontSize: '0.875rem' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Full Name</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" fontWeight="bold">
                            {registerForm.last_name}, {registerForm.first_name} {registerForm.middle_name ? `${registerForm.middle_name} ` : ''}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Birth Date</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" fontWeight="bold">{registerForm.date_of_birth ? new Date(registerForm.date_of_birth).toLocaleDateString() : ''}</Typography>
                        </Grid>

                        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Status / Contact</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" fontWeight="bold">{registerForm.civil_status} | {registerForm.contact_number}</Typography>
                        </Grid>

                        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Email Address</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" fontWeight="bold">{registerForm.email_address}</Typography>
                        </Grid>

                        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Address</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" fontWeight="bold">{registerForm.address_street}</Typography>
                        </Grid>

                        <Grid item xs={4}><Typography variant="body2" color="text.secondary">ID Verification</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" color="success.main" fontWeight="bold">
                            ✓ Attached: {registerIdProof?.name}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
            <Button 
              disabled={registerActiveStep === 0 || registerLoading} 
              onClick={() => setRegisterActiveStep(prev => prev - 1)} 
              variant="text" 
              color="inherit"
              sx={{ fontWeight: 'bold' }}
            >
              Back
            </Button>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={handleRegisterClose} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
              {registerActiveStep === registerSteps.length - 1 ? (
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={registerLoading} 
                  startIcon={registerLoading ? <CircularProgress size={16} color="inherit" /> : null} 
                  sx={{ fontWeight: 'bold', px: 4, borderRadius: 2 }}
                >
                  {registerLoading ? 'Registering...' : 'Register Constituent'}
                </Button>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={() => setRegisterActiveStep(prev => prev + 1)} 
                  disabled={isRegisterNextDisabled()} 
                  sx={{ fontWeight: 'bold', px: 4, borderRadius: 2 }}
                >
                  Continue
                </Button>
              )}
            </Stack>
          </DialogActions>
        </form>
      </Dialog>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInStep {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}
