// src/views/HouseholdDashboard.jsx (REFACTORED: Now a controller)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// Modals
import EditProfileModal from '../components/EditProfileModal';

// Icons
import { Users, ShieldCheck } from 'lucide-react';

// --- View Components ---
import ParentView from './ParentView';
import FamilyView from './FamilyView';
// -----------------------

function HouseholdDashboard({ householdId }) {
  console.log('--- HouseholdDashboard component rendered ---');

  const { currentUser: user } = useAuth();

  // --- State ---
  const [household, setHousehold] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // View logic
  const [viewMode, setViewMode] = useState('family');
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProfileForEdit, setSelectedProfileForEdit] = useState(null);

  // Data Fetching
  const fetchHouseholdData = useCallback(async () => {
    if (!user || !householdId) {
      setIsLoading(false);
      if (!householdId) setError('Error: No Household ID found in props.');
      return;
    }

    if (!household) setIsLoading(true);
    setError('');

    try {
      // 1. Fetch household
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();
      if (householdError) throw householdError;
      if (!householdData) throw new Error('Household not found.');
      setHousehold(householdData);

      // 2. Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: true }); // Static order
      if (profilesError) throw profilesError;
      setProfiles(profilesData);

      // 3. Find user's profile
      const foundUserProfile = profilesData.find(
        (p) => p.auth_user_id === user.id
      );
      if (foundUserProfile) {
        if (!userProfile) {
          setUserProfile(foundUserProfile);
          if (foundUserProfile.is_admin) setViewMode('parent');
          else setViewMode('family');
        }

        // Select the user's own profile by default
        if (!selectedProfile) setSelectedProfile(foundUserProfile);
      } else {
        throw new Error(
          'Could not find your profile in this household. (User ID: ' +
            user.id +
            ')'
        );
      }
    } catch (err) {
      console.error('HouseholdDashboard: Failed to fetch data:', err);
      setError(`Error: Could not load household data. ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, householdId]); // Simplified dependencies

  useEffect(() => {
    fetchHouseholdData();
  }, [fetchHouseholdData]);

  // --- Modal Handlers ---
  const handleOpenEditModal = (profileToEdit) => {
    setSelectedProfileForEdit(profileToEdit);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsEditModalOpen(false);
    setSelectedProfileForEdit(null);
  };

  const handleProfileUpdate = (updatedProfile) => {
    console.log('Profile update received, updating state manually.');

    if (updatedProfile.deleted) {
      // Handle deletion
      setProfiles((currentProfiles) =>
        currentProfiles.filter((p) => p.id !== updatedProfile.id)
      );
      // If the deleted profile was selected, select the user's profile
      if (selectedProfile?.id === updatedProfile.id) {
        setSelectedProfile(userProfile);
      }
    } else {
      // Handle update
      // This .map() preserves the 'created_at' order from the state
      setProfiles((currentProfiles) =>
        currentProfiles.map((p) =>
          p.id === updatedProfile.id ? updatedProfile : p
        )
      );
      // If the updated profile is the one selected, update that state too
      if (selectedProfile?.id === updatedProfile.id) {
        setSelectedProfile(updatedProfile);
      }
      // Also update userProfile if they edited themselves
      if (userProfile?.id === updatedProfile.id) {
        setUserProfile(updatedProfile);
      }
    }
    handleCloseModals();
  };
  // --------------------------------------------------

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
  };

  const isAdmin = userProfile && userProfile.is_admin;

  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="p-8 text-text-primary">Loading household...</div>
    );
  }

  if (error) {
    return <div className="p-8 text-signal-error">{error.message}</div>;
  }

  if (!household || !userProfile || profiles.length === 0) {
    return (
      <div className="p-8 text-signal-warning">
        Could not load household data. (Household, UserProfile, or Profiles list
        is empty).
      </div>
    );
  }

  // --- Main Render ---
  return (
    <>
      <div className="w-full min-h-screen p-8 bg-bg-canvas text-text-primary">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mt-2">{household.name}</h1>
        </header>

        {/* --- View Mode Toggle (Admins Only) --- */}
        {isAdmin && (
          <div className="mb-8 p-2 bg-bg-surface-2 rounded-lg flex max-w-sm">
            <button
              onClick={() => setViewMode('parent')}
              className={`flex-1 p-2 rounded-md font-semibold flex items-center justify-center gap-2 transition-all
                ${
                  viewMode === 'parent'
                    ? 'bg-bg-canvas shadow-sm text-action-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <ShieldCheck size={18} /> Parent View
            </button>
            <button
              onClick={() => setViewMode('family')}
              className={`flex-1 p-2 rounded-md font-semibold flex items-center justify-center gap-2 transition-all
                ${
                  viewMode === 'family'
                    ? 'bg-bg-canvas shadow-sm text-action-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <Users size={18} /> Family View
            </button>
          </div>
        )}

        {/* --- Main Content Area --- */}
        {/* This is the new refactored logic.
          We render the grid layout here, and then pass the props
          to the correct view component.
        */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {viewMode === 'parent' && isAdmin ? (
            <ParentView
              householdId={householdId}
              profiles={profiles}
              userProfile={userProfile}
              onEditProfile={handleOpenEditModal}
            />
          ) : (
            <FamilyView
              householdId={householdId}
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelectProfile={handleSelectProfile}
              userProfile={userProfile}
            />
          )}
        </main>
      </div>

      {/* --- Modal --- */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={handleCloseModals}
          profile={selectedProfileForEdit}
          userProfile={userProfile} // Pass in the user's profile
          onProfileUpdated={handleProfileUpdate}
        />
      )}
    </>
  );
}

export default HouseholdDashboard;