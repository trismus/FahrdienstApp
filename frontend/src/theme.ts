// src/theme.ts
import { createTheme } from '@mui/material/styles';

// A custom theme for this app, based on the dark mode design
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5D87FF', // A bright blue for highlights
    },
    secondary: {
      main: '#49BEFF', // A lighter blue for secondary actions
    },
    background: {
      default: '#1F2937', // Dark gray-blue for the main background
      paper: '#283345',   // A slightly lighter shade for paper elements like cards
    },
    text: {
      primary: '#E5E7EB', // Off-white for primary text
      secondary: '#9CA3AF', // Gray for secondary text
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Disable MUI's default gradient/background image on paper
        },
      },
    },
  },
});

export default theme;
