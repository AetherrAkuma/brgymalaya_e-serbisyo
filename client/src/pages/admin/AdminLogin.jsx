import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Alert, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [credentials, setCredentials] = useState({ email_or_username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const result = await login(credentials);
            
            if (result.success) {
                const user = JSON.parse(localStorage.getItem('user'));
                // Verify this is an official account
                if (['Super Admin', 'Secretary', 'Treasurer', 'Captain'].includes(user.role)) {
                    navigate('/admin/dashboard');
                } else {
                    setError('Access Denied. This portal is for Barangay Officials only.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            } else {
                setError(result.error || 'Access Denied. Invalid Credentials.');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Access Denied. Invalid Credentials.");
        } finally {
            setLoading(false);
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
                            label="Email or Username"
                            name="email_or_username"
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
                            disabled={loading}
                            sx={{ mt: 3, backgroundColor: '#1a237e' }}
                        >
                            {loading ? 'Authenticating...' : 'Enter Portal'}
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default AdminLogin;