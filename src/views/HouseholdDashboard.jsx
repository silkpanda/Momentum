// src/views/HouseholdDashboard.jsx (FIXED: Added Logout Button)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Corrected import path
import { supabase } from '../supabaseClient.js'; // Corrected import path

// Modals
import EditProfileModal from '../components/EditProfileModal.jsx';

// Icons
import { Users, ShieldCheck, LogOut } from 'lucide-react'; // Added LogOut icon

// --- View Components ---
import ParentView from './ParentView.jsx';
import FamilyView from './FamilyView.jsx';
// -----------------------

function HouseholdDashboard({ householdId }) {
  console.log('--- HouseholdDashboard component rendered ---');

  const { currentUser: user, logout } = useAuth(); // Get logout function

  // --- State ---
  const [household, setHousehold] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // --- NEW STATE for tasks ---
  const [tasks, setTasks] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState([]);
  // ---------------------------

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
        if (!selectedProfile) setSelectedProfile(foundUserProfile);
      } else {
        throw new Error(
          'Could not find your profile in this household. (User ID: ' +
            user.id +
            ')'
        );
      }

      // --- 4. NEW: Fetch tasks and assignments ---
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false }); // Show newest first
      if (tasksError) throw tasksError;
      setTasks(tasksData);

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('task_assignments')
        .select('*');
      // We can't filter by household_id directly, so we'll rely on RLS
      // or filter client-side if needed. RLS is better.
      if (assignmentsError) throw assignmentsError;
      setTaskAssignments(assignmentsData);
      // -----------------------------------------
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
    if (updatedProfile.deleted) {
      setProfiles((currentProfiles) =>
        currentProfiles.filter((p) => p.id !== updatedProfile.id)
      );
      if (selectedProfile?.id === updatedProfile.id) {
        setSelectedProfile(userProfile);
      }
    } else {
      setProfiles((currentProfiles) =>
        currentProfiles.map((p) =>
          p.id === updatedProfile.id ? updatedProfile : p
        )
      );
      if (selectedProfile?.id === updatedProfile.id) {
        setSelectedProfile(updatedProfile);
      }
      if (userProfile?.id === updatedProfile.id) {
        setUserProfile(updatedProfile);
      }
    }
    handleCloseModals();
  };

  // --- NEW: Optimistic update handler for tasks ---
  const handleTaskCreated = (newTask, newAssignments) => {
    console.log('Optimistically adding new task:', newTask);
    setTasks((currentTasks) => [newTask, ...currentTasks]);
    setTaskAssignments((currentAssignments) => [
      ...currentAssignments,
      ...newAssignments,
    ]);
  };
  // ----------------------------------------------

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
  };

  // --- NEW: Logout Handler ---
  const handleLogout = async () => {
    try {
      await logout();
      // The onAuthStateChange listener in App.jsx will handle redirecting
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  // -------------------------

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
        {/* --- THIS IS THE FIX --- */}
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-semibold mt-2">
            {household.name}
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-bg-surface-2 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>
        {/* ----------------------- */}

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
          {viewMode === 'parent' && isAdmin ? (
            <ParentView
              householdId={householdId}
              profiles={profiles}
              userProfile={userProfile}
              onEditProfile={handleOpenEditModal}
              tasks={tasks} // Pass tasks down
              taskAssignments={taskAssignments} // Pass assignments down
              onTaskCreated={handleTaskCreated} // Pass handler down
            />
          ) : (
            <FamilyView
              householdId={householdId}
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelectProfile={handleSelectProfile}
              userProfile={userProfile}
              tasks={tasks} // Pass tasks down
              taskAssignments={taskAssignments} // Pass assignments down
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
          userProfile={userProfile}
          onProfileUpdated={handleProfileUpdate}
        />
      )}
    </>
  );
}

export default HouseholdDashboard;