import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import ErrorBoundary from './components/shared/ErrorBoundary.jsx';
import DemoBanner from './components/shared/DemoBanner.jsx';
import { AuthProvider } from './context/AuthProvider.jsx';
import './styles/theme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <DemoBanner />
        </AuthProvider>
        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 4000,
            className:
              'rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm font-medium text-navy-800 shadow-lg',
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#e11d48', secondary: '#fff' }, duration: 6000 },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
