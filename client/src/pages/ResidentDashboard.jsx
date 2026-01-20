import { Typography, Grid, Card, CardContent, CardMedia, Chip } from '@mui/material';

const ResidentDashboard = () => {
    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Community Announcements
            </Typography>
            
            {/* Dummy Announcement Data (We will connect to DB later) */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardMedia
                            component="img"
                            height="200"
                            image="https://via.placeholder.com/800x200"
                            alt="Barangay Hall"
                        />
                        <CardContent>
                            <Chip label="Important" color="error" size="small" sx={{ mb: 1 }} />
                            <Typography variant="h5" component="div">
                                Libreng Check-up Schedule
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                The Barangay Health Center will be conducting free medical check-ups this coming Friday, Jan 24, from 8:00 AM to 5:00 PM. Please bring your ID.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Summary */}
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quick Status
                            </Typography>
                            <Typography variant="body2">
                                Active Requests: <strong>0</strong>
                            </Typography>
                            <Typography variant="body2">
                                Pending Payments: <strong>₱ 0.00</strong>
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default ResidentDashboard;