import { useState, useEffect } from 'react';
import { Typography, Grid, Card, CardContent, CardMedia, Chip, CircularProgress, Alert, Box } from '@mui/material';
import { residentAPI, publicAPI } from '../services/api';

const ResidentDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [requestsRes, announcementsRes] = await Promise.all([
                    residentAPI.getDashboard(),
                    publicAPI.getAnnouncements()
                ]);

                if (requestsRes.data.status === 'success') {
                    setRequests(requestsRes.data.data);
                }

                if (announcementsRes.data.status === 'success') {
                    setAnnouncements(announcementsRes.data.data);
                }
            } catch (err) {
                console.error('Dashboard error:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const activeRequests = requests.filter(r => 
        ['Pending', 'For Verification', 'For Payment', 'Processing', 'Ready for Pickup'].includes(r.request_status)
    );

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Community Announcements
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {/* Announcements */}
                <Grid item xs={12} md={8}>
                    {announcements.length > 0 ? (
                        announcements.map((announcement) => (
                            <Card key={announcement.announcement_id} sx={{ mb: 2 }}>
                                {announcement.image_path && (
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={announcement.image_path}
                                        alt={announcement.title}
                                    />
                                )}
                                <CardContent>
                                    {announcement.is_pinned && (
                                        <Chip label="Pinned" color="error" size="small" sx={{ mb: 1 }} />
                                    )}
                                    <Typography variant="h5" component="div">
                                        {announcement.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {announcement.content_body}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Posted: {new Date(announcement.date_posted).toLocaleDateString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent>
                                <Typography variant="body1" color="text.secondary" textAlign="center">
                                    No announcements at this time.
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Status Summary */}
                <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quick Status
                            </Typography>
                            <Typography variant="body2">
                                Active Requests: <strong>{activeRequests.length}</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Recent Requests:
                            </Typography>
                            {activeRequests.slice(0, 3).map((req) => (
                                <Box key={req.request_id} sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                    <Typography variant="body2">
                                        {req.type_name} - <Chip label={req.request_status} size="small" />
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Ref: {req.reference_no}
                                    </Typography>
                                </Box>
                            ))}
                            {activeRequests.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    No active requests
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default ResidentDashboard;
