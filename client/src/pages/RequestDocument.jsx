import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, Typography, Card, CardContent, TextField, 
    Button, MenuItem, Box, Stepper, Step, StepLabel, Alert, Divider, InputLabel 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Make sure to import this or remove the icon
import { useNavigate } from 'react-router-dom';

const steps = ['Select Document', 'Purpose & File', 'Review'];

const RequestDocument = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [docTypes, setDocTypes] = useState([]);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        doc_type_id: '',
        purpose: ''
    });
    const [selectedFile, setSelectedFile] = useState(null); // <--- NEW: File State

    // Fetch Menu on Load
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/requests/types`);
                setDocTypes(res.data.data);
            } catch (err) {
                console.error("Failed to load types");
            }
        };
        fetchTypes();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Basic validation (Must be Image or PDF, max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert("File is too large! Max 5MB.");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        
        // 1. Prepare FormData (Required for File Uploads)
        const data = new FormData();
        data.append('doc_type_id', formData.doc_type_id);
        data.append('purpose', formData.purpose);
        if (selectedFile) {
            data.append('attachment', selectedFile); // 'attachment' matches the backend middleware
        } else {
            setError("Please upload a requirement (ID or Document).");
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/resident/submit-request`, // Updated URL
                data,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data' // Crucial for files
                    } 
                }
            );
            
            alert("Request Submitted Successfully!");
            navigate('/dashboard'); 
            
        } catch (err) {
            console.error(err);
            setError("Failed to submit request. Please try again.");
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
        <Container maxWidth="md">
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                New Request
            </Typography>
            
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
            </Stepper>

            <Card variant="outlined">
                <CardContent sx={{ minHeight: '350px' }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                            >
                                {docTypes.map((type) => (
                                    <MenuItem key={type.doc_type_id} value={type.doc_type_id}>
                                        {type.type_name} - {type.base_fee > 0 ? `₱${type.base_fee}` : 'Free'}
                                    </MenuItem>
                                ))}
                            </TextField>
                            
                            {selectedDoc && (
                                <Alert severity="info" sx={{ mt: 3 }}>
                                    <strong>Requirements:</strong> {selectedDoc.requirements ? JSON.parse(selectedDoc.requirements).join(', ') : 'Valid ID'}
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
                            />

                            <Divider sx={{ mb: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>Upload Requirement (ID / Proof)</Typography>
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{ height: 50, borderStyle: 'dashed' }}
                            >
                                {selectedFile ? selectedFile.name : "Click to Upload Image or PDF"}
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*,application/pdf"
                                    onChange={handleFileChange}
                                />
                            </Button>
                            <Typography variant="caption" color="textSecondary">
                                Max Size: 5MB. Formats: JPG, PNG, PDF.
                            </Typography>
                        </Box>
                    )}

                    {/* STEP 3: REVIEW */}
                    {activeStep === 2 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Review Details</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography><strong>Document:</strong> {selectedDoc?.type_name}</Typography>
                            <Typography><strong>Fee:</strong> ₱{selectedDoc?.base_fee}</Typography>
                            <Typography><strong>Purpose:</strong> {formData.purpose}</Typography>
                            <Typography><strong>Attachment:</strong> {selectedFile ? selectedFile.name : "None"}</Typography>
                            
                            <Alert severity="warning" sx={{ mt: 3 }}>
                                Note: Once submitted, you cannot edit this request.
                            </Alert>
                        </Box>
                    )}
                </CardContent>

                {/* NAVIGATION BUTTONS */}
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
                    <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
                        Back
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleNext}
                        disabled={activeStep === 0 && !formData.doc_type_id}
                    >
                        {activeStep === steps.length - 1 ? 'Submit Request' : 'Next'}
                    </Button>
                </Box>
            </Card>
        </Container>
    );
};

export default RequestDocument;