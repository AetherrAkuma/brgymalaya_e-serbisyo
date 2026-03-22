import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Card, CardContent, Chip, Box, Alert, Button, CircularProgress } from '@mui/material';
import { publicAPI } from '../services/api';

const QRVerification = () => {
  const { qrHash } = useParams();
  const navigate = useNavigate();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyQR = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.verifyQR(qrHash);
        
        if (response.data.status) {
          setVerificationData(response.data);
        } else {
          setError('Invalid QR code or document not found.');
        }
      } catch (err) {
        console.error('Error verifying QR:', err);
        setError('Failed to verify document. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (qrHash) {
      verifyQR();
    } else {
      setError('No QR code provided.');
      setLoading(false);
    }
  }, [qrHash]);

  const handleBack = () => {
    navigate('/document-types');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Verifying document...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 3 }}>
        Back to Document Types
      </Button>
      
      <Typography variant="h4" gutterBottom>
        Document Verification
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {verificationData && (
        <Card sx={{ boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2">
                {verificationData.status}
              </Typography>
              <Chip 
                label={verificationData.status} 
                color={verificationData.status === 'Valid' ? 'success' : 'error'}
                size="large"
              />
            </Box>
            
            <Typography variant="body1" paragraph>
              {verificationData.message}
            </Typography>

            {verificationData.details && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Document Details:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reference Number:
                  </Typography>
                  <Typography variant="body2">
                    {verificationData.details.reference}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Document Type:
                  </Typography>
                  <Typography variant="body2">
                    {verificationData.details.document}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Owner:
                  </Typography>
                  <Typography variant="body2">
                    {verificationData.details.owner}
                  </Typography>
                  
                  {verificationData.details.issued_on && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Issued On:
                      </Typography>
                      <Typography variant="body2">
                        {new Date(verificationData.details.issued_on).toLocaleDateString()}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default QRVerification;