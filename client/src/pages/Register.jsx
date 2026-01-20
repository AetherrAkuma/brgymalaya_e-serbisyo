import { useState } from 'react';
import axios from 'axios';
import { 
    Container, TextField, Button, Typography, Card, CardContent, 
    Alert, Grid, Box 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    
    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email_address: '',
        password: '',
        contact_number: '',
        address_street: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });

    // Handle Input Change
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/register`, 
                formData
            );
            
            setStatus({ type: 'success', message: 'Registration Successful! Redirecting...' });
            
            // Redirect to Login after 2 seconds
            setTimeout(() => {
                navigate('/login'); 
            }, 2000);

        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Registration Failed';
            setStatus({ type: 'error', message: errorMsg });
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Card variant="outlined" sx={{ p: 2 }}>
                <CardContent>
                    <Box textAlign="center" mb={3}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Create Account
                        </Typography>
                        <Typography color="textSecondary">
                            Sign up for E-Serbisyo Resident Portal
                        </Typography>
                    </Box>

                    {status.message && (
                        <Alert severity={status.type} sx={{ mb: 2 }}>
                            {status.message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="First Name" name="first_name" required onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Middle Name" name="middle_name" onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField fullWidth label="Last Name" name="last_name" required onChange={handleChange} />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <TextField fullWidth label="Home Address (Street/Block)" name="address_street" required onChange={handleChange} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField fullWidth label="Contact Number" name="contact_number" required onChange={handleChange} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField fullWidth type="email" label="Email Address" name="email_address" required onChange={handleChange} />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField fullWidth type="password" label="Password" name="password" required onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    fullWidth 
                                    type="date" 
                                    label="Date of Birth" 
                                    name="date_of_birth" 
                                    InputLabelProps={{ shrink: true }} 
                                    required 
                                    onChange={handleChange} 
                                />
                            </Grid>
                        </Grid>

                        <Button 
                            type="submit" 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            size="large" 
                            sx={{ mt: 3 }}
                        >
                            Register
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
};

export default Register;