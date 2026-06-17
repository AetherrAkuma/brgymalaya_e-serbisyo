import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Paper, Typography, Button, TextField, Alert, Stack, 
  Tabs, Tab, Card, CardContent, CircularProgress, Divider, Grid 
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../utils/axios';

export default function VerifyQR() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  // States
  const [hashInput, setHashInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const qrRef = useRef(null); // Html5Qrcode instance
  const SCANNER_ELEMENT_ID = "qr-webcam-reader";

  useEffect(() => {
    // If a hash parameter is passed in the URL, verify it immediately
    if (hash) {
      verifyDocumentHash(hash);
    }
  }, [hash]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const verifyDocumentHash = async (targetHash) => {
    if (!targetHash) return;
    setLoading(true);
    setVerifyResult(null);
    setScanError(null);

    try {
      const res = await api.get(`/public/verify/${targetHash}`);
      setVerifyResult(res.data);
    } catch (err) {
      console.error(err);
      setVerifyResult({
        status: 'invalid',
        message: 'This document record was not found or may be a forgery.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setScanError(null);
    setVerifyResult(null);
    stopCamera();
  };

  // --- CAMERA CONTROL FUNCTIONS ---
  const startCamera = async () => {
    setScanError(null);
    setVerifyResult(null);
    setCameraActive(true);

    // Give the DOM a millisecond to mount the container div
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        qrRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Success callback
            const parsedHash = extractHashFromUrl(decodedText);
            stopCamera();
            verifyDocumentHash(parsedHash);
          },
          (errorMessage) => {
            // Silent error callback, runs continually during scanning
          }
        );
      } catch (err) {
        console.error("Camera start failed:", err);
        setScanError("Unable to access the camera. Make sure permissions are granted and you are using a secure connection (HTTPS).");
        setCameraActive(false);
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (qrRef.current && qrRef.current.isScanning) {
      try {
        await qrRef.current.stop();
      } catch (err) {
        console.error("Camera stop failed:", err);
      }
    }
    setCameraActive(false);
  };

  const extractHashFromUrl = (text) => {
    if (text.startsWith('http://') || text.startsWith('https://')) {
      const parts = text.split('/');
      return parts[parts.length - 1]; // Return the last segment
    }
    return text;
  };

  // --- FILE UPLOADER SCANNER ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setVerifyResult(null);
    setScanError(null);

    // Stop camera if active
    stopCamera();

    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      const decodedText = await scanner.scanFile(file, true);
      const parsedHash = extractHashFromUrl(decodedText);
      verifyDocumentHash(parsedHash);
    } catch (err) {
      console.error(err);
      setScanError("Failed to detect a QR code in this image. Try uploading a clearer, higher-resolution picture.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!hashInput.trim()) return;
    const cleanHash = extractHashFromUrl(hashInput.trim());
    verifyDocumentHash(cleanHash);
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3, minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/')}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Back to Homepage
        </Button>
        <Typography variant="h6" fontWeight="bold" color="primary">E-Serbisyo Verification</Typography>
      </Box>

      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
        
        <Box textAlign="center" sx={{ mb: 4 }}>
          <QrCodeScannerIcon color="primary" sx={{ fontSize: 50, mb: 1 }} />
          <Typography variant="h4" fontWeight="900" color="#0f172a" gutterBottom>
            Verify Barangay Document
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan the stamped QR code or enter the verification hash to confirm document authenticity.
          </Typography>
        </Box>

        {/* --- TABS SELECTOR --- */}
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          indicatorColor="primary" 
          textColor="primary"
          sx={{ mb: 4, borderBottom: '1px solid #e2e8f0' }}
        >
          <Tab icon={<PhotoCameraIcon />} label="Camera Scanner" />
          <Tab icon={<UploadFileIcon />} label="Upload Image" />
          <Tab icon={<SearchIcon />} label="Manual Search" />
        </Tabs>

        {scanError && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{scanError}</Alert>}

        {/* ========================================== */}
        {/* TAB 0: WEBCAM LIVE CAMERA SCANNER          */}
        {/* ========================================== */}
        {tabValue === 0 && (
          <Stack spacing={3} alignItems="center">
            {cameraActive ? (
              <Box sx={{ width: '100%', maxWidth: 400, position: 'relative', borderRadius: 3, overflow: 'hidden', border: '3px solid #3b82f6' }}>
                {/* Scanner Target Container */}
                <div id={SCANNER_ELEMENT_ID} style={{ width: '100%', minHeight: '300px', backgroundColor: '#000' }} />
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="error" 
                  onClick={stopCamera}
                  sx={{ borderRadius: 0 }}
                >
                  Stop Camera
                </Button>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  width: '100%', 
                  maxWidth: 400, 
                  height: 250, 
                  bgcolor: '#f8fafc', 
                  borderRadius: 3, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed #cbd5e1',
                  cursor: 'pointer'
                }}
                onClick={startCamera}
              >
                <PhotoCameraIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                <Typography fontWeight="bold" color="text.secondary">Click to Start Camera Scanner</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Requires HTTPS in remote environments</Typography>
              </Box>
            )}
          </Stack>
        )}

        {/* ========================================== */}
        {/* TAB 1: FILE SCANNER UPLOADER               */}
        {/* ========================================== */}
        {tabValue === 1 && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ py: 2, px: 4, borderRadius: 3, fontWeight: 'bold' }}
            >
              Select Document QR Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
              Upload a clear picture/screenshot of the QR code stamped on the certificate.
            </Typography>
            {/* Hidden reader element needed by library file parser */}
            <div id={SCANNER_ELEMENT_ID} style={{ display: 'none' }} />
          </Box>
        )}

        {/* ========================================== */}
        {/* TAB 2: MANUAL SEARCH                       */}
        {/* ========================================== */}
        {tabValue === 2 && (
          <form onSubmit={handleManualSearch}>
            <Stack spacing={2} direction="row">
              <TextField
                fullWidth
                label="Verification Code / Reference URL"
                variant="outlined"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter document hash or verification URL"
                required
              />
              <Button 
                type="submit" 
                variant="contained" 
                startIcon={<SearchIcon />}
                sx={{ px: 3, borderRadius: 2 }}
              >
                Verify
              </Button>
            </Stack>
          </form>
        )}

        {/* --- LOADING SPINNER --- */}
        {loading && (
          <Box display="flex" justifyContent="center" sx={{ py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* ========================================== */}
        {/* VERIFICATION RESULT RENDERING              */}
        {/* ========================================== */}
        {verifyResult && !loading && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 4 }} />
            
            {verifyResult.status === 'Valid' ? (
              // --- VERIFIED AUTHENTIC DOCUMENT ---
              <Card sx={{ border: '2px solid #10b981', borderRadius: 3, bgcolor: '#f0fdf4', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <VerifiedIcon color="success" sx={{ fontSize: 36 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="#047857">DOCUMENT VERIFIED AUTHENTIC</Typography>
                      <Typography variant="caption" color="text.secondary">{verifyResult.message}</Typography>
                    </Box>
                  </Stack>
                  
                  <Divider sx={{ mb: 2, borderColor: 'rgba(16, 185, 129, 0.2)' }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">DOCUMENT TYPE</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#0f172a">{verifyResult.details.document}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">REFERENCE NUMBER</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }} color="#0f172a">{verifyResult.details.reference}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">RESIDENT OWNER</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#0f172a">{verifyResult.details.owner}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">DATE ISSUED</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#0f172a">{new Date(verifyResult.details.issued_on).toLocaleDateString(undefined, { dateStyle: 'long' })}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              // --- WARNING / FORGERY / REVOKED ---
              <Card sx={{ border: '2px solid #ef4444', borderRadius: 3, bgcolor: '#fef2f2', boxShadow: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <WarningAmberIcon color="error" sx={{ fontSize: 36 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="#b91c1c">VERIFICATION FAILED</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {verifyResult.message}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                    If this is a physical document claiming to be issued by Barangay Malaya, it is either expired, revoked, or a forgery. Please contact officials immediately.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

      </Paper>
    </Box>
  );
}
