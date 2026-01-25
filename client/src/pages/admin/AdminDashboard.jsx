import { Container, Grid, Paper, Typography, Box } from '@mui/material';

const StatCard = ({ title, value, color }) => (
    <Paper sx={{ p: 3, textAlign: 'center', borderLeft: `5px solid ${color}` }}>
        <Typography variant="h4" fontWeight="bold">{value}</Typography>
        <Typography variant="body2" color="textSecondary">{title}</Typography>
    </Paper>
);

const AdminDashboard = () => {
    // TODO: Phase 5.4 - Fetch these real numbers from API
    const stats = {
        pending: 12,    // Mock Data
        processing: 5,
        completed: 108
    };

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1a237e' }}>
                Dashboard Overview
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <StatCard title="Pending Verifications" value={stats.pending} color="#ff9800" />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Ready for Release" value={stats.processing} color="#2196f3" />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard title="Total Issued" value={stats.completed} color="#4caf50" />
                </Grid>
            </Grid>

            {/* We will add the "Recent Activity Table" here later */}
        </Container>
    );
};

export default AdminDashboard;