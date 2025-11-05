// src/context/ProfileContext.jsx (FIXED: Cleaned up and stabilized)

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback, // We are using useCallback again, but correctly this time.
} from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext.jsx'; // Corrected import path

const ProfileContext = createContext();

export function useProfile() {
  return useContext(ProfileContext);
}

export function ProfileProvider({ children }) {
  const { currentUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- THIS IS THE FIX (Part 1) ---
  // We define the fetch logic as a stable useCallback function.
  // It now safely depends on setLoading and setProfile.
  const fetchProfile = useCallback(
    async (user) => {
      if (!user) {
        console.log('ProfileContext: No user, setting profile to null.');
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('ProfileContext: User found, fetching profile...');
      setLoading(true); // Set loading true for *this* fetch

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle(); // Correctly returns null instead of erroring

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('ProfileContext: Profile not found (PGRST116).');
            setProfile(null);
          } else {
            throw error;
          }
        } else {
          console.log('ProfileContext: Profile fetched:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('ProfileContext: Error fetching profile:', error);
        setProfile(null);
      } finally {
        console.log('ProfileContext: <<< PROFILE FETCH COMPLETE.');
        setLoading(false);
      }
    },
    [setProfile, setLoading]
  ); // Dependencies are the state setters
  // ------------------------------------

  useEffect(() => {
    // This effect runs when auth state is resolved or changes
    console.log(
      `ProfileContext: useEffect triggered. AuthLoading: ${authLoading}, User: ${!!currentUser}`
    );

    // Only run the fetch logic when auth is no longer loading
    if (!authLoading) {
      fetchProfile(currentUser);
    }
    // This dependency array is now stable and correct.
  }, [currentUser, authLoading, fetchProfile]);

  const value = {
    profile,
    loading,
    fetchProfile, // --- THIS IS THE FIX (Part 2) ---
    // We expose the clean, stable fetchProfile function.
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}