import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, CircularProgress, Alert, Stack, Divider } from '@mui/material';
import api from '../../utils/axios';

export default function SystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/admin/settings').then(res => {
      setSettings(res.data.data);
      setLoading(false);
    });
  }, []);

  const handleUpdate = async (key, value) => {
    try {
      await api.put(`/admin/settings/${key}`, { setting_value: value });
      setMsg({ type: 'success', text: `Setting ${key} updated.` });
    } catch (err) { setMsg({ type: 'error', text: 'Update failed.' }); }
  };

  if (loading) return <CircularProgress sx={{ m: 5 }} />;

  return (
    <Box sx={{ p: 3, maxWidth: 800 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>System Settings</Typography>
      {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={4}>
          {settings.map(s => (
            <Box key={s.setting_id}>
              <Typography variant="subtitle2" fontWeight="bold">{s.setting_key.replace(/_/g, ' ').toUpperCase()}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{s.description}</Typography>
              <Stack direction="row" spacing={2}>
                <TextField 
                  fullWidth size="small" variant="filled" defaultValue={s.setting_value} 
                  onBlur={(e) => handleUpdate(s.setting_key, e.target.value)} 
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}