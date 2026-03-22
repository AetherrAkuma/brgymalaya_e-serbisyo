import { useState } from 'react';
import {
    Container, TextField, Button, Typography, Card, CardContent,
    Alert, Box
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email_or_username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(formData);
            
            if (result.success) {
                // Redirect based on role
                const user = JSON.parse(localStorage.getItem('user'));
                if (['Super Admin', 'Secretary', 'Treasurer', 'Captain'].includes(user.role)) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(result.error || 'Login Failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Login Failed');
        } finally {
            setLoading(false);
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
                            fullWidth label="Email or Username" name="email_or_username" 
                            margin="normal" required onChange={handleChange} 
                        />
                        <TextField 
                            fullWidth type="password" label="Password" name="password" 
                            margin="normal" required onChange={handleChange} 
                        />

                        <Button 
                            type="submit" variant="contained" color="primary" 
                            fullWidth size="large" sx={{ mt: 2 }}
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
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
