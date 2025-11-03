import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useProfile } from './context/ProfileContext';

// Views
import Login from './views/Login';
import SignUp from './views/SignUp';
import Dashboard from './views/Dashboard';

// Components
import LoadingSpinner from './components/LoadingSpinner';

/**
 * A layout component that handles the core loading and auth-checking logic.
 * This is the new "declarative" way to handle our routes.
 */
function AppLayout() {
  const { currentUser, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Show a full-screen spinner if auth is loading,
  // OR if auth is done, we have a user, but we are still loading their profile.
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

  // If auth is done and there's no user, redirect to login
  if (!currentUser) {
    console.log('AppLayout: No user, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // If we get here, user is logged in.
  // The Dashboard component itself will handle the logic for
  // (profile vs. no-profile) with its modal.
  console.log('AppLayout: User logged in. Rendering main app.');
  return <Outlet />;
}

/**
 * A component to handle routes that should *only* be visible when logged OUT
 * (like Login and SignUp)
 */
function LoggedOutRoute() {
  const { currentUser, loading } = useAuth();

  // Show spinner while we check auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
        <LoadingSpinner />
      </div>
    );
  }

  // If user *is* logged in, redirect them away from login page to the dashboard
  if (currentUser) {
    console.log('LoggedOutRoute: User is logged in, redirecting to /');
    return <Navigate to="/" replace />;
  }

  // If no user, show the child component (Login or SignUp)
  return <Outlet />;
}

function App() {
  return (
    <Routes>
      {/* --- Protected Routes (Must be Logged IN) --- */}
      {/* All logged-in routes are children of AppLayout */}
      <Route element={<AppLayout />}>
        {/* Dashboard is now the root.
          It will handle the logic for "no household" vs "has household"
        */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Catch-all for logged-in users, redirects to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* --- Public Routes (Must be Logged OUT) --- */}
      {/* Routes that can only be seen when logged out */}
      <Route element={<LoggedOutRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Route>
    </Routes>
  );
}

export default App;