import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Card, CardContent, Button, Divider, Paper 
} from '@mui/material';

// Icons for the Widgets
import AddCircleIcon from '@mui/icons-material/AddCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// We will use our Axios bridge later to fetch real data
import api from '../../utils/axios';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State to hold the resident's dynamic data
  // Grab the static name from storage
  const [residentName, setResidentName] = useState(localStorage.getItem('first_name') || 'Resident');
  const [stats, setStats] = useState({ pending: 0, completed: 0 });
  const [availableDocs, setAvailableDocs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch public documents and your EXISTING Endpoint 22 simultaneously
        const [docsRes, requestsRes] = await Promise.all([
          api.get('/public/document-types'),
          api.get('/requests/resident/me') 
        ]);
        
        setAvailableDocs(docsRes.data.data);
        
        // Let React do the math instead of querying the database twice!
        const allRequests = requestsRes.data.data;
        
        const pendingCount = allRequests.filter(req => 
          ['Pending', 'For Verification', 'For Payment', 'Processing', 'Ready for Pickup'].includes(req.request_status)
        ).length;
        
        const completedCount = allRequests.filter(req => req.request_status === 'Issued').length;

        setStats({ pending: pendingCount, completed: completedCount });

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <Box>
      {/* 1. WELCOME HEADER */}
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.dark">
        Welcome, {residentName}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your document requests and track their status here.
      </Typography>

      {/* 2. SUMMARY WIDGETS (Top Row) */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        
        {/* Widget 1: Request Action */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Need a Document?
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
                Start a new request for barangay clearance, indigency, and more.
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large"
                startIcon={<AddCircleIcon />}
                onClick={() => navigate('/resident/wizard')} // Points to the next phase we will build
                sx={{ width: '80%', py: 1.5, fontWeight: 'bold' }}
              >
                New Request
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Widget 2: Pending Tracker */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FFF3E0', color: '#E65100', mr: 3 }}>
                <PendingActionsIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {stats.pending}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="medium">
                  Pending Requests
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Widget 3: Completed Tracker */}
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#E8F5E9', color: 'secondary.main', mr: 3 }}>
                <CheckCircleIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight="bold" color="text.primary">
                  {stats.completed}
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight="medium">
                  Completed Documents
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* 3. AVAILABLE DOCUMENTS CATALOG */}
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }} elevation={2}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <InsertDriveFileIcon sx={{ mr: 1, color: 'primary.main' }} /> Available Documents
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={2}>
          {availableDocs.length > 0 ? (
            availableDocs.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.doc_type_id}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="inherit" 
                  sx={{ 
                    justifyContent: 'flex-start', 
                    py: 2, 
                    px: 3, 
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(13, 71, 161, 0.04)' }
                  }}
                >
                  <Typography fontWeight="medium">{doc.type_name}</Typography>
                </Button>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography color="text.secondary">No documents currently available in the system.</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
      
    </Box>
  );
}