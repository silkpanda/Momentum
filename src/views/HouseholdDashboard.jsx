// src/views/HouseholdDashboard.jsx (WITH LOGGING)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  
  // NOTE: Profiles data is now managed entirely by useProfile()
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
  const [loading, setLoading] = useState(true); // This loading state is for the *rest* of the dashboard data (household name, tasks)
  const [error, setError] = useState(null);
  const [showManagedProfileModal, setShowManagedProfileModal] = useState(false); 
  const [showInviteModal, setShowInviteModal] = useState(false); 
  const [notification, setNotification] = useState(null); 
  
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false); 
  
  const [inviteCode, setInviteCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  
  const [showEditProfileModal, setShowEditProfileModal] = useState(false); 
  const [profileToEdit, setProfileToEdit] = useState(null); 


  // --- Task Fetcher function (Stable, fast) ---
  const fetchTasks = useCallback(async () => {
    try {
        const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('household_id', householdId) // Ensure we only get tasks for this household
            .in('status', ['pending', 'completed']) 
            .order('created_at', { ascending: false }); 

        if (tasksError) throw tasksError;
        setTasks(tasksData); 
    } catch (err) {
        console.error('Task fetch failed:', err);
    }
  }, [householdId]);
  // --- END Task Fetcher ---


  // Function to fetch all necessary *NON-PROFILE* data for the dashboard 
  const fetchDashboardData = useCallback(async () => {
    console.log('AXIOM LOG: [Dashboard] fetchDashboardData CALLED.');
    setError(null);

    if (!householdId || !activeProfileId) {
        if (!householdId) setError("Error: No Household ID provided in URL.");
        return;
    }

    try {
      // 1. Fetch Household Name (RPC)
      const { data: houseName, error: houseError } = await supabase.rpc('get_household_name_by_id', { h_id: householdId });

      if (houseError) throw houseError;
      setHouseholdData({ household_name: houseName });
      
      // 2. Fetch Tasks (Tasks have their own Realtime manipulation, but we still need the initial fetch)
      await fetchTasks(); 
      
    } catch (err) {
      console.error('Household Data Fetch Failed:', err);
      setError('Failed to load household data. Check network or final RLS policy.');
      setHouseholdData(null);
      setTasks([]); 
    }
  }, [householdId, activeProfileId, fetchTasks]); // Removed fetchTasks from dependency array as it's already a dependency of fetchDashboardData


  // HANDLER: Calls the RPC to generate the invite code (unchanged)
  const handleGenerateCode = async () => {
      setCodeLoading(true);
      setInviteCode(null);
      
      try {
          // This RPC is simple and does not affect the profile list
          const { data: newCode, error: rpcError } = await supabase.rpc('create_invite_code');

          if (rpcError) throw rpcError;

          setNotification({ message: `New invite code generated: ${newCode}. It expires in 7 days.`, type: 'success' });
          setInviteCode(newCode);
          setTimeout(() => setNotification(null), 7000); 

      } catch (err) {
          console.error('Code Generation Failed:', err);
          setNotification({ message: 'Error generating code. Are you the Admin of this household?', type: 'error' });
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

        setNotification({ message: `Successfully deleted ${displayName}.`, type: 'success' });
        setTimeout(() => setNotification(null), 5000); 

        // CRITICAL FIX: The ProfileContext listener will automatically detect the DELETE 
        // and re-fetch the profile list. We only need to check if the Task List needs a refresh.
        // Task List subscription will handle this if the profile deletion triggers a cascade.
        // For simplicity and safety, we force a task list refresh in case of a hard profile delete.
        fetchTasks(); 

    } catch (err) {
        console.error('Delete Failed:', err);
        setNotification({ message: `Error deleting ${displayName}: ${err.message}`, type: 'error' });
        setTimeout(() => setNotification(null), 7000); 
    } finally {
        setLoading(false);
    }
  };

  // HANDLER: Routes the Edit action to the correct modal (unchanged)
  const handleEditProfile = (profile) => {
      if (profile.auth_user_id === currentUser?.id) {
          setShowEditProfileModal(true); 
      } else {
          setProfileToEdit(profile); 
      }
  };


  // HANDLER: After any profile update modal closes (CLEANUP: Rely on the subscription)
  const handleProfileUpdated = useCallback((message) => {
      const notificationType = message.toLowerCase().includes('error') ? 'error' : 'success';
      setNotification({ message: message, type: notificationType }); 
      setTimeout(() => setNotification(null), 5000); 
      // ProfileContext's Realtime listener handles the data update! No fetch needed.
      setShowEditProfileModal(false); 
      setProfileToEdit(null); 
  }, []); 


  // HANDLER: On successful task creation 
  const handleTaskCreated = useCallback((message) => {
      setNotification({ message: message, type: 'success' }); 
      setTimeout(() => setNotification(null), 5000); 
      
      // The Task Realtime listener handles the data update! No full fetch needed.
      // fetchDashboardData(); <-- REMOVED
      
  }, []); // Removed fetchDashboardData from dependency array


  // HANDLER FOR TASK COMPLETION (P0, TASK-03)
  const handleCompleteTask = async (taskId, taskTitle) => {
    try {
        setLoading(true);
        const { error: rpcError } = await supabase.rpc('complete_task', { 
            task_id: taskId,
            p_assigned_profile_id: activeProfileId 
        });

        if (rpcError) throw rpcError;

        setNotification({ message: `Task "${taskTitle}" marked as completed! Waiting for Admin approval.`, type: 'success' });
        setTimeout(() => setNotification(null), 5000); 

        // CRITICAL FIX: NO FETCH HERE. Trust the listener for the instant task update.
        
    } catch (err) {
        console.error('Task Completion Failed:', err);
        setNotification({ message: `Error completing task: ${err.message}`, type: 'error' });
        setTimeout(() => setNotification(null), 7000); 
    } finally {
        setLoading(false);
    }
  };
  
  // HANDLER: ADMIN APPROVE (P0, TASK-04)
  const handleApproveTask = async (taskId, taskTitle) => {
    try {
        setLoading(true);
        const { error: rpcError } = await supabase.rpc('approve_task', { task_id: taskId });

        if (rpcError) throw rpcError;

        setNotification({ message: `✅ Task "${taskTitle}" approved and points awarded!`, type: 'success' });
        setTimeout(() => setNotification(null), 5000); 

        // CRITICAL FIX: The ProfileContext listener will refresh profiles/points.
        // The Task listener will refresh the task status.
        // fetchDashboardData(); <-- REMOVED

    } catch (err) {
        console.error('Task Approval Failed:', err);
        setNotification({ message: `Error approving task: ${err.message}`, type: 'error' });
        setTimeout(() => setNotification(null), 7000); 
    } finally {
        setLoading(false);
    }
  };
  
  // HANDLER: ADMIN REJECT (P0, TASK-04)
  const handleRejectTask = async (taskId, taskTitle) => {
    try {
        setLoading(true);
        const { error: rpcError } = await supabase.rpc('reject_task', { task_id: taskId });

        if (rpcError) throw rpcError;

        setNotification({ message: `❌ Task "${taskTitle}" rejected and sent back to pending.`, type: 'error' });
        setTimeout(() => setNotification(null), 5000); 

        // CRITICAL FIX: NO FETCH HERE. Trust the listener for the instant task update.

    } catch (err) {
        console.error('Task Rejection Failed:', err);
        setNotification({ message: `Error rejecting task: ${err.message}`, type: 'error' });
        setTimeout(() => setNotification(null), 7000); 
    } finally {
        setLoading(false);
    }
  };


  useEffect(() => {
    console.log(`AXIOM LOG: [Dashboard] Main Effect RUN. isProfileContextLoading: ${isProfileContextLoading}.`);
    if (!householdId || isProfileContextLoading) return;

    setLoading(true);

    // Initial load of household name and tasks (profiles are handled by the context)
    fetchDashboardData().finally(() => setLoading(false));

    // CRITICAL: Removed the Realtime Subscription Setup for the 'profiles' table.
    // The ProfileContext now manages that listener and its state.
    
    // CRITICAL: Realtime Subscription Setup for Tasks (KEPT FOR EFFICIENT TASK UPDATE)
    const channel = supabase.channel(`household_${householdId}_updates`)
      /* .on('postgres_changes', // <-- PROFILE LISTENER REMOVED
          { event: 'INSERT|UPDATE|DELETE', schema: 'public', table: 'profiles', filter: `household_id=eq.${householdId}` }, 
          () => {
             // THIS CODE IS NOW IN ProfileContext.jsx
             console.log('Realtime Profile Update (Points/Edit) Received - Forcing full fetch.');
             fetchDashboardData(); 
          }
      )
      */
      .on('postgres_changes', 
          { event: 'INSERT|UPDATE|DELETE', schema: 'public', table: 'tasks', filter: `household_id=eq.${householdId}` }, 
          (payload) => {
              // *** THE FINAL STABLE FIX FOR TASKS (KEPT) ***: Directly manipulate the tasks array with payload data.
              console.log(`Realtime Task Update Received: ${payload.eventType} - Applying direct array change.`);

              setTasks(prevTasks => {
                  const updatedTask = payload.new;
                  const oldTask = payload.old;
                  const taskId = updatedTask?.id || oldTask?.id;

                  // 1. DELETE
                  if (payload.eventType === 'DELETE') {
                      return prevTasks.filter(t => t.id !== taskId);
                  } 
                  
                  // 2. INSERT
                  if (payload.eventType === 'INSERT') {
                      // Prepend new task and ensure it's not a duplicate
                      return [updatedTask, ...prevTasks.filter(t => t.id !== taskId)];
                  } 
                  
                  // 3. UPDATE (Status Change)
                  if (payload.eventType === 'UPDATE') {
                      const existingTaskIndex = prevTasks.findIndex(t => t.id === taskId);
                      
                      // Task exists in the current view, so update it in place.
                      if (existingTaskIndex > -1) {
                          const newTasks = [...prevTasks];
                          newTasks[existingTaskIndex] = updatedTask;
                          return newTasks;
                      }
                      
                      // If the updated task did not exist, but its status is now visible (e.g., pending/completed), add it.
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
  }, [householdId, fetchDashboardData, isProfileContextLoading, fetchTasks]); 

  // Handlers for modals (CLEANUP: Removed redundant fetches, relying on subscriptions)
  const handleProfileAdded = useCallback(() => { 
      // CRITICAL FIX: Rely on the profiles subscription in ProfileContext
  }, []);
  const handleInviteSuccess = useCallback((message) => {
      const notificationType = message.toLowerCase().includes('error') ? 'error' : 'success';
      setNotification({ message: message, type: notificationType });
      setTimeout(() => setNotification(null), 5000); 
      // CRITICAL FIX: Rely on the profiles subscription in ProfileContext
  }, []);

  // If initial context loading, show spinner
  if (isProfileContextLoading) {
    return <LoadingSpinner text="Initializing household profiles..." />;
  }
  
  // AUTHENTICATED USER logic (used for Admin permissions, regardless of active profile)
  const currentAuthUserId = currentUser?.id;
  const authUserProfileData = profiles.find(p => p.auth_user_id === currentAuthUserId);
  const isAuthUserAdmin = authUserProfileData?.is_admin;


  // Check for the most critical data points
  if (loading || !activeProfileId) { 
    return <LoadingSpinner text="Loading your family dashboard..." />;
  }
  
  if (error) {
    return <div className="p-8 text-center text-text-primary bg-bg-canvas min-h-screen">Error: {error}</div>;
  }
  
  const viewAsText = isImpersonating 
    ? `Viewing as: ${activeProfileData?.display_name}`
    : `Active Profile: ${activeProfileData?.display_name} (Admin)`;

  // Final UI Rendering
  return (
    <div className="p-8 bg-bg-canvas min-h-screen">
      
      {/* Notification Banner Component */}
      <NotificationBanner 
          message={notification?.message} 
          type={notification?.type}
      />

      <header className="mb-6">
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