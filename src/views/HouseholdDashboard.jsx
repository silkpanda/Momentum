// src/views/HouseholdDashboard.jsx (FIXED: Correctly render all profiles)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ProfileProvider, useProfile } from '../context/ProfileContext';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import ProfileCard from '../components/ProfileCard';
import ProfileListItem from '../components/ProfileListItem';
import TaskListItem from '../components/TaskListItem';
import CreateChildProfileModal from '../components/CreateChildProfileModal';
import InviteMemberModal from '../components/InviteMemberModal';
import EditManagedProfileModal from '../components/EditManagedProfileModal';
import UpdateProfileModal from '../components/UpdateProfileModal';
import CreateTaskModal from '../components/CreateTaskModal';

// Icons
import { 
  ChevronDownIcon, 
  UserPlusIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  PlusIcon
} from '@heroicons/react/24/solid';


function HouseholdDashboard() {
  const { householdId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading, userProfile, logout } = useAuth();

  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  
  const [isCreateChildProfileModalOpen, setIsCreateChildProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const fetchAttemptedRef = useRef(false);

  // --- Data Fetching Functions ---

  const fetchTasks = useCallback(async () => {
    console.log('AXIOM LOG: [Dashboard] fetchTasks CALLED.');
    setIsTasksLoading(true);
    setTasksError(null);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', householdId)
      .in('status', ['pending', 'completed'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('AXIOM ERROR: Task fetch failed: ', error);
      setTasksError('Failed to load tasks. Check RLS.');
    } else {
      setTasks(data || []);
    }
    console.log('AXIOM LOG: [Dashboard] fetchTasks RETURNED.');
    setIsTasksLoading(false);
  }, [householdId]);

  const fetchDashboardData = useCallback(async () => {
    console.log('AXIOM LOG: [Dashboard] fetchDashboardData CALLED.');
    
    await Promise.all([
      fetchTasks()
    ]);
    
    console.log('AXIOM LOG: [Dashboard] fetchDashboardData RETURNED.');
  }, [fetchTasks]);


  // --- Event Handlers ---
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- Main Effect (Data Orchestration) ---
  
  useEffect(() => {
    console.log(`AXIOM LOG: [Dashboard] Main Effect RUN. Household ID: ${householdId}, Fetch Initiated Ref: ${fetchAttemptedRef.current}`);

    if (authLoading) {
      console.log('AXIOM LOG: [Dashboard] Main Effect: EXIT (Auth Loading)');
      return;
    }
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (fetchAttemptedRef.current) {
      console.log('AXIOM LOG: [Dashboard] Main Effect: EXIT (Fetch already attempted)');
      return;
    }
    
    fetchAttemptedRef.current = true;
    
    console.log('AXIOM LOG: [Dashboard] Main Effect: FIRING fetchDashboardData');
    fetchDashboardData();

    // NOTE: Realtime subscription for tasks is here
    const channel = supabase
      .channel(`tasks_for_${householdId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          filter: `household_id=eq.${householdId}` 
        },
        () => {
          console.log('AXIOM LOG: [Dashboard] Realtime change detected, refreshing tasks...');
          fetchTasks();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('AXIOM LOG: [Dashboard] Realtime channel subscribed.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('AXIOM ERROR: Realtime channel error: ', err);
        }
      });
      
    return () => {
      console.log('AXIOM LOG: [Dashboard] Main Effect: CLEANUP (Removing channel)');
      supabase.removeChannel(channel);
    };

  }, [
    householdId, 
    currentUser, 
    authLoading, 
    navigate, 
    fetchDashboardData, 
    fetchTasks
  ]);


  // --- Render Logic ---
  return (
    <ProfileProvider householdId={householdId}>
      <DashboardContent
        userProfile={userProfile}
        isTasksLoading={isTasksLoading}
        tasks={tasks}
        tasksError={tasksError}
        onLogout={handleLogout}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onOpenCreateProfile={() => setIsCreateChildProfileModalOpen(true)}
      />

      {/* Modals */}
      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        householdId={householdId}
      />
      
      <CreateChildProfileModal
        isOpen={isCreateChildProfileModalOpen}
        onClose={() => setIsCreateChildProfileModalOpen(false)}
        householdId={householdId}
      />
      
      <EditManagedProfileModal />
      <UpdateProfileModal />
      <CreateTaskModal />

    </ProfileProvider>
  );
}


// --- Child Component: DashboardContent ---
function DashboardContent({ 
  userProfile,
  isTasksLoading, 
  tasks, 
  tasksError,
  onLogout,
  onOpenInvite,
  onOpenCreateProfile
}) {
  
  const { 
    profiles, 
    activeProfileId, 
    activeProfileData,
    isLoading: isProfilesLoading, 
    profilesError, 
    switchProfile 
  } = useProfile();

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  console.log(`AXIOM LOG: [DashboardContent] Render. 
    isProfilesLoading: ${isProfilesLoading}, 
    isTasksLoading: ${isTasksLoading}, 
    activeProfileData: ${JSON.stringify(activeProfileData)}`);


  // Loading & Error Root State
  if (isProfilesLoading || isTasksLoading) {
    return (
      <div className="bg-base-100 h-full w-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (profilesError || tasksError) {
    return (
      <div className="bg-base-100 h-full w-full p-4">
        <div className="alert alert-error">
          <p>Error loading dashboard:</p>
          <p>{profilesError}</p>
          <p>{tasksError}</p>
        </div>
      </div>
    );
  }
  
  // --- Computed UI State ---
  
  // 🛠️ FIX: Correctly filter profiles into Parents (have auth) and Children (no auth)
  const parentProfiles = profiles.filter(p => p.auth_user_id);
  const childProfiles = profiles.filter(p => !p.auth_user_id);

  // Get the *currently logged-in* user's parent profile
  const loggedInParentProfile = userProfile 
    ? parentProfiles.find(p => p.auth_user_id === userProfile.auth_user_id) 
    : undefined;
    
  const isParent = activeProfileData?.is_admin || false;
  
  // 🛠️ FIX: Impersonating logic must use the loggedInParentProfile
  const isImpersonating = loggedInParentProfile ? activeProfileData?.id !== loggedInParentProfile.id : false;


  console.log('AXIOM LOG: [DashboardContent] RENDER: Main UI');
  
  return (
    <div className="p-4 flex flex-col h-full bg-base-100 text-base-content">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        {activeProfileData ? (
          <ProfileCard 
            profile={activeProfileData} 
            isImpersonating={isImpersonating}
            // 🛠️ FIX: Use loggedInParentProfile to ensure we switch back to the correct user
            onClick={loggedInParentProfile ? () => switchProfile(loggedInParentProfile.id) : undefined}
          />
        ) : (
          <div className="skeleton h-12 w-48"></div>
        )}
        
        <button className="btn btn-ghost btn-circle" onClick={onLogout}>
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </button>
      </header>

      {/* Profile Selector */}
      <div className="mb-4">
        <h2 className="font-medium text-lg text-base-content opacity-60 mb-2">Household</h2>
        <div className="flex space-x-2 overflow-x-auto p-1">
          
          {/* 🛠️ FIX: Map over *all* parentProfiles */}
          {parentProfiles.map(profile => (
            <ProfileListItem
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              onClick={() => switchProfile(profile.id)}
            />
          ))}
          
          {/* 🛠️ FIX: Map over *all* childProfiles */}
          {childProfiles.map(profile => (
            <ProfileListItem
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              onClick={() => switchProfile(profile.id)}
            />
          ))}
          
          {isParent && (
            <>
              <button 
                className="btn btn-ghost btn-circle btn-sm bg-base-200"
                onClick={onOpenCreateProfile}
                title="Add Child Profile"
              >
                <UserPlusIcon className="h-5 w-5" />
              </button>
              <button 
                className="btn btn-ghost btn-circle btn-sm bg-base-200"
                onClick={onOpenInvite}
                title="Invite Parent"
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-medium text-lg text-base-content opacity-60">Tasks</h2>
          {isParent && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setIsCreateTaskModalOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              New Task
            </button>
          )}
        </div>
        
        <div className="flex-grow overflow-y-auto bg-base-200 rounded-box p-2">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskListItem 
                key={task.id} 
                task={task} 
                profiles={profiles}
              />
            ))
          ) : (
            <p className="text-base-content opacity-60 text-center p-4">
              No tasks found.
            </p> 
          )}
        </div>
      </div>
      
      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        preselectedProfileId={activeProfileId}
      />
    </div>
  );
}

export default HouseholdDashboard;