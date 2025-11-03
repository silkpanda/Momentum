import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../supabaseClient'; // CORRECTED: Was 'import supabase from...'
import CreateOrJoinModal from '../components/CreateOrJoinModal';
import HouseholdDashboard from './HouseholdDashboard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { currentUser, signOut } = useAuth();
  
  // FIXED: Get profile data from context, not a new fetch
  const { profile, loading: profileLoading, error: profileError } = useProfile();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // This is the component's main loading logic.
  // We are already waiting for the profile in App.jsx,
  // but this is an extra check.
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
        <LoadingSpinner />
      </div>
    );
  }

  // This is the "no household" state.
  // If the profile is loaded AND it has no household_id, show the modal.
  if (profile && !profile.household_id) {
    // We pass setIsModalOpen to the modal so it can close itself on success.
    // We also pass the user object so it knows who to associate the new household with.
    return (
      <CreateOrJoinModal
        user={currentUser}
        onClose={() => setIsModalOpen(false)} // This prop might not be used, but good to have
        onHouseholdCreated={() => {
          // In a real app, we'd force a profile refresh here.
          // For now, we'll just reload the page.
          window.location.reload();
        }}
      />
    );
  }

  // This is the "has household" state.
  // If the profile is loaded AND it has a household_id, show the main dashboard.
  if (profile && profile.household_id) {
    return <HouseholdDashboard householdId={profile.household_id} />;
  }

  // This is the error state
  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 bg-bg-canvas">
        <h2 className="text-2xl">Error Loading Profile</h2>
        <p>{profileError.message}</p>
        <button
          onClick={signOut}
          className="px-4 py-2 mt-4 text-white rounded bg-brand-primary"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // This is a fallback "catch-all" loading state.
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
      <LoadingSpinner />
    </div>
  );
}