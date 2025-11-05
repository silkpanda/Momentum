// src/App.jsx (FIXED: Simplified layout logic)

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
// --- THIS IS THE FIX (Part 1) ---
// We no longer need useProfile here.
// import { useProfile } from './context/ProfileContext';

// Views
import Login from './views/Login.jsx';
import SignUp from './views/SignUp.jsx';
import Dashboard from './views/Dashboard.jsx';
// We removed HouseholdDashboard from routes, Dashboard handles it
// import HouseholdDashboard from './views/HouseholdDashboard';

// Components
import LoadingSpinner from './components/LoadingSpinner.jsx';

// ------------------------------------

function AppLayout() {
  const { currentUser, loading: authLoading } = useAuth();
  // --- THIS IS THE FIX (Part 2) ---
  // All profile logic is removed from this component.
  // AppLayout's ONLY job is to handle AUTH.
  // The Dashboard component will handle profile state.
  // const { profile, loading: profileLoading } = useProfile();

  if (authLoading) {
    // We only care if auth is loading.
    console.log(`AppLayout: Auth Loading...`);
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

  // If we have a user, we render the app.
  // The Dashboard component will decide what to show based on profile.
  console.log('AppLayout: User logged in. Rendering main app.');
  return <Outlet />;

  // --- THIS IS THE FIX (Part 3) ---
  // All the old, confusing logic is gone.
  // if (authLoading || (currentUser && profileLoading)) {
  //   console.log(
  //     `AppLayout: Loading... Auth: ${authLoading}, Profile: ${profileLoading}`
  //   );
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
  //       <LoadingSpinner />
  //     </div>
  //   );
  // }
  //
  // if (!currentUser) {
  //   console.log('AppLayout: No user, redirecting to /login');
  //   return <Navigate to="/login" replace />;
  // }
  //
  // console.log('AppLayout: User logged in. Rendering main app.');
  //
  // if (currentUser && profile) {
  //   return <Outlet />;
  // }
  //
  // console.log('AppLayout: User logged in but profile not found, rendering main app anyway.');
  // return <Outlet />;
  // ------------------------------------
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
          The Dashboard view is the ONLY route. 
          It is responsible for showing either the 
          CreateOrJoinModal OR the HouseholdDashboard
        */}
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