import { useState } from 'react';
import axios from 'axios';
import {
    Container, TextField, Button, Typography, Card, CardContent,
    Alert, Box
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email_address: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/auth/login`, 
                formData
            );
            
            // Save the Token (Digital ID) to Local Storage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            alert(`Welcome back, ${response.data.user.name}!`);
            
            // TODO: Redirect to Dashboard (Phase 4)
            navigate('/dashboard');

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Card variant="outlined" sx={{ p: 2, maxWidth: 400, width: '100%' }}>
                <CardContent>
                    <Box textAlign="center" mb={3}>
                        <Typography variant="h4">Login</Typography>
                        <Typography color="textSecondary">E-Serbisyo Portal</Typography>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <TextField 
                            fullWidth label="Email Address" name="email_address" 
                            margin="normal" required onChange={handleChange} 
                        />
                        <TextField 
                            fullWidth type="password" label="Password" name="password" 
                            margin="normal" required onChange={handleChange} 
                        />

                        <Button 
                            type="submit" variant="contained" color="primary" 
                            fullWidth size="large" sx={{ mt: 2 }}
                        >
                            Login
                        </Button>
                        <Link to="/register">
                            <Typography variant="body2" display="block" textAlign="center" sx={{ mt: 2 }}>Don't have an account? Register</Typography>
                        </Link>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
