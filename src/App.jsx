// src/App.jsx (Fixed)

import React from 'react';
// --- (1) REMOVE BrowserRouter from this import ---
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './views/Login';
import SignUp from './views/SignUp';
import Dashboard from './views/Dashboard';
import HouseholdDashboard from './views/HouseholdDashboard';

function App() {
  return (
    <AuthProvider>
      {/* --- (2) REMOVE <BrowserRouter> from here --- */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/household/:householdId"
          element={<ProtectedRoute><HouseholdDashboard /></ProtectedRoute>}
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {/* --- (3) REMOVE </BrowserRouter> from here --- */}
    </AuthProvider>
  );
}

// ... (ProtectedRoute component is the same)
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App;