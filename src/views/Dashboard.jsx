// src/views/Dashboard.jsx (FIXED: Correct logic for null profile)

import { useProfile } from '../context/ProfileContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import HouseholdDashboard from './HouseholdDashboard.jsx';
import CreateOrJoinModal from '../components/CreateOrJoinModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function Dashboard() {
  // We MUST get all three values from the context
  const { profile, loading, fetchProfile } = useProfile();
  const { currentUser } = useAuth();

  // 1. Wait for the profile to be fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
        <LoadingSpinner />
      </div>
    );
  }

  // 2. Once loading is false, check the profile.
  // This is the simple, correct logic.
  return profile ? (
    // If profile exists, user has a household. Show the dashboard.
    <HouseholdDashboard householdId={profile.household_id} />
  ) : (
    // If profile is null, user is new. Show the modal.
    <CreateOrJoinModal
      user={currentUser}
      onSuccess={() => fetchProfile(currentUser)}
    />
  );
}