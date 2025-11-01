// src/context/ProfileContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useParams } from 'react-router-dom';

const ProfileContext = createContext();

/**
 * Custom hook to use the Profile context.
 * Provides the active profile state, the list of household profiles, and the switch function.
 */
export const useProfile = () => {
  return useContext(ProfileContext);
};

/**
 * Provider component to wrap the application and manage profile state.
 */
export const ProfileProvider = ({ children }) => {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  const { householdId } = useParams(); // Get the household ID from the URL
  
  // State for the profile list and the currently active profile UUID
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to securely fetch and set the profiles for the current household
  const fetchProfiles = useCallback(async () => {
    if (!currentUser || !householdId) return;

    try {
      // Use the RPC to get all profiles in the household (already secured by RLS)
      const { data: profilesData, error } = await supabase.rpc('get_household_profiles', { h_id: householdId });

      if (error) throw error;
      
      setProfiles(profilesData);

      // --- CRITICAL INITIALIZATION LOGIC ---
      // 1. Find the current authenticated user's profile
      const userProfile = profilesData.find(p => p.auth_user_id === currentUser.id);

      // 2. Set the initial activeProfileId to the authenticated user's profile
      if (userProfile && activeProfileId === null) {
        setActiveProfileId(userProfile.id);
      } else if (userProfile && activeProfileId !== null) {
        // If we already have a profile active, ensure it's still a valid profile from the new list
        const isValid = profilesData.some(p => p.id === activeProfileId);
        // If the previously active profile is no longer valid, default back to the Admin's profile
        if (!isValid) {
            setActiveProfileId(userProfile.id);
        }
      }

    } catch (err) {
      console.error('Error fetching profiles in context:', err);
      // In a real app, we might handle a redirect or error screen here
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, householdId, activeProfileId]);

  useEffect(() => {
    if (!isAuthLoading) {
        fetchProfiles();
    }
  }, [isAuthLoading, fetchProfiles]);


  /**
   * The function that handles context impersonation/switching.
   * Only allows switching to a profile that is part of the currently loaded 'profiles' array.
   * @param {string} targetProfileId - The UUID of the profile to switch to.
   */
  const switchProfile = useCallback((targetProfileId) => {
    // Security Guardrail: Ensure the targetProfileId is a valid ID within the current household list
    const isValidTarget = profiles.some(p => p.id === targetProfileId);
    
    if (isValidTarget) {
      setActiveProfileId(targetProfileId);
      // Optional: Clear any error states or notifications upon a successful switch
      console.log(`Context Switched to Profile ID: ${targetProfileId}`);
    } else {
      console.error('Security Breach Attempt: Invalid profile ID for context switch.');
    }
  }, [profiles]);

  // Find the full data object for the active profile
  const activeProfileData = profiles.find(p => p.id === activeProfileId);
  // Determine if the current active profile is the authenticated user's profile (i.e., not impersonating)
  const isImpersonating = activeProfileData && activeProfileData.auth_user_id !== currentUser?.id;
  
  const value = {
    profiles,
    activeProfileId,
    activeProfileData,
    isImpersonating,
    switchProfile,
    isLoading: isAuthLoading || isLoading,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};