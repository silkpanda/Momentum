import { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../supabaseClient';

// --- HEROICONS V2 IMPORTS ---
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// Import the components
import ProfileCard from '../components/ProfileCard';
import TaskListItem from '../components/TaskListItem';
import LoadingSpinner from '../components/LoadingSpinner';
import CreateTaskModal from '../components/CreateTaskModal';
import EditManagedProfileModal from '../components/EditManagedProfileModal';
import UpdateProfileModal from '../components/UpdateProfileModal';
// import NotificationBanner from '../components/NotificationBanner'; 

export default function HouseholdDashboard() {
  // This is YOUR (the admin's) profile
  const { profile: userProfile, fetchProfile } = useProfile();
  const householdId = userProfile?.household_id;

  const [profiles, setProfiles] = useState([]);
  const [isProfilesLoading, setProfilesLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [isTasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  
  const [managedProfileToEdit, setManagedProfileToEdit] = useState(null);
  const [isUpdateOwnProfileOpen, setIsUpdateOwnProfileOpen] = useState(false);

  const [activeProfileId, setActiveProfileId] = useState('all');
  
  // const [notification, setNotification] = useState(null);

  // --- Reusable sort function ---
  const sortProfiles = (profilesData, adminProfileId) => {
    if (!Array.isArray(profilesData)) return [];
    
    const adminProfile = profilesData.find(p => p.id === adminProfileId);
    const otherProfiles = profilesData.filter(p => p.id !== adminProfileId);
    
    return [adminProfile, ...otherProfiles].filter(Boolean);
  };

  // --- DATA FETCHING ---
  
  // Function to fetch/refresh profiles
  const fetchHouseholdProfiles = async () => {
    if (!householdId || !userProfile?.id) return;
    
    setProfilesLoading(true);
    setProfilesError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }); 

    if (error) {
      console.error('Error fetching household profiles:', error);
      setProfilesError(error.message);
    } else {
      setProfiles(sortProfiles(data, userProfile.id));
    }
    setProfilesLoading(false);
  };

  // Initial fetch for profiles
  useEffect(() => {
    fetchHouseholdProfiles();
  }, [householdId, userProfile?.id]);

  // Initial fetch for tasks
  useEffect(() => {
    if (!householdId) return;

    const fetchHouseholdTasks = async () => {
      setTasksLoading(true);
      setTasksError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching household tasks:', error);
        setTasksError(error.message);
      } else {
        setTasks(data);
      }
      setTasksLoading(false);
    };

    fetchHouseholdTasks();
  }, [householdId]);

  // --- OPTIMISTIC UI FUNCTIONS ---
  
  const handleTaskCreated = (newTask) => {
    console.log('AXIOM LOG: Optimistically updating UI with new task', newTask);
    setTasks(currentTasks => [newTask, ...currentTasks]);
    setIsCreateTaskModalOpen(false);
  };

  const handleManagedProfileUpdated = (notificationMessage) => {
    console.log('AXIOM LOG: Re-fetching profiles list after managed update.');
    fetchHouseholdProfiles();
    // setNotification(notificationMessage);
    setManagedProfileToEdit(null);
  };
  
  const handleSelfProfileUpdated = (notificationMessage) => {
    console.log('AXIOM LOG: Re-fetching self-profile and household list after self update.');
    fetchProfile(); 
    fetchHouseholdProfiles();
    // setNotification(notificationMessage);
    setIsUpdateOwnProfileOpen(false);
  };
  
  // --- RENDER LOGIC ---

  if (isProfilesLoading || isTasksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-canvas">
        <LoadingSpinner />
      </div>
    );
  }

  if (profilesError || tasksError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 text-center bg-bg-canvas text-text-danger">
        <p>
          Error loading household data: {profilesError || tasksError}
        </p>
      </div>
    );
  }
  
  const filteredTasks =
    activeProfileId === 'all'
      ? tasks
      : tasks.filter((task) => task.assigned_to_profile_id === activeProfileId);

  const activeProfileData =
    activeProfileId === 'all'
      ? { display_name: 'All Tasks', profile_color: 'bg-base-300' }
      : profiles.find((p) => p.id === activeProfileId);


  return (
    <>
      <div className="flex flex-col h-screen bg-bg-canvas text-text-primary">
        {/* --- Header / Profile Selector --- */}
        <header className="sticky top-0 z-10 p-4 shadow-lg bg-bg-surface">
          <h2 className="flex items-center mb-4 text-lg font-medium text-text-secondary">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Family Members
          </h2>
          <div className="flex pb-2 space-x-4 overflow-x-auto">
            <ProfileCard
              profile={{ display_name: 'All', points: 0, profile_color: 'bg-base-300' }}
              isActive={activeProfileId === 'all'}
              onClick={() => setActiveProfileId('all')}
            />
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={activeProfileId === profile.id}
                onClick={() => setActiveProfileId(profile.id)}
                onEditClick={() => {
                  if (profile.id === userProfile.id) {
                    setIsUpdateOwnProfileOpen(true);
                  } else {
                    setManagedProfileToEdit(profile);
                  }
                }} 
              />
            ))}
          </div>
        </header>

        {/* --- Task List Content --- */}
        <main className="flex-1 overflow-y-auto">
          <DashboardContent
            isProfilesLoading={isProfilesLoading}
            isTasksLoading={isTasksLoading}
            activeProfileData={activeProfileData}
            filteredTasks={filteredTasks}
            profiles={profiles}
          />
        </main>

        {/* --- Footer / Create Task Button --- */}
        {/* --- THIS IS THE FIX --- */}
        {/* Check if the LOGGED-IN USER is an admin, not the selected profile */}
        {userProfile?.is_admin && (
          <footer className="sticky bottom-0 z-10 p-4 bg-bg-surface">
            <button
              onClick={() => setIsCreateTaskModalOpen(true)}
              // Use daisyUI/Style Guide classes
              className="btn btn-primary w-full"
            >
              <PlusIcon className="w-6 h-6 mr-2" />
              Create New Task
            </button>
          </footer>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {isCreateTaskModalOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onTaskCreated={handleTaskCreated}
          onClose={() => setIsCreateTaskModalOpen(false)}
          householdId={householdId}
          profiles={profiles}
          preselectedProfileId={activeProfileId === 'all' ? null : activeProfileId}
        />
      )}
      
      {managedProfileToEdit && (
        <EditManagedProfileModal
          isOpen={!!managedProfileToEdit}
          onClose={() => setManagedProfileToEdit(null)}
          targetProfile={managedProfileToEdit}
          onProfileUpdated={handleManagedProfileUpdated}
        />
      )}
      
      {isUpdateOwnProfileOpen && (
        <UpdateProfileModal
          isOpen={isUpdateOwnProfileOpen}
          onClose={() => setIsUpdateOwnProfileOpen(false)}
          onProfileUpdated={handleSelfProfileUpdated}
        />
      )}
    </>
  );
}

// --- DashboardContent sub-component (no changes) ---
function DashboardContent({
  isProfilesLoading,
  isTasksLoading,
  activeProfileData,
  filteredTasks,
  profiles,
}) {
  console.log('AXIOM LOG: [DashboardContent] Render. ', {
    isProfilesLoading,
    isTasksLoading,
    activeProfileData,
  });

  if (isTasksLoading || isProfilesLoading) {
    return <LoadingSpinner />;
  }
  
  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-text-secondary">
        <ClipboardDocumentListIcon className="w-16 h-16" />
        <h3 className="mt-4 text-xl font-semibold">No tasks found</h3>
        <p className="mt-1">
          Try selecting a different family member or create a new task.
        </p>
      </div>
    );
  }

  const headerColor = activeProfileData?.profile_color || 'bg-base-300';
  const headerName = activeProfileData?.display_name || 'Tasks';
  const headerTextColor = activeProfileData?.profile_color ? 'text-base-100' : 'text-base-content';


  return (
    <div className="p-4">
      <div
        className={`flex items-center p-4 mb-4 rounded-lg shadow ${headerColor} ${headerTextColor}`}
      >
        <h2 className="text-2xl font-bold">{headerName}</h2>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            profiles={profiles}
          />
        ))}
      </div>
    </div>
  );
}