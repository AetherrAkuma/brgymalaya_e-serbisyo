import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Material UI Imports
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { barangayTheme } from './theme/index.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ThemeProvider applies our custom colors and fonts to all MUI components */}
    <ThemeProvider theme={barangayTheme}>
      {/* CssBaseline acts like a reset, ensuring consistent margins and background colors across all browsers */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);