import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, Paper, Typography, Button, TextField, Alert, Stack, 
  Tabs, Tab, Card, CardContent, CircularProgress, Divider, Grid, Chip 
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

// Dynamically load PDF.js from CDN to scan QR codes inside PDF files
const loadPdfJs = () => {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

// Helper to format date and time together
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function VerifyQR() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Dynamic back navigation based on layouts (Public, Resident, Admin)
  const isResident = location.pathname.startsWith('/resident');
  const isAdmin = location.pathname.startsWith('/admin');

  let backPath = '/';
  let backText = 'Back to Homepage';

  if (isResident) {
    backPath = '/resident/dashboard';
    backText = 'Back to Dashboard';
  } else if (isAdmin) {
    backPath = '/admin/dashboard';
    backText = 'Back to Command Center';
  }

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
      const cleanUrl = text.split('?')[0].split('#')[0];
      const parts = cleanUrl.split('/').filter(Boolean);
      return parts[parts.length - 1]; // Return the last segment
    }
    return text;
  };

  // --- FILE UPLOADER SCANNER (SUPPORTS IMAGE AND PDF) ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setVerifyResult(null);
    setScanError(null);

    // Stop camera if active
    stopCamera();

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // Load PDF.js library dynamically
        const pdfjsLib = await loadPdfJs();
        
        // Read file as ArrayBuffer
        const fileReader = new FileReader();
        const arrayBuffer = await new Promise((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result);
          fileReader.onerror = () => reject(fileReader.error);
          fileReader.readAsArrayBuffer(file);
        });

        // Load the PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (pdf.numPages === 0) {
          throw new Error("Empty PDF file uploaded.");
        }

        // Render page 1 (which holds the QR code stamps)
        const page = await pdf.getPage(1);
        const scale = 2.0; // Render at 2x scale for crystal clear QR details
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert the rendered canvas page into a PNG Blob for Html5Qrcode scanner
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) {
          throw new Error("Failed to render PDF page onto canvas blob.");
        }
        const imageFile = new File([blob], 'extracted_pdf_page.png', { type: 'image/png' });

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        const decodedText = await scanner.scanFile(imageFile, true);
        const parsedHash = extractHashFromUrl(decodedText);
        verifyDocumentHash(parsedHash);
      } else {
        // Standard image scanning
        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        const decodedText = await scanner.scanFile(file, true);
        const parsedHash = extractHashFromUrl(decodedText);
        verifyDocumentHash(parsedHash);
      }
    } catch (err) {
      console.error("QR File Parsing Error:", err);
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setScanError("Failed to detect a QR code in this PDF. Please ensure the PDF is a valid certificate containing a clear QR code.");
      } else {
        setScanError("Failed to detect a QR code in this image. Try uploading a clearer, higher-resolution picture.");
      }
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
          onClick={() => navigate(backPath)}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          {backText}
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
          <Tab icon={<UploadFileIcon />} label="Upload Image / PDF" />
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
                {/* Visual scanner laser line */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', bgcolor: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'scanSlide 2s linear infinite', zIndex: 10 }} />
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
        {/* TAB 1: FILE SCANNER UPLOADER (IMAGE / PDF) */}
        {/* ========================================== */}
        {tabValue === 1 && (
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ py: 2, px: 4, borderRadius: 3, fontWeight: 'bold' }}
            >
              Select Image or PDF Document
              <input
                type="file"
                accept="image/*,application/pdf"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
              Upload a clear image or PDF certificate containing the stamped QR code.
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
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{ py: 6, animation: 'pulseGlow 2s infinite' }}>
            <CircularProgress size={60} thickness={4} sx={{ mb: 3, color: 'primary.main' }} />
            <Typography variant="body1" fontWeight="bold" color="text.primary">Analyzing Certificate...</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Parsing security QR codes & verifying signatures</Typography>
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
              <Card sx={{ border: '2px solid #10b981', borderRadius: 3, bgcolor: '#f0fdf4', boxShadow: 'none', animation: 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <VerifiedIcon color="success" sx={{ fontSize: 36 }} />
                    <Box>
                      <Typography variant="h6" fontWeight="bold" color="#047857">DOCUMENT VERIFIED AUTHENTIC</Typography>
                      <Typography variant="caption" color="text.secondary">{verifyResult.message}</Typography>
                    </Box>
                  </Stack>
                  
                  {verifyResult.details.status !== 'Issued' && (
                    <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                      <strong>Pending Release:</strong> This document is authentic but has not been officially released to the resident yet. It is currently in the <strong>{verifyResult.details.status}</strong> stage. Do not accept this copy as an official issued document.
                    </Alert>
                  )}
                  
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
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">DOCUMENT STATUS</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip 
                          label={verifyResult.details.status || 'Issued'} 
                          size="small" 
                          sx={{ 
                            bgcolor: verifyResult.details.status === 'Issued' ? '#ecfdf5' : '#eff6ff', 
                            color: verifyResult.details.status === 'Issued' ? '#047857' : '#1d4ed8', 
                            fontWeight: 'bold' 
                          }} 
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">DATE REQUESTED</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#0f172a">
                        {formatDateTime(verifyResult.details.requested_on)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">DATE ISSUED</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#0f172a">
                        {formatDateTime(verifyResult.details.issued_on)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ) : (
              // --- WARNING / FORGERY / REVOKED ---
              <Card sx={{ border: '2px solid #ef4444', borderRadius: 3, bgcolor: '#fef2f2', boxShadow: 'none', animation: 'slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
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

      <style>
        {`
          @keyframes scanSlide {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          @keyframes pulseGlow {
            0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          @keyframes slideInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      </Paper>
    </Box>
  );
}
