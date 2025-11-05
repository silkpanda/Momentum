// src/context/ProfileContext.jsx (FIXED: Infinite loop)

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback, // <--- 1. Import useCallback
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

  // --- 2. Wrap fetchProfile in useCallback ---
  // This ensures the function itself doesn't change on every render,
  // which was the cause of our infinite loop.
  const fetchProfile = useCallback(
    async (user) => {
      if (!user) {
        console.log('ProfileContext: No user, setting profile to null.');
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('ProfileContext: User found, fetching profile...');
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle(); // This part is correct

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
    []
  ); // Dependencies are empty because it has no external React state dependencies

  useEffect(() => {
    // This effect runs when auth state is resolved or changes
    console.log(
      `ProfileContext: useEffect triggered. AuthLoading: ${authLoading}, User: ${!!currentUser}`
    );
    if (!authLoading) {
      fetchProfile(currentUser);
    }
    // --- 3. Add fetchProfile to dependency array ---
    // Now that it's stable, we can safely add it.
  }, [currentUser, authLoading, fetchProfile]);

  const value = {
    profile,
    loading,
    fetchProfile, // Expose fetchProfile so it can be called manually
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}