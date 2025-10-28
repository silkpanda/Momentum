// src/main.jsx (Updated to be async)

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import './styles/theme.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { initializeServices } from './firebase.js' // --- 1. IMPORT ---

console.log('main.jsx: Top-level loading...');

// --- 2. CREATE AN ASYNC FUNCTION TO START THE APP ---
async function startApp() {
  try {
    console.log('main.jsx: Calling initializeServices() and awaiting...');
    
    // --- 3. THIS IS THE FIX ---
    await initializeServices(); // This will PAUSE until the firebase.js ping is done
    
    console.log('main.jsx: All services initialized. Rendering React app...');

    // --- 4. RENDER THE APP *AFTER* THE AWAIT ---
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    console.error("main.jsx: Fatal error initializing app:", error);
    document.getElementById('root').innerHTML = 'Error initializing app. Please refresh.';
  }
}

// --- 5. CALL THE ASYNC FUNCTION ---
startApp();