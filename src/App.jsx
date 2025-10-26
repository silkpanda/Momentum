// /src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- Import our real views ---
import Dashboard from './views/Dashboard'; // <-- IMPORT THIS
import SignUp from './views/SignUp';
import Login from './views/Login';

// --- Placeholder Components ---
// const Dashboard = () => <h1>Dashboard (Protected)</h1>; // <-- DELETE THIS
// --- End Placeholders ---


// ... (ProtectedRoute function remains the same) ...
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}


function App() {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard /> {/* <-- This now uses our real component */}
        </ProtectedRoute>
      } />
      
      {/* ... (signup and login routes remain the same) ... */}
      <Route path="/signup" element={
        !currentUser ? <SignUp /> : <Navigate to="/" replace />
      } />
      
      <Route path="/login" element={
        !currentUser ? <Login /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
}

export default App;