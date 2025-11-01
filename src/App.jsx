// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext'; 
import Login from './views/Login';
import SignUp from './views/SignUp';
import Dashboard from './views/Dashboard'; 
import HouseholdDashboard from './views/HouseholdDashboard';
import LoadingSpinner from './components/LoadingSpinner';


// --- HOUSEHOLD CONTEXT WRAPPER COMPONENT ---
const HouseholdContextWrapper = ({ children }) => {
    // FIX: Check for 'currentUser' and 'loading', not 'isAuthenticated'
    const { currentUser, loading } = useAuth(); 
    
    if (loading) {
        return <LoadingSpinner text="Authenticating..." />;
    }
    
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    
    // All routes that require household data and profile context should be
    // wrapped in the ProfileProvider.
    return (
        <ProfileProvider>
            {children}
        </ProfileProvider>
    );
};
// --- END CONTEXT WRAPPER ---


// --- PRIVATE ROUTE COMPONENT (Standard for secured routes) ---
const PrivateRoute = ({ children }) => {
    // FIX: Check for 'currentUser' and 'loading', not 'isAuthenticated'
    const { currentUser, loading } = useAuth(); 
    
    if (loading) {
        return <LoadingSpinner text="Authenticating..." />;
    }
    
    // CORE FIX: Use currentUser object to determine authentication status
    return currentUser ? children : <Navigate to="/login" replace />;
};
// --- END PRIVATE ROUTE ---


function App() {
  return (
    // AuthProvider is the outermost layer, handling authentication state
    <AuthProvider>
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Private Routes */}
            <Route 
                path="/dashboard" 
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } 
            />
            
            {/* Household Dashboard Route (Requires the new ProfileContext) */}
            <Route 
                path="/household/:householdId" 
                element={
                    <HouseholdContextWrapper> 
                        <HouseholdDashboard />
                    </HouseholdContextWrapper>
                } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<p>404: Not Found</p>} />
        </Routes>
    </AuthProvider>
  );
}

export default App;