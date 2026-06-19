import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios'; 
import { 
  Box, Grid, Typography, TextField, Button, Link, InputAdornment, 
  IconButton, Alert, MenuItem, Stack, Paper, Divider, CircularProgress,
  Stepper, Step, StepLabel, Checkbox, FormControlLabel
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityIcon from '@mui/icons-material/Security';

const steps = ['Consent', 'Account', 'Profile', 'Contact', 'Verification', 'Review'];

export default function Register() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [idProofFile, setIdProofFile] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    email_address: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    civil_status: 'Single',
    contact_number: '',
    address_street: ''
  });

  // Consent Agreement Toggles
  const [consentChecked, setConsentChecked] = useState(false);
  const [residencyChecked, setResidencyChecked] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIdProofFile(file);
      setError('');
      
      // If image, create object URL for preview
      if (file.type.startsWith('image/')) {
        setIdProofPreview(URL.createObjectURL(file));
      } else {
        setIdProofPreview(null); // PDF or other formats
      }
    }
  };

  const removeFile = () => {
    setIdProofFile(null);
    setIdProofPreview(null);
  };

  // Validations per step
  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return consentChecked && residencyChecked;
      case 1:
        return (
          formData.email_address.includes('@') &&
          formData.password.length >= 8 &&
          formData.password === formData.confirmPassword
        );
      case 2:
        return (
          formData.first_name.trim() !== '' &&
          formData.last_name.trim() !== '' &&
          formData.date_of_birth !== '' &&
          formData.civil_status !== ''
        );
      case 3:
        const phPhoneRegex = /^(09|\+639)\d{9}$/;
        return (
          phPhoneRegex.test(formData.contact_number.replace(/\s+/g, '')) &&
          formData.address_street.trim() !== ''
        );
      case 4:
        return idProofFile !== null;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    setError('');
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStepValid()) return;
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'confirmPassword') {
          data.append(key, formData[key]);
        }
      });
      data.append('id_proof_image', idProofFile);

      const response = await api.post('/auth/resident/register', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message || 'Registration complete!');
      setFormData({
        email_address: '', password: '', confirmPassword: '',
        first_name: '', middle_name: '', last_name: '',
        date_of_birth: '', civil_status: 'Single',
        contact_number: '', address_street: ''
      });
      setIdProofFile(null);
      setIdProofPreview(null);
      
      // Auto redirect to login screen after 3.5s
      setTimeout(() => {
        navigate('/login');
      }, 3500);

    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please review details.');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING VARIOUS STEPS ---

  // STEP 1: DPA Consent Form
  const renderStepConsent = () => (
    <Box sx={{ animation: 'fadeInStep 0.4s ease-out' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <SecurityIcon color="primary" />
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          RA 10173 Data Privacy Agreement
        </Typography>
      </Stack>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 2.5, 
          maxHeight: '260px', 
          overflowY: 'auto', 
          bgcolor: '#f8fafc',
          borderRadius: 2,
          mb: 3,
          borderColor: '#e2e8f0',
          fontSize: '0.825rem',
          lineHeight: 1.6,
          color: '#334155'
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          E-Serbisyo Barangay Malaya Portal Consent Policy
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 'inherit', mb: 1.5 }}>
          In compliance with the <strong>Philippine Data Privacy Act of 2012 (Republic Act No. 10173)</strong>, Barangay Malaya is committed to protecting your personal information. By registering for the E-Serbisyo Portal, you consent to the collection, processing, and storage of the following data:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 'inherit', mb: 1.5 }}>
          1. <strong>Personal Information Collected:</strong> Complete name, date of birth, civil status, complete address, email address, contact number, account credentials, and official identification document images (uploaded for verification).
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 'inherit', mb: 1.5 }}>
          2. <strong>Purpose of Collection:</strong> The data collected is exclusively used to verify your identity and residency, provision secure portal access, authorize document requests, issue certifications, send relevant public announcements, and log secure transactions.
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 'inherit', mb: 1.5 }}>
          3. <strong>Data Encryption & Security:</strong> We employ industry-standard encryption protocols (including secure database hashes and AES encrypted storage for uploaded ID proofs) to safeguard all personal details against unauthorized access, loss, or leakage.
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 'inherit', mb: 1.5 }}>
          4. <strong>Data Subject Rights:</strong> Under the DPA, you reserve the right to access your stored data, request corrections of erroneous information, object to processing, or request erasure of your data when your account is terminated.
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 'inherit' }}>
          Barangay Malaya will retain your information only as long as your account remains active or as required by official municipal auditing and archiving procedures. We will never sell, lease, or share your data with unapproved third parties.
        </Typography>
      </Paper>

      <Stack spacing={1}>
        <FormControlLabel
          control={<Checkbox checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} color="primary" />}
          label={<Typography variant="body2" fontWeight="500">I have read the policy and explicitly consent to the collection and processing of my personal data under the terms of RA 10173.</Typography>}
        />
        <FormControlLabel
          control={<Checkbox checked={residencyChecked} onChange={(e) => setResidencyChecked(e.target.checked)} color="primary" />}
          label={<Typography variant="body2" fontWeight="500">I certify that I am a bona fide resident of Barangay Malaya, and all information I will supply is true and correct.</Typography>}
        />
      </Stack>
    </Box>
  );

  // STEP 2: Account Details
  const renderStepAccount = () => {
    const hasMinLength = formData.password.length >= 8;
    const hasNumOrSpecial = /[\d\W]/.test(formData.password);
    const matchesConfirm = formData.password !== '' && formData.password === formData.confirmPassword;
    
    return (
      <Box sx={{ animation: 'fadeInStep 0.4s ease-out' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2.5 }} color="text.primary">
          Account Credentials
        </Typography>
        <Stack spacing={2.5}>
          <TextField
            required
            fullWidth
            label="Email Address"
            name="email_address"
            type="email"
            value={formData.email_address}
            onChange={handleChange}
            placeholder="e.g., resident@gmail.com"
          />
          
          <TextField
            required
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            required
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Password Strength Checklist */}
          <Box sx={{ px: 1, py: 0.5 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" sx={{ mb: 1 }}>
              Password Requirements:
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color={hasMinLength ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {hasMinLength ? <CheckCircleIcon fontSize="inherit" /> : '•'} At least 8 characters long
              </Typography>
              <Typography variant="caption" color={hasNumOrSpecial ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {hasNumOrSpecial ? <CheckCircleIcon fontSize="inherit" /> : '•'} Includes a number or special character
              </Typography>
              <Typography variant="caption" color={matchesConfirm ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {matchesConfirm ? <CheckCircleIcon fontSize="inherit" /> : '•'} Passwords match correctly
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  };

  // STEP 3: Personal Profile
  const renderStepProfile = () => (
    <Box sx={{ animation: 'fadeInStep 0.4s ease-out' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2.5 }} color="text.primary">
        Personal Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Middle Name (Optional)"
            name="middle_name"
            value={formData.middle_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            type="date"
            label="Date of Birth"
            name="date_of_birth"
            InputLabelProps={{ shrink: true }}
            value={formData.date_of_birth}
            onChange={handleChange}
            inputProps={{ max: new Date().toISOString().split('T')[0] }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            required
            fullWidth
            label="Civil Status"
            name="civil_status"
            value={formData.civil_status}
            onChange={handleChange}
          >
            {['Single', 'Married', 'Widowed', 'Divorced'].map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Box>
  );

  // STEP 4: Contact & Address
  const renderStepContact = () => {
    const phPhoneRegex = /^(09|\+639)\d{9}$/;
    const isValidPhone = phPhoneRegex.test(formData.contact_number.replace(/\s+/g, ''));
    
    return (
      <Box sx={{ animation: 'fadeInStep 0.4s ease-out' }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2.5 }} color="text.primary">
          Contact & Residency Address
        </Typography>
        <Stack spacing={2.5}>
          <TextField
            required
            fullWidth
            label="Mobile Number (e.g. 09XXXXXXXXX)"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            placeholder="09123456789"
            error={formData.contact_number !== '' && !isValidPhone}
            helperText={formData.contact_number !== '' && !isValidPhone ? "Must be a valid PH mobile number starting with 09 or +639 (11 digits)" : ""}
          />
          <TextField
            required
            fullWidth
            label="Complete Barangay Address"
            name="address_street"
            value={formData.address_street}
            onChange={handleChange}
            placeholder="House/Block/Lot No., Street Name, Sitio/Purok"
            multiline
            rows={2.5}
            helperText="Provide your exact street address inside Barangay Malaya."
          />
        </Stack>
      </Box>
    );
  };

  // STEP 5: Verification Upload
  const renderStepVerification = () => (
    <Box sx={{ animation: 'fadeInStep 0.4s ease-out' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }} color="text.primary">
        Barangay Identity Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Barangay officials require a valid document to approve registrations. Please upload a clear copy of your Barangay ID, Voter's ID, Unified Multi-Purpose ID, Passport, Driver's License, or Student ID.
      </Typography>

      <Box>
        {!idProofFile ? (
          <Button
            component="label"
            sx={{ 
              width: '100%', 
              height: 180, 
              border: '2px dashed', 
              borderColor: 'primary.main', 
              borderRadius: 3, 
              bgcolor: 'primary.50', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'primary.dark',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'primary.100', borderColor: 'primary.dark' }
            }}
          >
            <CloudUploadOutlinedIcon sx={{ fontSize: 44, mb: 1.5 }} />
            <Typography variant="subtitle2" fontWeight="bold">Click or Browse to Upload ID Proof</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>Accepted formats: JPG, PNG, PDF (Max 5MB)</Typography>
            <input type="file" hidden accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} />
          </Button>
        ) : (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2.5, 
              borderColor: 'success.main', 
              bgcolor: '#f0fdf4', 
              borderRadius: 3, 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckCircleIcon color="success" />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold" color="success.dark">ID Attached</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {idProofFile.name} ({(idProofFile.size / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                </Box>
              </Box>
              <Button color="error" variant="outlined" size="small" onClick={removeFile} startIcon={<DeleteOutlineIcon />}>
                Remove
              </Button>
            </Box>

            {/* Thumbnail Preview if Image */}
            {idProofPreview && (
              <Box 
                component="img"
                src={idProofPreview}
                alt="ID Proof Preview"
                sx={{ 
                  width: '100%', 
                  maxHeight: '140px', 
                  objectFit: 'contain', 
                  borderRadius: 2, 
                  border: '1px solid #e2e8f0',
                  bgcolor: 'white',
                  p: 0.5
                }}
              />
            )}
          </Paper>
        )}
      </Box>
    </Box>
  );

  // STEP 6: Review & Submit
  const renderStepReview = () => (
    <Box sx={{ animation: 'fadeInStep 0.4s ease-out' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2.5 }} color="text.primary">
        Review Your Details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please verify that all details are accurate before submitting. Incorrect details will cause delays in barangay account verification.
      </Typography>

      <Grid container spacing={2} sx={{ fontSize: '0.85rem' }}>
        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Full Name</Typography></Grid>
        <Grid item xs={8}>
          <Typography variant="body2" fontWeight="bold">
            {formData.last_name}, {formData.first_name} {formData.middle_name ? `${formData.middle_name} ` : ''}
          </Typography>
        </Grid>

        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Birth Date</Typography></Grid>
        <Grid item xs={8}>
          <Typography variant="body2" fontWeight="bold">{new Date(formData.date_of_birth).toLocaleDateString()}</Typography>
        </Grid>

        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Status / Mobile</Typography></Grid>
        <Grid item xs={8}>
          <Typography variant="body2" fontWeight="bold">{formData.civil_status} | {formData.contact_number}</Typography>
        </Grid>

        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Email Address</Typography></Grid>
        <Grid item xs={8}>
          <Typography variant="body2" fontWeight="bold">{formData.email_address}</Typography>
        </Grid>

        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Address</Typography></Grid>
        <Grid item xs={8}>
          <Typography variant="body2" fontWeight="bold">{formData.address_street}</Typography>
        </Grid>

        <Grid item xs={4}><Typography variant="body2" color="text.secondary">Verification ID</Typography></Grid>
        <Grid item xs={8}>
          <Typography variant="body2" color="success.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon fontSize="inherit" /> Attached: {idProofFile?.name}
          </Typography>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        Once submitted, your account will be manually verified by Barangay Malaya Captain or Secretary. You will receive an approval email notification.
      </Alert>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'white' }}>
      
      {/* --- LEFT SIDE: THE BRAND AREA (MATCHES LOGIN DESIGN) --- */}
      <Box sx={{ 
        flex: { xs: 0, md: 1.2, lg: 1.5 }, 
        bgcolor: '#0f172a',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        px: 8,
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        width: { md: '45%', lg: '50%' },
        color: 'white',
        zIndex: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 2, animation: 'fadeInLeft 0.8s ease-out' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 4 }}>
            <VerifiedUserIcon sx={{ color: '#3b82f6', fontSize: 40 }} />
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: 1 }}>
              E-SERBISYO
            </Typography>
          </Stack>
          
          <Typography variant="h2" fontWeight="800" sx={{ mb: 3, lineHeight: 1.1 }}>
            Join E-Serbisyo <br/>
            <span style={{ color: '#3b82f6' }}>Portal Register</span>
          </Typography>
          
          <Typography variant="h6" sx={{ color: '#94a3b8', maxWidth: '500px', fontWeight: 300, mb: 6 }}>
            Create an account to conveniently access online barangay services, certifications, announcements, and support records.
          </Typography>

          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/')}
            sx={{ color: '#94a3b8', textTransform: 'none', '&:hover': { color: 'white' } }}
          >
            Back to Public Homepage
          </Button>
        </Box>
      </Box>

      {/* --- RIGHT SIDE: THE STEPPER & FORM CONTAINER --- */}
      <Box sx={{ 
        flex: 1, 
        ml: { xs: 0, md: '45%', lg: '50%' }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 6, px: { xs: 2.5, md: 5 },
        bgcolor: '#f8fafc' 
      }}>
        <Paper elevation={0} sx={{ 
          width: '100%', 
          maxWidth: '650px', 
          p: { xs: 3, md: 5 }, 
          borderRadius: 4,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          animation: 'fadeInUp 0.6s ease-out',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}>
          
          <Box sx={{ mb: 4.5 }}>
            <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
              Create Resident Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please complete all steps to register for online Barangay clearance and certifications.
            </Typography>
          </Box>

          {/* MUI STEPPER */}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
            {steps.map((label, idx) => (
              <Step key={label}>
                <StepLabel 
                  StepIconProps={{ 
                    sx: { 
                      '&.Mui-active': { color: 'primary.main' }, 
                      '&.Mui-completed': { color: 'success.main' } 
                    } 
                  }}
                >
                  <Typography variant="caption" fontWeight={activeStep >= idx ? 'bold' : 'normal'}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 3.5, borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3.5, borderRadius: 2 }}>{success}</Alert>}

          {/* ACTIVE STEP CONTENT */}
          <Box sx={{ minHeight: '300px' }}>
            {activeStep === 0 && renderStepConsent()}
            {activeStep === 1 && renderStepAccount()}
            {activeStep === 2 && renderStepProfile()}
            {activeStep === 3 && renderStepContact()}
            {activeStep === 4 && renderStepVerification()}
            {activeStep === 5 && renderStepReview()}
          </Box>

          {/* WIZARD ACTIONS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5, pt: 3, borderTop: '1px solid #e2e8f0' }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              color="inherit"
              sx={{ fontWeight: 'bold', textTransform: 'none' }}
            >
              Back
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={loading || !isStepValid()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HowToRegIcon />}
                sx={{ 
                  px: 4.5, 
                  py: 1.5, 
                  borderRadius: 2.5, 
                  fontWeight: 'bold', 
                  textTransform: 'none',
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                {loading ? 'Submitting Application...' : 'Register Account'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid()}
                endIcon={<ArrowForwardIcon />}
                sx={{ 
                  px: 4.5, 
                  py: 1.5, 
                  borderRadius: 2.5, 
                  fontWeight: 'bold', 
                  textTransform: 'none',
                  bgcolor: '#3b82f6',
                  '&:hover': { bgcolor: '#2563eb' }
                }}
              >
                Continue
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 4.5, textAlign: 'center' }}>
            <Divider sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                ALREADY REGISTERED?
              </Typography>
            </Divider>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => navigate('/login')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1 }}
            >
              Back to Login Portal
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* --- CSS STEP-IN TRANSITIONS & ANIMATIONS --- */}
      <style>
        {`
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInStep {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
}
