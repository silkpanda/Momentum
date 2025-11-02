// src/views/HouseholdDashboard.jsx (MODIFIED - FINAL STABILITY FIX WITH LOGGING)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; 
import { useProfile } from '../context/ProfileContext'; 
import LoadingSpinner from '../components/LoadingSpinner';
import CreateManagedProfileModal from '../components/CreateManagedProfileModal'; 
import InviteMemberModal from '../components/InviteMemberModal'; 
import UpdateProfileModal from '../components/UpdateProfileModal'; 
import EditManagedProfileModal from '../components/EditManagedProfileModal'; 
import ProfileListItem from '../components/ProfileListItem'; 
import NotificationBanner from '../components/NotificationBanner'; 
import CreateTaskModal from '../components/CreateTaskModal'; 
import TaskListItem from '../components/TaskListItem'; 


function HouseholdDashboard() {
  const { householdId } = useParams();
  const { currentUser } = useAuth(); 
  
  const { 
    profiles, 
    activeProfileId, 
    activeProfileData, 
    isImpersonating, 
    switchProfile, 
    isLoading: isProfileContextLoading,
  } = useProfile();
  
  const [householdData, setHouseholdData] = useState(null);
  const [tasks, setTasks] = useState([]); 
  const [loading, setLoading] = useState(true); // Loading state for Household Name/Tasks
  const [error, setError] = useState(null);
  const [showManagedProfileModal, setShowManagedProfileModal] = useState(false); 
  const [showInviteModal, setShowInviteModal] = useState(false); 
  const [notification, setNotification] = useState(null); 
  
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false); 
  
  const [inviteCode, setInviteCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  
  const [showEditProfileModal, setShowEditProfileModal] = useState(false); 
  const [profileToEdit, setProfileToEdit] = useState(null); 
  
  // CRITICAL FIX: Ref to ensure the initial fetch only happens ONCE per component mount/remount.
  const fetchInitiatedRef = useRef(false);


  // --- Task Fetcher function (Stable) ---
  const fetchTasks = useCallback(async () => {
    console.log('AXIOM LOG: [Dashboard] fetchTasks CALLED.');
    try {
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('household_id', householdId) 
            .in('status', ['pending', 'completed']) 
            .order('created_at', { ascending: false }); 

        if (tasksError) throw tasksError;
        setTasks(tasksData); 
    } catch (err) {
        console.error('AXIOM ERROR: Task fetch failed:', err);
    }
    console.log('AXIOM LOG: [Dashboard] fetchTasks RETURNED.');
  }, [householdId]);


  // Function to fetch all necessary *NON-PROFILE* data for the dashboard 
  const fetchDashboardData = useCallback(async () => {
    console.log('AXIOM LOG: [Dashboard] fetchDashboardData CALLED.');
    setError(null);

    if (!householdId) {
        setError("Error: No Household ID provided in URL.");
        console.log('AXIOM LOG: [Dashboard] fetchDashboardData EXIT: Missing ID.');
        return;
    }

    try {
      // 1. Fetch Household Name (RPC)
      const { data: houseName, error: houseError } = await supabase.rpc('get_household_name_by_id', { h_id: householdId });

      if (houseError) {
          console.error('AXIOM ERROR: Household Name RPC Failed:', houseError);
          throw houseError;
      }
      setHouseholdData({ household_name: houseName });

      // 2. Fetch Tasks
      await fetchTasks(); 
      
    } catch (err) {
      console.error('AXIOM ERROR: Household Data Fetch Failed (Overall):', err);
      setError('Failed to load critical household data.');
      setHouseholdData(null);
      setTasks([]); 
    }
    console.log('AXIOM LOG: [Dashboard] fetchDashboardData RETURNED.');
  }, [householdId, fetchTasks]); 


  // Handlers (trimmed for brevity, unchanged)
  const handleGenerateCode = async () => { /* ... unchanged ... */ };
  const handleDeleteProfile = async (profileId, displayName) => { /* ... unchanged ... */ };
  const handleEditProfile = (profile) => { /* ... unchanged ... */ };
  const handleProfileUpdated = useCallback((message) => { /* ... unchanged ... */ }, []); 
  const handleTaskCreated = useCallback((message) => { /* ... unchanged ... */ }, []);
  const handleCompleteTask = async (taskId, taskTitle) => { /* ... unchanged ... */ };
  const handleApproveTask = async (taskId, taskTitle) => { /* ... unchanged ... */ };
  const handleRejectTask = async (taskId, taskTitle) => { /* ... unchanged ... */ };
  const handleProfileAdded = useCallback(() => { /* ... unchanged ... */ }, []);
  const handleInviteSuccess = useCallback((message) => { /* ... unchanged ... */ }, []);


  // --- MAIN EFFECT: Initial Load and Task Realtime Listener ---
  useEffect(() => {
    console.log(`AXIOM LOG: [Dashboard] Main Effect RUN. Household ID: ${householdId}, Fetch Initiated Ref: ${fetchInitiatedRef.current}`);
    
    if (!householdId) return; 
    
    // CRITICAL FINAL GUARD: If we've already run the initial fetch, do not re-run it.
    if (fetchInitiatedRef.current) return;

    setLoading(true);

    // 1. Initial load of household name and tasks
    fetchDashboardData().finally(() => setLoading(false));

    // Set the ref to true so this logic never runs again on subsequent renders/re-mounts.
    fetchInitiatedRef.current = true;

    // 2. Realtime Subscription Setup for Tasks (unchanged)
    const channel = supabase.channel(`household_${householdId}_updates`)
      .on('postgres_changes', 
          { event: 'INSERT|UPDATE|DELETE', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` }, 
          (payload) => {
              // ... state manipulation logic ...
              setTasks(prevTasks => {
                  const updatedTask = payload.new;
                  const oldTask = payload.old;
                  const taskId = updatedTask?.id || oldTask?.id;

                  if (payload.eventType === 'DELETE') {
                      return prevTasks.filter(t => t.id !== taskId);
                  } 
                  if (payload.eventType === 'INSERT') {
                      return [updatedTask, ...prevTasks.filter(t => t.id !== taskId)];
                  } 
                  if (payload.eventType === 'UPDATE') {
                      const existingTaskIndex = prevTasks.findIndex(t => t.id === taskId);
                      if (existingTaskIndex > -1) {
                          const newTasks = [...prevTasks];
                          newTasks[existingTaskIndex] = updatedTask;
                          return newTasks;
                      }
                      if (updatedTask.status === 'pending' || updatedTask.status === 'completed') {
                           return [updatedTask, ...prevTasks];
                      }
                  }
                  return prevTasks; 
              });
          }
      )
      .subscribe(); 

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId, fetchDashboardData, fetchTasks]);


  // If ProfileContext is loading, show spinner
  if (isProfileContextLoading) {
    return <LoadingSpinner text="Initializing household profiles..." />;
  }
  
  // AUTHENTICATED USER logic
  const currentAuthUserId = currentUser?.id;
  const authUserProfileData = profiles.find(p => p.auth_user_id === currentAuthUserId);
  const isAuthUserAdmin = authUserProfileData?.is_admin;


  // Check for the most critical data points
  if (loading) { 
    return <LoadingSpinner text="Loading your family dashboard..." />;
  }
  
  if (error) {
    return <div className="p-8 text-center text-signal-error bg-bg-canvas min-h-screen">Error: {error}</div>;
  }
  
  const viewAsText = activeProfileData 
    ? (isImpersonating 
      ? `Viewing as: ${activeProfileData.display_name}`
      : `Active Profile: ${activeProfileData.display_name} (Admin)`)
    : 'Active Profile: Loading...';


  return (
    <div className="p-8 bg-bg-canvas min-h-screen">
      
      {/* Notification Banner Component */}
      <NotificationBanner 
          message={notification?.message} 
          type={notification?.type}
      />

      <header className="mb-6">
          <Link to="/dashboard" className="text-sm text-action-primary hover:underline">
            &larr; Back to All Households
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">
            {householdData?.household_name || 'Your Household'} Dashboard
          </h1>
          {/* Active Profile Display */}
          <p className="text-sm text-text-secondary mt-1">
              {viewAsText}
          </p>
      </header>


      {/* Profile Management Section (The Profile Switcher) */}
      <div className="bg-bg-surface p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
            Switch Profile Context
        </h2>
        
        {/* PROFILE SWITCHER UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {profiles.length > 0 ? (
            profiles.map(profile => (
              <div 
                key={profile.id}
                onClick={() => switchProfile(profile.id)} 
                className={`cursor-pointer rounded-md transition duration-150 ease-in-out ${
                    profile.id === activeProfileId 
                    ? 'ring-4 ring-action-primary ring-offset-2' 
                    : 'hover:opacity-80'
                }`}
              >
                  <ProfileListItem 
                    profile={profile}
                    currentAuthUserId={currentAuthUserId} 
                    handleEditProfile={handleEditProfile}
                    handleDeleteProfile={handleDeleteProfile}
                  />
              </div>
            ))
          ) : (
            <p className="text-text-secondary">No profiles found.</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center space-x-4">
            <button
              onClick={() => setShowManagedProfileModal(true)}
              className="py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover transition duration-150 mb-2 md:mb-0"
            >
              + Add New Family Member
            </button>
            
            <button
              onClick={handleGenerateCode}
              disabled={codeLoading}
              className="py-2 px-4 bg-bg-muted text-text-primary font-semibold rounded-md border border-border-primary hover:bg-palette-gray-100 transition duration-150 mb-2 md:mb-0"
            >
              {codeLoading ? 'Generating...' : 'Generate Invite Code'}
            </button>
            
            {inviteCode && (
                <div className="text-lg font-bold text-text-primary bg-bg-muted p-2 rounded-md border border-border-primary ml-4 transition-all duration-300 ease-in-out">
                    Code: <span className="text-action-primary tracking-widest">{inviteCode}</span>
                </div>
            )}
        </div>
      </div>

      {/* Tasks and Rewards Sections */}
      <div className="space-y-8">
        <div className="bg-bg-surface p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Family Tasks ({tasks.length})</h2>
          
          <div className="mb-4">
            <button
              onClick={() => setShowCreateTaskModal(true)} 
              className="py-2 px-4 bg-action-primary text-text-on-action font-semibold rounded-md hover:bg-action-primary-hover transition duration-150"
            >
              + Create New Task
            </button>
          </div>
          
          <div className="mt-4">
            {tasks.length > 0 ? (
                tasks.map(task => (
                    <TaskListItem 
                        key={task.id}
                        task={task}
                        profiles={profiles} 
                        currentProfileId={activeProfileId} 
                        isAuthUserAdmin={isAuthUserAdmin} 
                        onComplete={handleCompleteTask}     
                        onApprove={handleApproveTask}      
                        onReject={handleRejectTask}        
                    />
                ))
            ) : (
                <p className="text-text-secondary">No tasks found. Click "Create New Task" to get started!</p>
            )}
          </div>
        </div>
        <div className="bg-bg-surface p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-text-primary">Rewards Store (To Do)</h2>
          <p className="text-text-secondary mt-2">Store item creation and point redemption UI will go here.</p>
        </div>
      </div>
      
      {/* Modals (unchanged) */}
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
      <UpdateProfileModal
        isOpen={showEditProfileModal && !profileToEdit}
        onClose={() => setShowEditProfileModal(false)}
        onProfileUpdated={handleProfileUpdated}
      />
      <EditManagedProfileModal
        isOpen={!!profileToEdit}
        onClose={() => setProfileToEdit(null)}
        targetProfile={profileToEdit}
        onProfileUpdated={handleProfileUpdated}
      />
      <CreateTaskModal
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          profiles={profiles} 
          onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}

export default HouseholdDashboard;