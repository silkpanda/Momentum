// src/views/HouseholdDashboard.jsx (FINAL PRODUCTION-READY VERSION with Full Admin Edit Control)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; 
import LoadingSpinner from '../components/LoadingSpinner';
import CreateManagedProfileModal from '../components/CreateManagedProfileModal'; 
import InviteMemberModal from '../components/InviteMemberModal'; 
import UpdateProfileModal from '../components/UpdateProfileModal'; 
import EditManagedProfileModal from '../components/EditManagedProfileModal'; // CRITICAL: Import for managed edits


function HouseholdDashboard() {
  const { householdId } = useParams();
  const { currentUser } = useAuth(); 
  
  const [householdData, setHouseholdData] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showManagedProfileModal, setShowManagedProfileModal] = useState(false); 
  const [showInviteModal, setShowInviteModal] = useState(false); 
  const [notification, setNotification] = useState(null); 
  
  // State for generating and displaying the invite code
  const [inviteCode, setInviteCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  
  // State for the Edit Profile Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState(false); 
  const [profileToEdit, setProfileToEdit] = useState(null); // NEW: Tracks which profile is being edited


  // Function to fetch all necessary data for the dashboard
  const fetchDashboardData = useCallback(async () => {
    setError(null);

    if (!householdId) {
      setError("Error: No Household ID provided in URL.");
      return;
    }

    try {
      // 1. Fetch Household Name (RPC)
      const { data: houseName, error: houseError } = await supabase.rpc('get_household_name_by_id', { h_id: householdId });

      if (houseError) throw houseError;
      setHouseholdData({ household_name: houseName });
      
      // 2. Fetch Profiles (RPC)
      const { data: profilesData, error: profilesError } = await supabase.rpc('get_household_profiles', { h_id: householdId });

      if (profilesError) throw profilesError;
      setProfiles(profilesData);
      
    } catch (err) {
      console.error('Household Data Fetch Failed:', err);
      setError('Failed to load household data. Check network or final RLS policy.');
      setHouseholdData(null);
      setProfiles([]);
    }
  }, [householdId]);


  // HANDLER: Calls the RPC to generate the invite code
  const handleGenerateCode = async () => {
      setCodeLoading(true);
      setInviteCode(null);
      
      try {
          const { data: newCode, error: rpcError } = await supabase.rpc('create_invite_code');

          if (rpcError) throw rpcError;

          setInviteCode(newCode);
          setNotification(`New invite code generated: ${newCode}. It expires in 7 days.`);
          setTimeout(() => setNotification(null), 7000); 

      } catch (err) {
          console.error('Code Generation Failed:', err);
          setNotification('Error generating code. Are you the Admin of this household?');
          setTimeout(() => setNotification(null), 5000); 
      } finally {
          setCodeLoading(false);
      }
  };


  // HANDLER: For deleting a profile (Hard Delete)
  const handleDeleteProfile = async (profileId, displayName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the profile for ${displayName}? This action cannot be undone.`)) {
        return;
    }

    try {
        setLoading(true);
        const { error: rpcError } = await supabase.rpc('delete_user_and_profile', { target_profile_id: profileId });

        if (rpcError) throw rpcError;

        setNotification(`Successfully deleted ${displayName}.`);
        setTimeout(() => setNotification(null), 5000); 

        // Re-fetch data to update the list
        fetchDashboardData(); 

    } catch (err) {
        console.error('Delete Failed:', err);
        setNotification(`Error deleting ${displayName}: ${err.message}`);
        setTimeout(() => setNotification(null), 7000); 
    } finally {
        setLoading(false);
    }
  };

  // HANDLER: Routes the Edit action to the correct modal
  const handleEditProfile = (profile) => {
      // 1. If the profile belongs to the current user, show the self-edit modal
      if (profile.auth_user_id === currentUser?.id) {
          setShowEditProfileModal(true); // Opens the UpdateProfileModal
      } else {
          // 2. If it's another profile (managed or co-admin), set the target profile
          setProfileToEdit(profile); // This opens the EditManagedProfileModal
      }
  };


  // HANDLER: After any profile update modal closes
  const handleProfileUpdated = useCallback((message) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 5000); 
      fetchDashboardData(); // CRUCIAL: Re-fetch data to show the updated name/color
      setShowEditProfileModal(false); // Close self-edit modal
      setProfileToEdit(null); // Close managed-edit modal
  }, [fetchDashboardData]);


  useEffect(() => {
    if (!householdId) return;

    setLoading(true);

    fetchDashboardData().finally(() => setLoading(false));

    // CRITICAL: Realtime Subscription Setup (The primary, clean mechanism)
    const channel = supabase.channel(`profiles_household_${householdId}`)
      .on('postgres_changes', 
          { 
              event: 'INSERT|UPDATE', 
              schema: 'public', 
              table: 'profiles', 
              filter: `household_id=eq.${householdId}` 
          }, 
          (payload) => {
              if (payload.new?.household_id === householdId || payload.old?.household_id === householdId) {
                  console.log('Realtime Update Received (Confirmed Relevant).');
                  fetchDashboardData(); 
              }
          }
      )
      .subscribe(); 

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, fetchDashboardData]); 

  // Handlers for modals
  const handleProfileAdded = useCallback(() => { fetchDashboardData(); }, [fetchDashboardData]);
  const handleInviteSuccess = useCallback((message) => {
      setNotification(message);
      setTimeout(() => setNotification(null), 5000); 
      fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner text="Loading your family dashboard..." />;
  }

  if (error) {
    return <div className="p-8 text-center text-text-primary bg-bg-canvas min-h-screen">Error: {error}</div>;
  }

  // Helper to get current user's Auth ID securely
  const currentAuthUserId = currentUser?.id;

  // Placeholder UI for the dashboard
  return (
    <div className="p-8 bg-bg-canvas min-h-screen">
      
      {/* Notification Bar */}
      {notification && (
          <div className={`p-4 mb-4 text-sm font-medium text-text-on-action ${notification.startsWith('Error') ? 'bg-signal-danger' : 'bg-signal-success'} rounded-md shadow-lg`}>
              {notification}
          </div>
      )}

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {householdData?.household_name || 'Your Household'} Dashboard
      </h1>

      {/* Profile Management Section */}
      <div className="bg-bg-surface p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Family Profiles ({profiles.length})</h2>
        
        {/* --- PROFILES LIST RENDERING --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                    {profile.is_admin ? (profile.auth_user_id === currentAuthUserId ? 'Admin (You)' : 'Co-Admin') : 'Managed User'}
                </p>
                <p className={`text-xs mt-2 ${profile.is_admin ? 'text-text-primary' : 'text-text-inverted'}`}>
                    Points: {profile.points}
                </p>

                {/* NEW: EDIT/DELETE BUTTONS */}
                <div className="flex justify-between items-center mt-3">
                    {/* EDIT BUTTON (Visible for ALL profiles, handled by the handler) */}
                    <button
                        onClick={() => handleEditProfile(profile)}
                        className="text-xs text-gray-900 hover:text-action-primary hover:underline font-medium"
                    >
                        Edit Profile
                    </button>

                    {/* DELETE BUTTON (Visible only if NOT the current logged-in user) */}
                    {profile.auth_user_id !== currentAuthUserId && (
                        <button
                            onClick={() => handleDeleteProfile(profile.id, profile.display_name)}
                            className="text-xs text-signal-danger hover:underline font-medium"
                        >
                            Hard Delete
                        </button>
                    )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-text-secondary">No profiles found yet. Let's add some!</p>
          )}
        </div>
        {/* --- END PROFILES LIST --- */}


        {/* Action Buttons */}
        <div className="flex flex-wrap items-center space-x-4">
            {/* 1. Add Managed Member Button */}
            <button
              onClick={() => setShowManagedProfileModal(true)}
              className="py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover transition duration-150 mb-2 md:mb-0"
            >
              + Add New Family Member
            </button>
            
            {/* 2. GENERATE CODE Button */}
            <button
              onClick={handleGenerateCode}
              disabled={codeLoading}
              className="py-2 px-4 bg-bg-muted text-text-primary font-semibold rounded-md border border-border-primary hover:bg-palette-gray-100 transition duration-150 mb-2 md:mb-0"
            >
              {codeLoading ? 'Generating...' : 'Generate Invite Code'}
            </button>
            
            {/* 3. CODE DISPLAY */}
            {inviteCode && (
                <div className="text-lg font-bold text-text-primary bg-bg-muted p-2 rounded-md border border-border-primary ml-4 transition-all duration-300 ease-in-out">
                    Code: <span className="text-action-primary tracking-widest">{inviteCode}</span>
                </div>
            )}
        </div>
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
      
      {/* Modals */}
      <CreateManagedProfileModal
        isOpen={showManagedProfileModal}
        onClose={() => setShowManagedProfileModal(false)}
        onProfileAdded={handleProfileAdded}
      />
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={handleInviteSuccess}
      />
      {/* MODAL: Edit Your Own Profile */}
      <UpdateProfileModal
        isOpen={showEditProfileModal && !profileToEdit}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={handleProfileUpdated}
      />
      {/* NEW MODAL: Edit Other Profile (Managed/Co-Admin) */}
      <EditManagedProfileModal
        isOpen={!!profileToEdit}
        onClose={() => setProfileToEdit(null)}
        targetProfile={profileToEdit}
        onProfileUpdated={handleProfileUpdated}
      />

    </div>
  );
}

export default HouseholdDashboard;