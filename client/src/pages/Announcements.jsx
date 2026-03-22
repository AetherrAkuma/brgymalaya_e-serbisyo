import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, CardMedia, Chip, Box, Alert } from '@mui/material';
import { publicAPI } from '../services/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getAnnouncements();
        
        if (response.data.status === 'success') {
          setAnnouncements(response.data.data);
        } else {
          setError('Failed to load announcements');
        }
      } catch (err) {
        console.error('Error fetching announcements:', err);
        setError('Failed to load announcements. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6">Loading announcements...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Announcements
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {announcements.length === 0 ? (
        <Alert severity="info">
          No announcements at this time.
        </Alert>
      ) : (
        announcements.map((announcement) => (
          <Card key={announcement.announcement_id} sx={{ mb: 3, boxShadow: 3 }}>
            {announcement.is_pinned && (
              <Box sx={{ p: 1, backgroundColor: '#fff3cd', borderBottom: '1px solid #ffeaa7' }}>
                <Chip label="PINNED" color="warning" size="small" />
              </Box>
            )}
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                {announcement.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {announcement.content_body}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Chip 
                  label={announcement.target_audience} 
                  size="small" 
                  color={announcement.target_audience === 'All' ? 'primary' : 'secondary'}
                />
                <Typography variant="caption" color="text.secondary">
                  Posted: {new Date(announcement.date_posted).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Container>
  );
};

export default Announcements;