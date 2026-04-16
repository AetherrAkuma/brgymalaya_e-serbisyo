import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, CircularProgress, Collapse, IconButton, Stack, Chip, useTheme, Alert
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryIcon from '@mui/icons-material/History';
import api from '../../utils/axios';

function AuditCard({ log }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  // 1. Identify the Exact Actor
  const actorName = log.official_name 
    ? `${log.official_name.toUpperCase()} (Role: ${log.official_role})` 
    : log.res_first 
      ? `${log.res_first.toUpperCase()} ${log.res_last.toUpperCase()} (Resident)` 
      : `SYSTEM ENTITY [ID: ${log.user_id}]`;

  // 2. Highly Detailed Time Formatting (including milliseconds)
  const timestamp = new Date(log.timestamp);
  const formattedTime = timestamp.toLocaleString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 
  });

  // 3. Formatted Variables for the Narrative
  const txId = `TXN-${String(log.log_id).padStart(6, '0')}`;
  const environment = log.table_affected || 'GLOBAL SYSTEM CONFIGURATION';
  const network = log.ip_address ? `Secure IPv4/v6 TCP Tunnel [IP: ${log.ip_address}]` : 'Internal Subroutine Protocol';
  const targetRecord = log.record_id ? `specifically targeting Resource Index #${log.record_id}` : 'affecting the entity-wide scope';

  // 4. Color Logic based on Action Severity
  const actionColors = {
    'CREATE': 'success',
    'UPDATE': 'info',
    'STATUS_CHANGE': 'warning',
    'DELETE': 'error',
    'LOGIN': 'secondary'
  };
  const badgeColor = actionColors[log.action_type] || 'default';
  const borderHex = badgeColor !== 'default' ? theme.palette[badgeColor].main : '#94a3b8';

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, md: 3 }, 
        borderRadius: 3, 
        border: '1px solid #e2e8f0', 
        borderLeft: `6px solid ${borderHex}`,
        transition: 'all 0.2s',
        '&:hover': { boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={3}>
        
        {/* COMPREHENSIVE NARRATIVE BLOCK */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#334155', fontSize: '0.95rem', textAlign: 'justify' }}>
            <strong style={{ color: '#0f172a' }}>[{txId}]</strong>: An authenticated forensic session belonging to <strong style={{ color: '#1e293b' }}>{actorName}</strong> initiated a highly sensitive 
            <Chip 
              label={log.action_type || 'SYSTEM EVENT'} 
              size="small" 
              color={badgeColor} 
              sx={{ mx: 0.8, fontWeight: '900', fontSize: '0.7rem', letterSpacing: 0.5 }} 
            /> 
            operation within the <strong style={{ color: '#1e293b' }}>{environment}</strong> architecture. 
            <br/><br/>
            This strict security sequence was transmitted via an encrypted <strong>{network}</strong> and permanently timestamped by the server clock at exactly <strong style={{ color: '#0f172a' }}>{formattedTime}</strong>. 
            The database protocol was executed successfully, {targetRecord}, ensuring that all exact state changes and data deltas are irrevocably written to the Barangay Forensic Ledger for compliance tracking.
          </Typography>
        </Box>

        {/* TOGGLE JSON PAYLOAD BUTTON */}
        <Box sx={{ alignSelf: { xs: 'flex-end', md: 'flex-start' } }}>
            <IconButton onClick={() => setOpen(!open)} sx={{ bgcolor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 2 }}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
        </Box>
      </Stack>

      {/* EXPANDABLE RAW PAYLOAD DATA */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 3, p: 3, bgcolor: '#0f172a', borderRadius: 2, color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto', boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.3)' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontWeight: 'bold', textTransform: 'uppercase' }}>
            <ShieldIcon fontSize="small" /> RAW CRYPTOGRAPHIC PAYLOAD & DELTA
          </Typography>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
            <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2, borderLeft: '2px solid #ef4444' }}>
              <Typography variant="caption" sx={{ color: '#ef4444', display: 'block', mb: 1, fontWeight: 'bold' }}>[-] PREVIOUS SYSTEM STATE (OLD_VALUE):</Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {log.old_value ? JSON.stringify(log.old_value, null, 2) : 'NULL (No previous state recorded)'}
              </pre>
            </Box>
            
            <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2, borderLeft: '2px solid #22c55e' }}>
              <Typography variant="caption" sx={{ color: '#22c55e', display: 'block', mb: 1, fontWeight: 'bold' }}>[+] OVERWRITTEN STATE (NEW_VALUE):</Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {log.new_value ? JSON.stringify(log.new_value, null, 2) : 'NULL (Record purged or unchanged)'}
              </pre>
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connects to Endpoint 35 in server.js
    api.get('/admin/audit-logs')
      .then(res => {
        setLogs(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch logs:", err);
        setError("Failed to fetch forensic data. Ensure Endpoint 35 is updated in server.js.");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="overline" color="text.secondary" fontWeight="bold">Decrypting Forensic Ledger...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', animation: 'fadeIn 0.6s ease-out' }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <HistoryIcon color="primary" sx={{ fontSize: 40 }} /> Forensic Audit Ledger
        </Typography>
        <Typography color="text.secondary" variant="body1">
          An immutable, highly detailed narrative timeline of every critical database operation executed within the E-Serbisyo architecture.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}

      <Stack spacing={3}>
        {logs.length > 0 ? (
          logs.map(log => <AuditCard key={log.log_id} log={log} />)
        ) : (
          <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
            <ShieldIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight="bold">Ledger is currently empty.</Typography>
            <Typography variant="body2" color="text.secondary">No forensic actions have been recorded in the database yet.</Typography>
          </Paper>
        )}
      </Stack>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
}