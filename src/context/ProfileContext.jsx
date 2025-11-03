// src/context/ProfileContext.jsx (FIXED: Robust initial profile selection)

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

const allProfileColors = [
  { name: 'Blue', class: 'auth-blue' },
  { name: 'Purple', class: 'auth-purple' },
  { name: 'Green', class: 'managed-green' },
  { name: 'Orange', class: 'managed-orange' },
  { name: 'Red', class: 'managed-red' },
  { name: 'Teal', class: 'managed-teal' },
  { name: 'Purple (Managed)', class: 'managed-purple' },
  { name: 'Blue (Managed)', class: 'managed-blue' },
];

export function ProfileProvider({ householdId, children }) {
  // 🛠️ FIX: Get 'user' and 'userProfile'
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // This context's own loading state
  const [profilesError, setProfilesError] = useState(null);
  
  const [updateModal, setUpdateModal] = useState({ isOpen: false, profileId: null });
  
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
    
    if (fetchAttemptedRef.current === false) {
      setIsLoading(true);
    }
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
    
    setIsLoading(false); // We are done loading profiles
  }, [householdId]);

  
  // --- Effects ---

  // Effect 1: Fetch Profiles
  useEffect(() => {
    console.log(`AXIOM LOG: [Context] Effect 1 (Data Fetch) RUN. Auth Loading: ${authLoading}, Current User: ${!!user}`);
    
    // 1. Wait for Auth to be ready
    if (authLoading) return; 

    // 2. If auth is done and there's no user, we're done.
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    // 3. Auth is done, user exists. Fetch profiles *once*.
    if (!fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchProfiles();
    }
    
  }, [user, authLoading, fetchProfiles, householdId]); // 🛠️ FIX: 'user' dependency

  // Effect 2: Select Active Profile
  useEffect(() => {
    console.log(`AXIOM LOG: [Context] Effect 2 (ID Select) RUN. activeId: ${activeProfileId}, authLoading: ${authLoading}, userProfile: ${!!userProfile}, profiles: ${profiles.length}, contextLoading: ${isLoading}`);
    
    // 1. We only want this to run *once* to set the initial profile.
    if (activeProfileId) return;

    // 2. Wait for ALL data to be ready.
    if (authLoading === false && userProfile && isLoading === false && profiles.length > 0) {
      
      // 3. All data is ready. Set the initial profile.
      console.log(`AXIOM LOG: [Context] Effect 2: All data ready. Setting initial profile to ${userProfile.id}`);
      setActiveProfileId(userProfile.id);
    }
    
  }, [authLoading, userProfile, profiles, isLoading, activeProfileId]);


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
  
  // Optimistic Update Function
  const saveProfileUpdate = async (profileId, newDisplayName, newProfileColor, newIsParent) => {
    const oldProfiles = profiles;

    const newProfiles = profiles.map(p => {
      if (p.id === profileId) {
        return { 
          ...p, 
          display_name: newDisplayName, 
          profile_color: newProfileColor, 
          is_admin: newIsParent 
        };
      }
      return p;
    });

    setProfiles(newProfiles);

    try {
      console.log(`AXIOM LOG: Calling 'update_profile' RPC in background...`);
      const { error: rpcError } = await supabase.rpc('update_profile', {
        target_profile_id: profileId,
        new_display_name: newDisplayName,
        new_profile_color: newProfileColor,
        new_is_admin: newIsParent
      });

      if (rpcError) throw rpcError;

      console.log('AXIOM LOG: Background save successful.');

    } catch (error) {
      console.error('AXIOM ERROR: Optimistic save failed! Rolling back.', error);
      setProfiles(oldProfiles);
    }
  };
  
  // Memoize the derived data
  const activeProfileData = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId);
  }, [profiles, activeProfileId]);
  
  
  const value = {
    // State
    profiles,
    activeProfileId,
    activeProfileData,
    // 🛠️ FIX: The provider is loading if *either* Auth or Profiles is loading.
    isLoading: authLoading || isLoading, 
    profilesError,
    
    allProfileColors,
    
    // Modal State & Functions
    updateModal,
    closeUpdateModal,
    openUpdateModal, 

    // Methods
    switchProfile,
    refreshProfiles: fetchProfiles,
    saveProfileUpdate,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}