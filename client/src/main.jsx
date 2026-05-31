import { createRoot } from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <SnackbarProvider anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </SnackbarProvider>,
);