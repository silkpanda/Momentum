// src/views/HouseholdDashboard.jsx (FIXED: Moved Edit Profile to Parent View)

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import InviteMemberForm from '../components/InviteMemberForm';

// Modals
import UpdateProfileModal from '../components/UpdateProfileModal';
import EditManagedProfileModal from '../components/EditManagedProfileModal';

// Icons
import { CirclePlus, Users, ShieldCheck, LayoutGrid, Pencil } from 'lucide-react';

// --- Placeholders for new components we'll build next ---
const CreateTaskForm = ({ householdId, profiles, creatorProfile }) => (
  <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">Create New Task</h3>
    <p className="text-text-secondary">
      (Task Creation Form placeholder. We'll build this next! It will allow
      assigning tasks to one or more profiles.)
    </p>
  </div>
);

// --- THIS IS THE FIX (Step 1: Simplify ProfileSelector) ---
// We remove all "Edit" logic from this component.
const ProfileSelector = ({
  profiles,
  selectedProfile,
  onSelectProfile,
  userProfile,
}) => {
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.id === userProfile.id) return -1;
    if (b.id === userProfile.id) return 1;
    if (a.is_admin && !b.is_admin) return -1;
    if (!a.is_admin && b.is_admin) return 1;
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <h3 className="w-full text-lg font-semibold text-text-primary">
        Who is completing tasks?
      </h3>
      {sortedProfiles.map((profile) => (
        // Button is now the top-level element again. No more 'relative' div.
        <button
          key={profile.id}
          onClick={() => onSelectProfile(profile)}
          className={`flex flex-col items-center justify-center p-4 rounded-lg w-28 h-32 transition-all duration-150
            ${
              selectedProfile && selectedProfile.id === profile.id
                ? 'bg-action-primary text-text-on-primary shadow-lg ring-2 ring-action-primary-hover'
                : 'bg-bg-surface-2 hover:bg-bg-surface-hover'
            }`}
        >
          <span className="text-4xl mb-2">{profile.avatar_emoji || '👤'}</span>
          <span className="font-medium text-sm truncate">
            {profile.display_name}
          </span>
          {profile.is_admin ? (
            <span className="text-xs text-text-secondary mt-1">(Parent)</span>
          ) : (
            <span className="text-xs text-text-secondary mt-1">(Child)</span>
          )}
        </button>
        // Edit button has been removed from here
      ))}
    </div>
  );
};
// --- END FIX ---

// --- THIS IS THE FIX (Step 2: Create new component for Parent View) ---
const ManageProfilesList = ({ profiles, onEditProfile }) => {
  return (
    <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">
        Manage Profiles
      </h3>
      <div className="space-y-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{profile.avatar_emoji || '👤'}</span>
              <div>
                <span className="font-medium text-text-primary">
                  {profile.display_name}
                </span>
                <span className="block text-xs text-text-secondary">
                  {profile.is_admin ? 'Parent' : 'Child'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onEditProfile(profile)}
              className="p-2 text-text-secondary rounded-md hover:bg-bg-surface-hover hover:text-action-primary"
              aria-label={`Edit ${profile.display_name}`}
            >
              <Pencil size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
// --- END FIX ---

const TaskList = ({ householdId, selectedProfile }) => (
  <div className="mt-6">
    <h3 className="text-xl font-semibold mb-4 text-text-primary">
      Tasks for {selectedProfile.display_name}
    </h3>
    <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
      <p className="text-text-secondary">
        (Task List placeholder for {selectedProfile.display_name}. We'll build
        this next! It will show all 'pending' tasks.)
      </p>
    </div>
  </div>
);
// --------------------------------------------------------

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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEditManagedModalOpen, setIsEditManagedModalOpen] = useState(false);
  const [selectedProfileForEdit, setSelectedProfileForEdit] = useState(null);

  // Data Fetching
  const fetchHouseholdData = useCallback(async () => {
    if (!user || !householdId) {
      console.log('HouseholdDashboard: Checks failed (no user or householdId).');
      setIsLoading(false);
      if (!householdId) setError('Error: No Household ID found in props.');
      return;
    }
    
    console.log('HouseholdDashboard: Setting loading and fetching...');
    // Only set loading to true on the *first* fetch
    // Subsequent refreshes (after edits) will be in the background
    if (!household) setIsLoading(true);
    setError('');

    try {
      // 1. Fetch the household details
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();

      if (householdError) throw householdError;
      if (!householdData) throw new Error('Household not found.');
      setHousehold(householdData);

      // 2. Fetch all profiles associated with this household
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', householdId);

      if (profilesError) throw profilesError;
      setProfiles(profilesData);

      // 3. Find the logged-in user's specific profile
      const foundUserProfile = profilesData.find(
        (p) => p.auth_user_id === user.id
      );

      if (foundUserProfile) {
        setUserProfile(foundUserProfile);
        if (foundUserProfile.is_admin) {
          setViewMode('parent');
        } else {
          setViewMode('family');
        }
        if (!selectedProfile) {
          setSelectedProfile(foundUserProfile);
        }
      } else {
        throw new Error(
          'Could not find your profile in this household. (User ID: ' +
            user.id +
            ')'
        );
      }
      console.log('HouseholdDashboard: Fetch complete.');
    } catch (err) {
      console.error('HouseholdDashboard: Failed to fetch data:', err);
      setError(`Error: Could not load household data. ${err.message}`);
    } finally {
      console.log('HouseholdDashboard: Fetch finished. Setting loading to false.');
      setIsLoading(false);
    }
  }, [user, householdId, selectedProfile]); // Note: selectedProfile dependency is correct

  useEffect(() => {
    console.log('HouseholdDashboard: useEffect triggered.');
    fetchHouseholdData();
  }, [fetchHouseholdData]);
  

  // --- Modal Handlers (No changes needed here) ---
  const handleOpenEditModal = (profileToEdit) => {
    console.log('Opening edit modal for:', profileToEdit.display_name);
    setSelectedProfileForEdit(profileToEdit);
    
    if (profileToEdit.id === userProfile.id) {
      setIsUpdateModalOpen(true);
    } else {
      setIsEditManagedModalOpen(true);
    }
  };

  const handleCloseModals = () => {
    setIsUpdateModalOpen(false);
    setIsEditManagedModalOpen(false);
    setSelectedProfileForEdit(null);
  };
  
  const handleProfileUpdate = () => {
    console.log('Profile updated, refreshing household data...');
    handleCloseModals();
    fetchHouseholdData(); // Re-fetch all data
  };
  // --------------------------------------------------


  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
  };

  const isAdmin = userProfile && userProfile.is_admin;

  // --- Render Logic ---

  if (isLoading) {
    return <div className="p-8">Loading household...</div>;
  }

  if (error) {
    return <div className="p-8 text-signal-error">{error.message}</div>;
  }

  if (!household || !userProfile) {
    return (
      <div className="p-8 text-signal-warning">
        Could not load household data. (Household or UserProfile is null).
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
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- Parent View --- */}
          {viewMode === 'parent' && isAdmin && (
            <>
              {/* Left Column (Admin Actions) */}
              <div className="lg:col-span-2 space-y-8">
                <CreateTaskForm
                  householdId={householdId}
                  profiles={profiles}
                  creatorProfile={userProfile}
                />
                
                <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 text-text-primary">All Household Tasks</h3>
                  <p className="text-text-secondary">(Admin Task List placeholder: We'll add a view here to see/edit/approve all tasks.)</p>
                </div>
              </div>

              {/* Right Column (Admin Tools) */}
              <div className="lg:col-span-1 space-y-8">
                <InviteMemberForm householdId={householdId} />
                
                {/* --- THIS IS THE FIX (Step 3: Add new list to Parent View) --- */}
                <ManageProfilesList
                  profiles={profiles}
                  onEditProfile={handleOpenEditModal}
                />
                {/* ------------------------------------------------------------- */}
              </div>
            </>
          )}

          {/* --- Family View --- */}
          {viewMode === 'family' && (
            <div className="lg-col-span-3">
              {/* --- THIS IS THE FIX (Step 4: Remove props from this call) --- */}
              <ProfileSelector
                profiles={profiles}
                selectedProfile={selectedProfile}
                onSelectProfile={handleSelectProfile}
                userProfile={userProfile}
              />
              {/* ------------------------------------------------------------- */}

              {selectedProfile ? (
                <TaskList
                  householdId={householdId}
                  selectedProfile={selectedProfile}
                />
              ) : (
                <div className="p-6 bg-bg-surface-2 rounded-lg text-text-secondary">
                  Please select a profile to view tasks.
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      {/* --- Modals (No change needed) --- */}
      {isUpdateModalOpen && (
        <UpdateProfileModal
          isOpen={isUpdateModalOpen}
          onClose={handleCloseModals}
          profile={selectedProfileForEdit}
          onProfileUpdated={handleProfileUpdate}
        />
      )}
      
      {isEditManagedModalOpen && (
        <EditManagedProfileModal
          isOpen={isEditManagedModalOpen}
          onClose={handleCloseModals}
          profile={selectedProfileForEdit}
          onProfileUpdated={handleProfileUpdate}
        />
      )}
    </>
  );
}

export default HouseholdDashboard;