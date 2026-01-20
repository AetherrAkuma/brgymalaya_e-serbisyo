import { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Card, CardContent, Chip, Alert } from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';

function App() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // fetching data from your Business Logic Layer
    const fetchData = async () => {
      try {
        // Uses VITE_API_BASE_URL from your client .env file
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/system/info`);
        setSystemInfo(response.data.data);
      } catch (err) {
        console.error("Connection Error:", err);
        setError("Could not connect to the Backend.");
      }
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="sm" style={{ marginTop: '50px' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        E-Serbisyo System Check
      </Typography>
      
      {/* Network Context Display (Split-Horizon Logic) */}
      <Chip 
        icon={<DnsIcon />} 
        label={`Network Context: ${import.meta.env.VITE_NETWORK_CONTEXT}`} 
        color="primary" 
        style={{ marginBottom: '20px' }} 
      />

      {error && <Alert severity="error">{error}</Alert>}

      {systemInfo ? (
        <Card variant="outlined" style={{ borderColor: 'green' }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              <StorageIcon style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Database Connection: <strong>ACTIVE</strong>
            </Typography>
            <Typography variant="h5" component="h2">
              {systemInfo.setting_value}
            </Typography>
            <Typography color="textSecondary">
              {systemInfo.description}
            </Typography>
            <Typography variant="caption" display="block" style={{ marginTop: 10 }}>
              Key: {systemInfo.setting_key}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        !error && <Typography>Loading System Data...</Typography>
      )}
    </Container>
  );
}

export default App;