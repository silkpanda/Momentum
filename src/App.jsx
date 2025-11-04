// src/App.jsx (UPDATED)

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useProfile } from './context/ProfileContext';

// Views
import Login from './views/Login';
import SignUp from './views/SignUp';
import Dashboard from './views/Dashboard';
import HouseholdDashboard from './views/HouseholdDashboard';

// Components
import LoadingSpinner from './components/LoadingSpinner';

// --- THIS IS THE FIX ---
// Removed the import for './App.css' which was conflicting
// with Tailwind and our theme.css file.
// import './App.css'; 
// -----------------------


function AppLayout() {
  const { currentUser, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || (currentUser && profileLoading)) {
    console.log(
      `AppLayout: Loading... Auth: ${authLoading}, Profile: ${profileLoading}`
    );
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    console.log('AppLayout: No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('AppLayout: User logged in. Rendering main app.');
  
  // --- THIS IS A BUG-FIX from our previous session ---
  // If we have a user AND a profile, we render the app.
  // The Dashboard component will handle the "no household" modal.
  if (currentUser && profile) {
    return <Outlet />;
  }

  // This logic is from an old file, but it's a good safety net
  // if the profile is somehow missing but the user is logged in.
  // We'll keep it, but the logic above should be the primary path.
  console.log('AppLayout: User logged in but profile not found, rendering main app anyway.');
  return <Outlet />;
}

function LoggedOutRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
        <LoadingSpinner />
      </div>
    );
  }

  if (currentUser) {
    console.log('LoggedOutRoute: User is logged in, redirecting to /');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <Routes>
      {/* --- Protected Routes (Must be Logged IN) --- */}
      <Route element={<AppLayout />}>
        {/*
          This is the old route logic from the file you sent (21d2fa8...).
          It's incorrect because it tries to use HouseholdDashboard as a route.
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/household/:householdId"
            element={<HouseholdDashboard />}
          />
        */}
        
        {/* --- This is the CORRECT logic --- */}
        {/* The Dashboard view is the ONLY route. 
            It is responsible for showing either the 
            CreateOrJoinModal OR the HouseholdDashboard */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Catch-all for logged-in users, redirects to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* --- Public Routes (Must be Logged OUT) --- */}
      <Route element={<LoggedOutRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
    </Routes>
  );
}

export default App;