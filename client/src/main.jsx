import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Material UI Imports
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { barangayTheme } from './theme/index.js';
import { SnackbarProvider } from './context/SnackbarContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={barangayTheme}>
      <CssBaseline />
      <SnackbarProvider>
        <App />
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>,
);