import { createTheme } from '@mui/material/styles';

// Define the official Barangay Malaya color palette and typography
export const barangayTheme = createTheme({
  palette: {
    primary: {
      main: '#0D47A1', // Deep 'Government Trust' Blue
      light: '#5472D3',
      dark: '#002171',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2E7D32', // Official 'Action/Success' Green
      light: '#60AD5E',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F6F8', // Soft gray background to make white cards "pop"
      paper: '#FFFFFF',
    },
    error: {
      main: '#D32F2F', // Standard red for rejections/deletions
    },
  },
  typography: {
    // Using a clean, modern font stack
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.5rem' },
    button: { 
      textTransform: 'none', // Disables the default ALL CAPS buttons in MUI for a modern look
      fontWeight: 600 
    },
  },
  shape: {
    borderRadius: 8, // Softly rounded corners for all inputs and cards
  },
  components: {
    // Component-specific overrides
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none', // Flat design by default
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0,0,0,0.1)', // Soft elevation on hover
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0,0,0,0.05)', // Very subtle shadow for dashboard cards
        },
      },
    },
  },
});