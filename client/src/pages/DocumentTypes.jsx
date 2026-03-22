import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Chip, Box, Alert, Grid } from '@mui/material';
import { publicAPI } from '../services/api';

const DocumentTypes = () => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getDocumentTypes();
        
        if (response.data.status === 'success') {
          setDocumentTypes(response.data.data);
        } else {
          setError('Failed to load document types');
        }
      } catch (err) {
        console.error('Error fetching document types:', err);
        setError('Failed to load document types. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6">Loading document types...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Available Documents
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {documentTypes.length === 0 ? (
        <Alert severity="info">
          No document types available at this time.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {documentTypes.map((docType) => (
            <Grid item xs={12} md={6} key={docType.doc_type_id}>
              <Card sx={{ height: '100%', boxShadow: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      {docType.type_name}
                    </Typography>
                    <Chip 
                      label={docType.base_fee > 0 ? `₱${docType.base_fee}` : 'FREE'} 
                      color={docType.base_fee > 0 ? 'primary' : 'success'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {docType.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Requirements:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {docType.requirements || 'Valid ID'}
                    </Typography>
                  </Box>
                  {docType.validity_days && (
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`Valid for ${docType.validity_days} days`} 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default DocumentTypes;