// /src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// We'll create these three components next!
// import Dashboard from './views/Dashboard';
// import SignUp from './views/SignUp';
// import Login from './views/Login';

// --- Placeholder Components (so the app doesn't crash) ---
// We can delete these once we build the real files.
const Dashboard = () => <h1>Dashboard (Protected)</h1>;
const SignUp = () => <h1>Sign Up Page</h1>;
const Login = () => <h1>Login Page</h1>;
// --- End Placeholders ---


// This component checks if a user is logged in.
// If not, it redirects them to the /login page.
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    // User not authenticated
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
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/signup" element={
        // If user is *already* logged in, send them to dashboard
        !currentUser ? <SignUp /> : <Navigate to="/" replace />
      } />
      
      <Route path="/login" element={
        // If user is *already* logged in, send them to dashboard
        !currentUser ? <Login /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
}

export default App;