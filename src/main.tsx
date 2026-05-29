import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './index.css';
import App from './App.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      dark: '#1d4ed8',
      light: '#dbeafe',
    },
    secondary: {
      main: '#0f766e',
      dark: '#115e59',
      light: '#ccfbf1',
    },
    success: {
      main: '#16803c',
    },
    warning: {
      main: '#b7791f',
    },
    error: {
      main: '#c2410c',
    },
    text: {
      primary: '#172033',
      secondary: '#5f6b7a',
    },
    background: {
      default: '#f6f8fb',
      paper: '#ffffff',
    },
    divider: '#d8e0ea',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h4: {
      fontSize: '1.85rem',
      fontWeight: 800,
      lineHeight: 1.18,
    },
    h5: {
      fontWeight: 800,
    },
    h6: {
      fontWeight: 750,
    },
    button: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          backgroundColor: '#f6f8fb',
          color: '#172033',
        },
        '*::-webkit-scrollbar': {
          width: 10,
          height: 10,
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#b8c5d4',
          borderRadius: 8,
          border: '2px solid #eef3f8',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: '#eef3f8',
        },
        '::selection': {
          backgroundColor: '#bfdbfe',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #d8e0ea',
          boxShadow: '0 10px 28px rgba(23, 32, 51, 0.055)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#172033',
          borderBottom: '1px solid #d8e0ea',
          boxShadow: '0 8px 24px rgba(23, 32, 51, 0.06)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          boxShadow: 'none',
          minHeight: 36,
        },
        contained: {
          boxShadow: '0 8px 18px rgba(37, 99, 235, 0.18)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          transition: 'box-shadow 140ms ease, border-color 140ms ease',
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.14)',
          },
        },
        notchedOutline: {
          borderColor: '#cbd5e1',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#5f6b7a',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #d8e0ea',
          borderRadius: 8,
          backgroundColor: '#ffffff',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#e5ebf2',
        },
        head: {
          backgroundColor: '#eef3f8',
          color: '#2f3b4c',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          fontSize: '0.78rem',
          letterSpacing: 0,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: '#f1f6fb',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            paddingTop: 3,
            paddingBottom: 3,
          },
        },
        paper: {
          borderRadius: 8,
        },
        option: {
          fontSize: '0.92rem',
        },
      },
    },
    MuiMenu: {
      defaultProps: {
        marginThreshold: 12,
      },
      styleOverrides: {
        paper: {
          borderRadius: 8,
          border: '1px solid #d8e0ea',
          boxShadow: '0 18px 44px rgba(23, 32, 51, 0.14)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 6px',
          minHeight: 38,
          '&.Mui-selected': {
            backgroundColor: '#dbeafe',
            color: '#1d4ed8',
            fontWeight: 800,
          },
          '&.Mui-selected:hover': {
            backgroundColor: '#bfdbfe',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid transparent',
          '&.MuiAlert-standardInfo': {
            borderColor: '#bfdbfe',
          },
          '&.MuiAlert-standardWarning': {
            borderColor: '#fde68a',
          },
          '&.MuiAlert-standardError': {
            borderColor: '#fed7aa',
          },
          '&.MuiAlert-standardSuccess': {
            borderColor: '#bbf7d0',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
