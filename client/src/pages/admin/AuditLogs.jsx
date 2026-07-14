import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, CircularProgress, Collapse, IconButton, Stack, Chip, useTheme, Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LanguageIcon from '@mui/icons-material/Language';
import StorageIcon from '@mui/icons-material/Storage';
import api from '../../utils/axios';

const actionMeta = {
  'user.login':           { label: 'Login',           icon: '🔑' },
  'user.logout':          { label: 'Logout',          icon: '🚪' },
  'user.password_change': { label: 'Password Change', icon: '🔒' },
  'user.password_reset':  { label: 'Password Reset',  icon: '🔐' },
  'user.forgot_password': { label: 'Forgot Password', icon: '📧' },
  'resident.register':    { label: 'Register',        icon: '📝' },
  'resident.status_change': { label: 'Status Change', icon: '🔄' },
  'resident.quick_register': { label: 'Quick Register', icon: '⚡' },
  'request.create':       { label: 'Request Created', icon: '📄' },
  'requests.status_change': { label: 'Status Change', icon: '🔄' },
  'document.print':       { label: 'Document Printed',icon: '🖨️' },
  'document.status_change': { label: 'Status Change', icon: '🔄' },
  'document.auto_delete_id_proof': { label: 'ID Proof Purged', icon: '🗑️' },
  'document.signature_upload': { label: 'Signature Uploaded', icon: '✍️' },
  'document_type.create': { label: 'Doc Type Created',icon: '➕' },
  'document_type.update': { label: 'Doc Type Updated',icon: '✏️' },
  'document_type.layout_update': { label: 'Layout Updated', icon: '🎨' },
  'document_type.template_upload': { label: 'Template Uploaded', icon: '📋' },
  'payment.encode':       { label: 'Payment Encoded', icon: '💰' },
  'payment.exempt':       { label: 'Fee Exempted',    icon: '🆓' },
  'announcement.create':  { label: 'Announcement Created', icon: '📢' },
  'announcement.approve': { label: 'Announcement Approved', icon: '✅' },
  'announcement.reject':  { label: 'Announcement Rejected', icon: '❌' },
  'announcement.delete':  { label: 'Announcement Deleted', icon: '🗑️' },
  'official.create':      { label: 'Official Created', icon: '👤' },
  'official.status_change': { label: 'Official Status Change', icon: '🔄' },
  'official.delete':      { label: 'Official Deleted',icon: '🗑️' },
  'registration.reject':  { label: 'Registration Rejected', icon: '🚫' },
  'system.backup':        { label: 'Backup Created',  icon: '💾' },
  'system.restore':       { label: 'System Restored', icon: '⏮️' },
  'system.backup_delete': { label: 'Backup Deleted',  icon: '🗑️' },
  'system.settings_update': { label: 'Settings Updated', icon: '⚙️' },
};

function humanAction(actionType) {
  return actionMeta[actionType]?.label || actionType || 'Unknown Event';
}

function actionCategory(actionType) {
  if (!actionType) return 'default';
  if (actionType.startsWith('user.')) return 'secondary';
  if (actionType.startsWith('document.') || actionType.startsWith('payment.') || actionType.startsWith('registration.')) return 'warning';
  if (actionType.startsWith('announcement.') || actionType.startsWith('resident.')) return 'info';
  if (actionType.startsWith('official.') || actionType.startsWith('system.')) return 'error';
  return 'default';
}

function formatRelativeTime(ts) {
  const diff = Date.now() - ts.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return ts.toLocaleDateString();
}

function AuditCard({ log }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const ts = new Date(log.timestamp);
  const isoTime = ts.toISOString();
  const localeTime = ts.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const actorName = log.official_name
    ? `${log.official_name} (${log.official_role})`
    : log.res_first
      ? `${log.res_first} ${log.res_last} (Resident)`
      : `System #${log.user_id}`;

  const txId = `#${String(log.log_id).padStart(6, '0')}`;
  const badgeColor = actionCategory(log.action_type);
  const borderHex = badgeColor !== 'default' ? theme.palette[badgeColor].main : '#94a3b8';
  const outcomeColor = log.outcome === 'success' ? 'success' : 'error';
  const targetLabel = log.table_affected ? log.table_affected.replace('tbl_', '') : '—';
  const hasChanges = log.old_value || log.new_value;

  const changes = [];
  if (log.old_value && typeof log.old_value === 'object') {
    Object.entries(log.old_value).forEach(([k, v]) => {
      const newVal = log.new_value?.[k];
      if (newVal !== undefined && JSON.stringify(newVal) !== JSON.stringify(v)) {
        changes.push({ key: k, from: v, to: newVal });
      } else if (newVal === undefined) {
        changes.push({ key: k, from: v, to: '(removed)' });
      }
    });
  }
  if (log.new_value && typeof log.new_value === 'object') {
    Object.entries(log.new_value).forEach(([k, v]) => {
      if (!log.old_value || !(k in log.old_value)) {
        changes.push({ key: k, from: '(none)', to: v });
      }
    });
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        borderLeft: `5px solid ${borderHex}`,
        transition: 'all 0.15s',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }
      }}
    >
      {/* ── Header: TX + Outcome + Action ── */}
      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" fontWeight="900" sx={{ color: '#64748b', minWidth: 60 }}>
          {txId}
        </Typography>
        <Chip label={log.outcome || 'success'} size="small" color={outcomeColor}
          sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 22 }} />
        <Chip label={humanAction(log.action_type)} size="small" color={badgeColor}
          sx={{ fontWeight: 700, fontSize: '0.7rem', letterSpacing: 0.3 }} />
        <Typography variant="caption" sx={{ color: '#94a3b8', ml: 'auto', whiteSpace: 'nowrap' }}>
          {formatRelativeTime(ts)}
        </Typography>
      </Box>

      {/* ── Body: Actor → Action → Target + Context ── */}
      <Box sx={{ px: 2.5, pb: 1.5 }}>
        <Stack spacing={0.8}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 15, color: '#64748b' }} />
            <Typography variant="body2" fontWeight={600} color="#1e293b">{actorName}</Typography>
            <Typography variant="body2" color="#94a3b8">→</Typography>
            <StorageIcon sx={{ fontSize: 14, color: '#64748b' }} />
            <Typography variant="body2" fontWeight={500} color="#475569">{targetLabel}</Typography>
            {log.record_id && (
              <Chip label={`ID ${log.record_id}`} size="small" variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20, borderColor: '#cbd5e1' }} />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <AccessTimeIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
            <Typography variant="caption" color="#64748b" title={isoTime}>{localeTime}</Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <LanguageIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
            <Typography variant="caption" color="#64748b">
              IP: {log.ip_address || 'N/A'}
              {log.user_agent && ` | ${log.user_agent.length > 80 ? log.user_agent.slice(0, 80) + '…' : log.user_agent}`}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* ── Changes Summary (auto-shown) ── */}
      {changes.length > 0 && (
        <Box sx={{ px: 2.5, pb: 1 }}>
          <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', borderColor: '#e2e8f0', overflow: 'hidden' }}>
            {changes.map((c, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 1.5, py: 1,
                borderBottom: i < changes.length - 1 ? '1px solid #e2e8f0' : 'none',
                fontSize: '0.8rem'
              }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', minWidth: 120 }}>
                  {c.key}
                </Typography>
                {c.from !== '(none)' && (
                  <Typography variant="caption" sx={{ color: '#dc2626', bgcolor: '#fef2f2', px: 0.8, py: 0.2, borderRadius: 1, fontFamily: 'monospace' }}>
                    {typeof c.from === 'object' ? JSON.stringify(c.from) : String(c.from)}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>→</Typography>
                <Typography variant="caption" sx={{ color: '#16a34a', bgcolor: '#f0fdf4', px: 0.8, py: 0.2, borderRadius: 1, fontFamily: 'monospace' }}>
                  {typeof c.to === 'object' ? JSON.stringify(c.to) : String(c.to)}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      )}

      {/* ── Expand: Raw JSON ── */}
      {hasChanges && (
        <Box sx={{ px: 2.5, pb: 1.5 }}>
          <IconButton onClick={() => setOpen(!open)} size="small" sx={{ fontSize: '0.75rem', color: '#94a3b8', gap: 0.5 }}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            <Typography variant="caption">{open ? 'Hide Raw' : 'Raw JSON'}</Typography>
          </IconButton>
          <Collapse in={open}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ flex: 1, p: 1.5, bgcolor: '#1e293b', borderRadius: 2, overflow: 'auto', maxHeight: 300 }}>
                <Typography variant="caption" sx={{ color: '#f87171', display: 'block', mb: 0.5, fontWeight: 'bold' }}>Old Value</Typography>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                  {log.old_value ? JSON.stringify(log.old_value, null, 2) : 'null'}
                </pre>
              </Box>
              <Box sx={{ flex: 1, p: 1.5, bgcolor: '#1e293b', borderRadius: 2, overflow: 'auto', maxHeight: 300 }}>
                <Typography variant="caption" sx={{ color: '#4ade80', display: 'block', mb: 0.5, fontWeight: 'bold' }}>New Value</Typography>
                <pre style={{ margin: 0, color: '#e2e8f0', fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                  {log.new_value ? JSON.stringify(log.new_value, null, 2) : 'null'}
                </pre>
              </Box>
            </Stack>
          </Collapse>
        </Box>
      )}
    </Paper>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then(res => {
        setLogs(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch logs:", err);
        setError("Failed to fetch audit logs from server.");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 2 }}>
      <CircularProgress size={60} thickness={4} />
      <Typography variant="overline" color="text.secondary" fontWeight="bold">Loading Audit Logs...</Typography>
    </Box>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="900" color="#0f172a" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <HistoryIcon color="primary" sx={{ fontSize: 36 }} /> Audit Ledger
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Chronological record of all system actions.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Stack spacing={2}>
        {logs.length > 0 ? (
          logs.map(log => <AuditCard key={log.log_id} log={log} />)
        ) : (
          <Paper elevation={0} sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1', bgcolor: '#f8fafc' }}>
            <ShieldIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" fontWeight="bold">No audit records found.</Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
