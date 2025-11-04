// src/main.jsx (UPDATED)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// --- THIS IS THE FIX ---
// We ONLY import index.css, which now contains all our styles.
// The separate import for 'theme.css' is removed.
import './index.css';
// -----------------------

import { AuthProvider } from './context/AuthContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext.jsx';

console.log('main.jsx: Top-level loading...');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);