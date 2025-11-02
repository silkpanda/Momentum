// src/context/ProfileContext.jsx (HARDENED LOOP BREAK WITH LOGGING)

import React, { useContext, useState, useEffect, useCallback, useRef } from 'react'; 
import { supabase } from '../supabaseClient'; 
import { useAuth } from '../context/AuthContext'; 

// Create the context
const ProfileContext = React.createContext();

// Hook for child components to consume the context
export function useProfile() {
  return useContext(ProfileContext);
}

// Helper to determine the initial active profile
const getInitialActiveProfile = (profiles, currentUser) => {
    if (!profiles || profiles.length === 0) return null;
    
    const authProfile = profiles.find(p => p.auth_user_id === currentUser?.id);
    if (authProfile) return authProfile.id;
    
    return profiles[0].id;
};


// The Provider component that will manage the state and Realtime fetching logic
export function ProfileProvider({ children, householdId }) {
  // State for all profiles in the household
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profilesError, setProfilesError] = useState(null);
  
  // State for which profile the user is currently "viewing as" or "acting as"
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  
  const { currentUser, loading: authLoading } = useAuth();

  // CRITICAL FINAL GUARD: Ref to prevent the fetch from re-running on state change.
  const fetchAttemptedRef = useRef(false);


  // --- Core Data Fetcher ---
  const fetchProfiles = useCallback(async () => {
    console.log('AXIOM LOG: [Context] fetchProfiles CALLED.');
    if (!householdId) {
        setProfiles([]);
        setIsLoading(false);
        console.log('AXIOM LOG: [Context] fetchProfiles EXIT: No Household ID.');
        return;
    }
      
    setIsLoading(true);
    setProfilesError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('household_id', householdId)
      .order('is_admin', { ascending: false }) 
      .order('created_at', { ascending: true }); 

    if (error) {
      console.error('AXIOM ERROR: Supabase Profiles Fetch Failed!', error.message, 'Details:', error);
      setProfilesError(error.message || 'Error loading household members. Check RLS policy or Network.');
      setProfiles([]);
      console.log('AXIOM LOG: [Context] fetchProfiles EXIT: Network Error.');
    } else {
      setProfiles(data || []);
      console.log(`AXIOM LOG: [Context] fetchProfiles SUCCESS. Found ${data ? data.length : 0} profiles.`);
    }
    
    setIsLoading(false);
    console.log('AXIOM LOG: [Context] fetchProfiles RETURNED.');
  }, [householdId]);


  // --- Profile Switching Logic ---
  const switchProfile = useCallback((profileId) => {
    const targetProfile = profiles.find(p => p.id === profileId);
    if (!targetProfile) return;

    const isImpersonatingCheck = targetProfile.auth_user_id !== currentUser?.id;
    
    setActiveProfileId(profileId);
    setIsImpersonating(isImpersonatingCheck);
    
  }, [profiles, currentUser]);


  // Effect 1: Handles Data Fetching and Realtime subscription
  useEffect(() => {
    console.log(`AXIOM LOG: [Context] Effect 1 (Data Fetch) RUN. Auth Loading: ${authLoading}, Current User: ${!!currentUser}, Fetch Attempted: ${fetchAttemptedRef.current}`);
    
    if (!householdId) return;
    
    // 1. CRITICAL GUARD: Only run the initial fetch once.
    if (fetchAttemptedRef.current) return;
    
    // 2. CRITICAL DOUBLE-GUARD: Wait for Auth and User
    if (authLoading || !currentUser) {
        if (!authLoading && !currentUser) {
            console.error("AXIOM WARNING: Auth finished, but no user present. Skipping fetch.");
        }
        return;
    }

    // This is the one and only time the fetch will be called on mount
    fetchProfiles();
    fetchAttemptedRef.current = true; // Mark as initiated

    // 3. Realtime Subscription Setup
    const channel = supabase.channel(`profiles_for_${householdId}`) 
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public',
          table: 'profiles',
          filter: `household_id=eq.${householdId}`
        },
        () => {
          console.log('Profile Realtime change detected. Refreshing profile state...');
          // On change, we bypass the ref and run the fetch again to update data
          fetchProfiles(); 
        }
      )
      .subscribe(); 

    return () => {
      supabase.removeChannel(channel);
    };

  // The dependency array forces a re-run when external conditions (auth) change.
  }, [householdId, fetchProfiles, authLoading, currentUser]); 


  // Effect 2: Handles Profile ID selection and validity checks (Stable)
  useEffect(() => {
    console.log(`AXIOM LOG: [Context] Effect 2 (ID Select) RUN. Profiles Count: ${profiles.length}, Is Loading: ${isLoading}`);
    if (isLoading || profiles.length === 0) return;

    let calculatedId = activeProfileId;
    
    // 1. Check if we need to select a new ID (Initial Set OR Invalid ID)
    if (!activeProfileId || !profiles.find(p => p.id === activeProfileId)) {
        calculatedId = getInitialActiveProfile(profiles, currentUser);
    }

    // 2. Set ID only if calculated value is DIFFERENT from current state
    if (calculatedId !== activeProfileId) {
        setActiveProfileId(calculatedId); 
    }
    
    // 3. Update Impersonation status (uses the final determined ID)
    const finalActiveId = calculatedId !== activeProfileId ? calculatedId : activeProfileId;
    const targetProfile = profiles.find(p => p.id === finalActiveId);

    if (targetProfile) {
      const isImpersonatingCheck = targetProfile.auth_user_id !== currentUser?.id;
      // Only call setIsImpersonating if the value is changing.
      if (isImpersonatingCheck !== isImpersonating) {
        setIsImpersonating(isImpersonatingCheck);
      }
    }
    
  // The dependencies are stable and complete.
  }, [profiles, currentUser, isLoading, activeProfileId, isImpersonating]);


  // Compute the active profile's data for easy access
  const activeProfileData = profiles.find(p => p.id === activeProfileId);
  

  // The final value object passed down to all children
  const value = {
    profiles,
    activeProfileId,
    activeProfileData,
    isImpersonating,
    isLoading,
    profilesError,
    switchProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}