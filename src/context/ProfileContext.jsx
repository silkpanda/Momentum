// src/context/ProfileContext.jsx (FIXED: Exported modal functions)

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useRef,
  useMemo,
  useCallback
} from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ householdId, children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(null);
  
  // Modal State
  const [updateModal, setUpdateModal] = useState({ isOpen: false, profileId: null });
  // FPO: const [editManagedModal, setEditManagedModal] = useState({ isOpen: false, profileId: null });
  
  const fetchAttemptedRef = useRef(false);

  // --- Data Fetching ---
  
  const fetchProfiles = useCallback(async () => {
    console.log('AXIOM LOG: [Context] fetchProfiles CALLED.');
    if (!householdId) {
      console.error('AXIOM ERROR: [Context] fetchProfiles: No householdId provided.');
      setProfilesError('No household ID found.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setProfilesError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('household_id', householdId);

    if (error) {
      console.error('AXIOM ERROR: [Context] fetchProfiles failed:', error);
      setProfilesError('Failed to load profiles. Check RLS.');
    } else {
      console.log(`AXIOM LOG: [Context] fetchProfiles SUCCESS. Found ${data.length} profiles.`);
      setProfiles(data || []);
    }
    
    console.log('AXIOM LOG: [Context] fetchProfiles RETURNED.');
    setIsLoading(false);
  }, [householdId]);

  
  // --- Effects ---

  // Effect 1: Fetch Profiles
  useEffect(() => {
    console.log(`AXIOM LOG: [Context] Effect 1 (Data Fetch) RUN. Auth Loading: ${authLoading}, Current User: ${!!currentUser}, Fetch Attempted: ${fetchAttemptedRef.current}`);
    
    // Guard 1: Wait for auth
    if (authLoading) return;
    
    // Guard 2: Redirect if no user (should be handled by router, but good practice)
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    
    // Guard 3: Prevent re-fetch on StrictMode re-mount
    if (fetchAttemptedRef.current) return;
    
    // Mark fetch as attempted
    fetchAttemptedRef.current = true;
    
    // Run the fetch
    fetchProfiles();
    
  }, [currentUser, authLoading, fetchProfiles]);

  // Effect 2: Select Active Profile
  useEffect(() => {
    console.log(`AXIOM LOG: [Context] Effect 2 (ID Select) RUN. Profiles Count: ${profiles.length}, Is Loading: ${isLoading}`);
    
    if (isLoading || !currentUser) return;

    if (profiles.length > 0) {
      // Check if a profile is already selected
      if (activeProfileId) return;

      // If not, find the user's *own* auth profile
      const userAuthProfile = profiles.find(p => p.auth_user_id === currentUser.id);
      if (userAuthProfile) {
        setActiveProfileId(userAuthProfile.id);
      } else {
        // Fallback: just select the first profile (should 'never' happen in v4)
        setActiveProfileId(profiles[0].id);
      }
    }
  }, [profiles, isLoading, currentUser, activeProfileId]);


  // --- Public API Functions ---

  const switchProfile = (profileId) => {
    setActiveProfileId(profileId);
  };
  
  // Modal Controls
  const openUpdateModal = (profileId) => {
    setUpdateModal({ isOpen: true, profileId });
  };
  
  const closeUpdateModal = () => {
    setUpdateModal({ isOpen: false, profileId: null });
  };
  
  // FPO
  // const openEditManagedModal = (profileId) => {
  //   setEditManagedModal({ isOpen: true, profileId });
  // };
  
  // const closeEditManagedModal = () => {
  //   setEditManagedModal({ isOpen: false, profileId: null });
  // };

  // Memoize the derived data
  const activeProfileData = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId);
  }, [profiles, activeProfileId]);
  
  
  const value = {
    // State
    profiles,
    activeProfileId,
    activeProfileData,
    isLoading,
    profilesError,
    
    // Modal State & Functions
    updateModal,
    closeUpdateModal,
    
    // 🛠️ FIX: Added missing functions to value
    openUpdateModal, 
    // FPO: openEditManagedModal,
    // FPO: closeEditManagedModal,

    // Methods
    switchProfile,
    refreshProfiles: fetchProfiles // Expose a way to refresh
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}