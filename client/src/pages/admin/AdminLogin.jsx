import { useState } from 'react';
import axios from 'axios';
import { Container, Paper, TextField, Button, Typography, Alert, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            // Hit the distinct Admin API
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/auth/login`, credentials);
            
            if (res.data.success) {
                // Store token (we can call it 'admin_token' to distinguish from residents)
                localStorage.setItem('token', res.data.token); 
                localStorage.setItem('user_role', res.data.user.role); // Save role for UI logic

                alert(`Welcome back, ${res.data.user.role}!`);
                navigate('/admin/dashboard');
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
            setError("Access Denied. Invalid Credentials.");
            }
        }
    };

    return (
        <Box sx={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#1a237e' // Dark Blue background for "Official" feel
        }}>
            <Container maxWidth="xs">
                <Paper elevation={6} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ color: '#1a237e', fontWeight: 'bold', mb: 1 }}>
                        BARANGAY OFFICIALS
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Restricted Access Portal
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    <form onSubmit={handleLogin}>
                        <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            variant="outlined"
                            margin="normal"
                            onChange={handleChange}
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            name="password"
                            type="password"
                            variant="outlined"
                            margin="normal"
                            onChange={handleChange}
                        />
                        
                        <Button 
                            type="submit" 
                            fullWidth 
                            variant="contained" 
                            size="large"
                            sx={{ mt: 3, backgroundColor: '#1a237e' }}
                        >
                            Enter Portal
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLogin;