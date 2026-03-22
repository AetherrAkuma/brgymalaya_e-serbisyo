import React, { useState } from 'react';
import { Button, Box, Alert, CircularProgress, Typography } from '@mui/material';
import { adminAPI } from '../services/api';

const PDFGenerator = ({ requestId, onGenerate }) => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generatePDF = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await adminAPI.generatePDF(requestId);
      
      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      setSuccess('PDF generated and downloaded successfully!');
      if (onGenerate) onGenerate();
      
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err.response?.data?.error || 'Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Button
        variant="contained"
        onClick={generatePDF}
        disabled={generating}
        startIcon={generating ? <CircularProgress size={20} /> : null}
      >
        {generating ? 'Generating...' : 'Generate PDF'}
      </Button>
      
      {generating && (
        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
          Please wait while we generate your document...
        </Typography>
      )}
    </Box>
  );
};

export default PDFGenerator;