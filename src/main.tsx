import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Alert, CssBaseline, ThemeProvider } from '@mui/material';
import App from './app/App';
import { AuthGate } from './features/auth/AuthGate';
import { appTheme } from './theme';
import './styles.css';
import { getMissingEnvVars } from './lib/config';

const missingEnvVars = getMissingEnvVars();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline enableColorScheme />
      {missingEnvVars.length > 0 ? (
        <Alert severity="warning" sx={{ m: 2 }}>Missing env vars: {missingEnvVars.join(', ')}</Alert>
      ) : null}
      <BrowserRouter>
        <AuthGate>
          <App />
        </AuthGate>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
