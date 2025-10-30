// src/views/Dashboard.jsx (REFACTORED for SUPABASE)

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// IMPORT FIX: Import the Supabase client
import { supabase } from '../supabaseClient'; 

import CreateHouseholdModal from '../components/CreateHouseholdModal';
import LoadingSpinner from '../components/LoadingSpinner'; 

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State to track loading and whether to show the modal
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Function to fetch the user's profile data
  const checkUserProfile = useCallback(async (authId) => {
    setLoading(true);
    
    // Supabase Query: Select the profile linked to the current auth_user_id
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('creation_household_id') // We only need this field for the redirect check
      .eq('auth_user_id', authId) // Match the profile by the secure Supabase Auth UID
      .single(); // Expect a single row

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned' (i.e., new user)
      console.error('Error fetching profile:', error.message);
      // For production, you might set an error state here
    }

    if (profile && profile.creation_household_id) {
      // SUCCESS: Profile exists and has a householdId. Navigate directly.
      console.log("Dashboard: Household found on profile. Redirecting to:", profile.creation_household_id);
      navigate(`/household/${profile.creation_household_id}`);
    } else {
      // FAIL: No profile found, or no household linked. Prompt for creation.
      console.log("Dashboard: No household found. Showing Create Household Modal.");
      setShowModal(true);
    }

    setLoading(false);
  }, [navigate]);


  useEffect(() => {
    if (!currentUser) {
      // Safety check: should be handled by router
      navigate('/login');
      return;
    }
    
    // CRITICAL: We use the secure Supabase Auth UID for the lookup.
    checkUserProfile(currentUser.id);
    
    // Note: No cleanup needed, as this is a one-time async read, not a listener.

  }, [currentUser, navigate, checkUserProfile]); // Dependency array includes the stable currentUser and checkUserProfile

  // --- RENDERING LOGIC ---
  if (loading) {
    return <LoadingSpinner text="Checking Profile Status..." />;
  }
  
  // Only render the modal if we've stopped loading AND determined we need a household
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-canvas">
      <CreateHouseholdModal 
        isOpen={showModal} 
        // We close the modal and re-run the checkUserProfile logic after creation
        onClose={() => setShowModal(false)} 
        onHouseholdCreated={(householdId) => {
          setShowModal(false);
          // Instead of immediate navigate, we re-run the check to confirm the profile update
          // This is a robust pattern for Supabase
          checkUserProfile(currentUser.id);
        }}
      />
      {/* Fallback text if something unexpected happens */}
      {!showModal && (
        <p className="text-text-primary">Ready to begin? Something went wrong with the initial check. Please try refreshing.</p>
      )}
    </div>
  );
}

export default Dashboard;