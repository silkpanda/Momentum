// src/main.jsx (CLEANED UP FOR SUPABASE)

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
// FIX: Removed import { initializeServices } from "./firebase.js";

console.log("main.jsx: Top-level loading...");

// CRITICAL FIX: The entire async startApp wrapper is no longer needed.
// The Supabase AuthProvider now handles the session loading state internally.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);