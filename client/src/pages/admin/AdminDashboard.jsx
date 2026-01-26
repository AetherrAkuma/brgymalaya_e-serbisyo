import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Grid, Paper, Typography, CircularProgress, Alert } from '@mui/material';

// StatCard Component
const StatCard = ({ title, value, color }) => (
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center', borderLeft: `6px solid ${color}` }}>
        <Typography variant="h3" fontWeight="bold" color={color}>
            {value}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 1 }}>
            {title}
        </Typography>
    </Paper>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({ pending: 0, processing: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                // Ensure this matches the updated server route
                const res = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/admin/stats`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err);
                setError("Could not load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <Container sx={{ mt: 5, textAlign: 'center' }}><CircularProgress /></Container>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
                Dashboard Overview
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* 1. PENDING (Yellow) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard title="Pending Verifications" value={stats.pending} color="#ff9800" />
                </Grid>

                {/* 2. PROCESSING / PAID (Blue) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard title="Processing / Paid" value={stats.processing} color="#2196f3" />
                </Grid>

                {/* 3. RELEASED (Green) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <StatCard title="Total Released" value={stats.completed} color="#4caf50" />
                </Grid>
            </Grid>
        </Container>
    );
};

export default AdminDashboard;