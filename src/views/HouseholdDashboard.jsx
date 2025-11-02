// src/views/HouseholdDashboard.jsx (FIXED: Removed stray </WELCOME> tag)

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
import CreateManagedProfileModal from '../components/CreateManagedProfileModal';
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
  // 'userProfile' comes from useAuth(), NOT useProfile()
  const { currentUser, loading: authLoading, userProfile, logout } = useAuth();

  // State for this Dashboard (Parent)
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksError, setTasksError] = useState(null);
  
  // Modal States
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Ref to prevent main effect from re-running on dev strict mode
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
        userProfile={userProfile} // Pass the userProfile from useAuth() down
        isTasksLoading={isTasksLoading}
        tasks={tasks}
        tasksError={tasksError}
        onLogout={handleLogout}
        onOpenInvite={() => setIsInviteModalOpen(true)}
        onOpenCreateProfile={() => setIsCreateProfileModalOpen(true)}
      />

      {/* Modals */}
      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        householdId={householdId}
      />
      
      <CreateManagedProfileModal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
        householdId={householdId}
      />
      
      {/* These modals are self-activating via context */}
      <EditManagedProfileModal />
      <UpdateProfileModal />
      <CreateTaskModal />

    </ProfileProvider>
  );
}


// --- Child Component: DashboardContent ---
function DashboardContent({ 
  userProfile, // This is the prop from useAuth()
  isTasksLoading, 
  tasks, 
  tasksError,
  onLogout,
  onOpenInvite,
  onOpenCreateProfile
}) {
  
  // Consume the profile context
  const { 
    profiles, 
    activeProfileId, 
    activeProfileData,
    isLoading: isProfilesLoading, 
    profilesError, 
    switchProfile 
  } = useProfile();

  // Modal State
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  console.log(`AXIOM LOG: [DashboardContent] Render. 
    isProfilesLoading: ${isProfilesLoading}, 
    isTasksLoading: ${isTasksLoading}, 
    activeProfileData: ${JSON.stringify(activeProfileData)}`);


  // Loading & Error Root State
  if (isProfilesLoading || isTasksLoading) {
    console.log('AXIOM LOG: [DashboardContent] RENDER: LoadingSpinner (Profiles or Tasks)');
    return <LoadingSpinner />;
  }

  if (profilesError || tasksError) {
    console.log('AXIOM LOG: [DashboardContent] RENDER: Error Display');
    return (
      <div className="text-error-content p-4">
        <p>Error loading dashboard:</p>
        <p>{profilesError}</p>
        <p>{tasksError}</p>
      </div>
    );
  }
  
  // --- Computed UI State ---
  
  // Find authProfile safely, checking for userProfile prop first
  const authProfile = userProfile 
    ? profiles.find(p => p.auth_user_id === userProfile.auth_user_id) 
    : undefined;
    
  const managedProfiles = profiles.filter(p => !p.auth_user_id);
  const isAdmin = activeProfileData?.is_admin || false;
  
  // Determine if impersonating, now with safe checks
  const isImpersonating = authProfile ? activeProfileData?.id !== authProfile.id : false;


  console.log('AXIOM LOG: [DashboardContent] RENDER: Main UI');
  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        {activeProfileData ? (
          <ProfileCard 
            profile={activeProfileData} 
            isImpersonating={isImpersonating}
            // Guard the onClick so it only works if authProfile is loaded
            onClick={authProfile ? () => switchProfile(authProfile.id) : undefined}
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
        <h2 className="text-sm font-medium text-content-secondary mb-2">Household</h2>
        <div className="flex space-x-2 overflow-x-auto p-1">
          {authProfile && (
            <ProfileListItem
              profile={authProfile}
              isActive={authProfile.id === activeProfileId}
              onClick={() => switchProfile(authProfile.id)}
            />
          )}
          {managedProfiles.map(profile => (
            <ProfileListItem
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              onClick={() => switchProfile(profile.id)}
            />
          ))}
          
          {isAdmin && (
            <>
              <button 
                className="btn btn-ghost btn-circle btn-sm bg-base-200"
                onClick={onOpenCreateProfile}
              >
                <UserPlusIcon className="h-5 w-5" />
              </button>
              <button 
                className="btn btn-ghost btn-circle btn-sm bg-base-200"
                onClick={onOpenInvite}
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
          <h2 className="text-sm font-medium text-content-secondary">Tasks</h2>
          {isAdmin && (
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
            <p className="text-content-secondary text-center p-4">
              No tasks found.
            </p> 
          )}
        </div>
      </div>
      
      {/* Self-contained modal */}
      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        preselectedProfileId={activeProfileId}
      />
    </div>
  );
}

export default HouseholdDashboard;