// src/main.jsx (Corrected with BrowserRouter)

import React from 'react';
import ReactDOM from 'react-dom/client';
// --- 1. Import BrowserRouter ---
import { BrowserRouter } from 'react-router-dom';
// --- END ---
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { initializeServices } from './firebase.js'; // Use the async initializer

console.log('main.jsx: Top-level loading...');

async function startApp() {
  console.log('main.jsx: Calling initializeServices() and awaiting...');
  try {
    // Await the initialization (now points to LIVE Firebase)
    await initializeServices();
    console.log('main.jsx: All LIVE services initialized. Rendering React app...');

    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        {/* --- 2. Wrap AuthProvider and App with BrowserRouter --- */}
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
        {/* --- END --- */}
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("main.jsx: CRITICAL - Failed to initialize Firebase. App cannot start.", error);
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: red;">
          <h1>Application Error</h1>
          <p>Could not connect to essential services. Please try again later.</p>
          <p><i>${error.message}</i></p>
        </div>
      `;
    }
  }
}

// Start the app
startApp();