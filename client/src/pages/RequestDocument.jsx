import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, Typography, Card, CardContent, TextField, 
    Button, MenuItem, Box, Stepper, Step, StepLabel, Alert, Divider 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const steps = ['Select Document', 'Purpose & Details', 'Review'];

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

    const handleSubmit = async () => {
        const token = localStorage.getItem('token'); // Get the Key
        try {
            await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/requests/create`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } } // Show the Key
            );
            
            alert("Request Submitted Successfully!");
            navigate('/dashboard'); // Go back to dashboard
            
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

    // Find selected doc name for review
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
                <CardContent sx={{ minHeight: '300px' }}>
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
                                    <strong>Requirements:</strong> {JSON.parse(selectedDoc.requirements).join(', ')}
                                </Alert>
                            )}
                        </Box>
                    )}

                    {/* STEP 2: PURPOSE */}
                    {activeStep === 1 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Why do you need this?</Typography>
                            <TextField
                                label="Purpose of Request"
                                multiline
                                rows={4}
                                fullWidth
                                placeholder="e.g., Employment Requirement, Scholarship Application, etc."
                                value={formData.purpose}
                                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                                sx={{ mt: 2 }}
                            />
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
                            
                            <Alert severity="warning" sx={{ mt: 3 }}>
                                Note: Once submitted, you cannot edit this request. Payment will be collected at the Barangay Hall.
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