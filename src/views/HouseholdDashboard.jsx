// src/views/HouseholdDashboard.jsx (Final RLS Fix)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateManagedProfileModal from '../components/CreateManagedProfileModal'; 


function HouseholdDashboard() {
  const { householdId } = useParams();
  const [householdData, setHouseholdData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManagedProfileModal, setShowManagedProfileModal] = useState(false); 


  // Function to fetch all necessary data for the dashboard
  const fetchDashboardData = useCallback(async () => {
    setError(null);

    if (!householdId) {
      setError("Error: No Household ID provided in URL.");
      return;
    }

    console.log(`[STUB] Fetching data for household ID: ${householdId} via Supabase...`);

    try {
      // --- DEBUG LOG 1 ---
      console.log('DEBUG LOG 1: Attempting to fetch Household Name via RPC.'); 

      // 1. CRITICAL FIX: Fetch Household Name using RLS-bypassing RPC
      const { data: houseName, error: houseError } = await supabase.rpc('get_household_name_by_id', { h_id: householdId });

      if (houseError) throw houseError;
      setHouseholdData({ household_name: houseName });
      
      // --- DEBUG LOG 2 ---
      console.log('DEBUG LOG 2: Household Name fetched successfully. Attempting to fetch Profiles via RPC.');

      // 2. Fetch Profiles using the RLS-bypassing RPC (Already fixed in previous step)
      const { data: profilesData, error: profilesError } = await supabase.rpc('get_household_profiles', { h_id: householdId });

      if (profilesError) throw profilesError;
      setProfiles(profilesData);
      
      // --- DEBUG LOG 3 ---
      console.log('DEBUG LOG 3: Profiles list fetched successfully. Dashboard is ready.');
      
    } catch (err) {
      console.error('Household Data Fetch Failed:', err);
      setError('Failed to load household data. The final RLS policy is still blocking the request.');
      setHouseholdData(null);
      setProfiles([]);
    }
  }, [householdId]);


  useEffect(() => {
    if (!householdId) return;

    setLoading(true);

    // Initial Data Fetch
    fetchDashboardData().finally(() => setLoading(false));

    // Realtime Subscription Setup (WebSockets)
    const channel = supabase.channel(`profiles_household_${householdId}`)
      .on('postgres_changes', 
          { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'profiles', 
              filter: `household_id=eq.${householdId}` 
          }, 
          (payload) => {
              console.log('Realtime Update Received (New Profile):', payload);
              fetchDashboardData(); 
          }
      )
      .subscribe(); 

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, fetchDashboardData]); 

  const handleProfileAdded = useCallback(() => {
    fetchDashboardData(); 
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner text="Loading your family dashboard..." />;
  }

  if (error) {
    return <div className="p-8 text-center text-text-primary bg-bg-canvas min-h-screen">Error: {error}</div>;
  }

  // Placeholder UI for the dashboard
  return (
    <div className="p-8 bg-bg-canvas min-h-screen">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {householdData?.household_name || 'Your Household'} Dashboard
      </h1>

      {/* Profile Management Section */}
      <div className="bg-bg-surface p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Family Profiles ({profiles.length})</h2>
        
        {/* Profiles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {profiles.length > 0 ? (
            profiles.map(profile => (
              <div 
                key={profile.id} 
                className={`p-4 rounded-md shadow-sm border border-border-primary ${
                  profile.is_admin ? 'bg-bg-muted' : '' 
                }`}
                style={{ 
                    backgroundColor: profile.is_admin ? undefined : `var(--color-${profile.profile_color})`
                }}
              >
                <p className={`font-medium text-lg ${profile.is_admin ? 'text-text-primary' : 'text-text-inverted'}`}>
                    {profile.display_name}
                </p>
                <p className={`text-sm ${profile.is_admin ? 'text-text-secondary' : 'text-text-inverted'}`}>
                    {profile.is_admin ? 'Admin (You)' : 'Managed User'}
                </p>
                <p className={`text-xs mt-2 ${profile.is_admin ? 'text-text-primary' : 'text-text-inverted'}`}>
                    Points: {profile.points}
                </p>
              </div>
            ))
          ) : (
            <p className="text-text-secondary">No profiles found yet. Let's add some!</p>
          )}
        </div>

        {/* Button to open the managed profile modal */}
        <button
          onClick={() => setShowManagedProfileModal(true)}
          className="py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover transition duration-150"
        >
          + Add New Family Member
        </button>
      </div>

      {/* Tasks and Rewards Sections (Stubs) */}
      <div className="space-y-8">
        <div className="bg-bg-surface p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary">Tasks (In Progress)</h2>
          <p className="text-text-secondary mt-2">Task creation and management UI goes here.</p>
        </div>
        <div className="bg-bg-surface p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary">Rewards Store (To Do)</h2>
          <p className="text-text-secondary mt-2">Store item creation and point redemption goes here.</p>
        </div>
      </div>
      
      {/* Managed Profile Modal Integration */}
      <CreateManagedProfileModal
        isOpen={showManagedProfileModal}
        onClose={() => setShowManagedProfileModal(false)}
        householdId={householdId}
        onProfileAdded={handleProfileAdded}
      />

    </div>
  );
}

export default HouseholdDashboard;