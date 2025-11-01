// src/context/ProfileContext.jsx (DEFINITIVE FIX FOR LOAD LOOP)

import React, { useContext, useState, useEffect, useCallback } from 'react';
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
    
    // 1. Try to find the profile linked to the currently logged-in Auth User
    const authProfile = profiles.find(p => p.auth_user_id === currentUser?.id);
    if (authProfile) return authProfile.id;
    
    // 2. Default to the first profile in the list
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
  
  const { currentUser } = useAuth(); // Correctly imported and working


  // --- Core Data Fetcher ---
  const fetchProfiles = useCallback(async () => {
    if (!householdId) {
        setProfiles([]);
        setIsLoading(false);
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
      console.error('Supabase Profiles Fetch Error:', error);
      setProfilesError('Error loading household members.');
      setProfiles([]);
    } else {
      setProfiles(data || []);
    }
    
    setIsLoading(false);
  }, [householdId]);

  // --- Profile Switching Logic ---
  const switchProfile = useCallback((profileId) => {
    const targetProfile = profiles.find(p => p.id === profileId);
    if (!targetProfile) return;

    const isImpersonatingCheck = targetProfile.auth_user_id !== currentUser?.id;
    
    // NOTE: This switch function is correctly calling the setters
    setActiveProfileId(profileId);
    setIsImpersonating(isImpersonatingCheck);
    
  }, [profiles, currentUser]);


  // Effect 1: Handles Data Fetching and Realtime subscription (Stable)
  useEffect(() => {
    if (!householdId) return;

    fetchProfiles();

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
          fetchProfiles(); 
        }
      )
      .subscribe(); 

    return () => {
      supabase.removeChannel(channel);
    };

  }, [householdId, fetchProfiles]);


  // Effect 2: Handles Profile ID selection and validity checks
  // CRITICAL FIX: The logic is now entirely guarded against setting state with the same value.
  useEffect(() => {
    // Only run if loading is complete and we have data
    if (isLoading || profiles.length === 0) return;

    let calculatedId = activeProfileId;
    let shouldRecalculate = false;
    
    // 1. Check if we need to select a new ID (Initial Set OR Invalid ID)
    if (!activeProfileId || !profiles.find(p => p.id === activeProfileId)) {
        calculatedId = getInitialActiveProfile(profiles, currentUser);
        shouldRecalculate = true;
    }

    // 2. Set ID only if calculated value is DIFFERENT from current state OR if a change was forced
    // The "OR shouldRecalculate" handles the initial state where activeProfileId is null.
    if (calculatedId !== activeProfileId) {
        setActiveProfileId(calculatedId); 
    }
    
    // 3. Update Impersonation status (uses the final determined ID)
    const finalActiveId = calculatedId !== activeProfileId ? calculatedId : activeProfileId;
    const targetProfile = profiles.find(p => p.id === finalActiveId);

    if (targetProfile) {
      const isImpersonatingCheck = targetProfile.auth_user_id !== currentUser?.id;
      // Fix: Only call setIsImpersonating if the value is changing.
      if (isImpersonatingCheck !== isImpersonating) {
        setIsImpersonating(isImpersonatingCheck);
      }
    }
    
  // We keep all dependencies to adhere to React rules, relying on our internal guards.
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