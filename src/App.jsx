// src/App.jsx (FIXED: Uses 'user' instead of 'currentUser')

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Views
import Login from './views/Login';
import SignUp from './views/SignUp';
import Dashboard from './views/Dashboard';
import HouseholdDashboard from './views/HouseholdDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// This is the main protected route component
function ProtectedRoute({ children }) {
  // 🛠️ FIX: Changed 'currentUser' to 'user' to match the AuthContext
  const { user, loading } = useAuth();

  if (loading) {
    // Show a top-level spinner while auth is loading
    return <LoadingSpinner />;
  }

  // 🛠️ FIX: Changed 'currentUser' to 'user'
  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render the protected component
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/household/:householdId" 
          element={
            <ProtectedRoute>
              <HouseholdDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;