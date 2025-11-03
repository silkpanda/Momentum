import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient'; // CORRECTED: Was 'import supabase from...'

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Guard to prevent re-fetching if a fetch is already in progress
  const isFetching = useRef(false);

  useEffect(() => {
    console.log(`ProfileContext: useEffect triggered. AuthLoading: ${authLoading}, CurrentUser: ${!!currentUser}`);

    // Do not run if auth is still loading
    if (authLoading) {
      console.log('ProfileContext: Waiting for Auth to finish loading.');
      return;
    }

    // If auth is done and there is no user, we are logged out.
    if (!currentUser) {
      console.log('ProfileContext: No user. Clearing profile and setting loading to false.');
      setProfile(null);
      setLoading(false);
      isFetching.current = false;
      return;
    }

    // If we already have a profile for this user, don't re-fetch
    if (profile && profile.auth_user_id === currentUser.id) {
      console.log('ProfileContext: Profile already loaded. Skipping fetch.');
      setLoading(false);
      return;
    }

    // If a fetch is already running, don't start another one
    if (isFetching.current) {
      console.log('ProfileContext: Fetch already in progress. Skipping.');
      return;
    }

    const fetchProfile = async () => {
      console.log(`ProfileContext: Auth loaded and user found (${currentUser.id}). Setting fetch guard to TRUE.`);
      isFetching.current = true;
      setLoading(true);
      setError(null);

      console.log(`ProfileContext: >>> ATTEMPTING PROFILE FETCH for auth_user_id: ${currentUser.id}`);
      console.log("ProfileContext: Query: supabase.from('profiles').select('*').eq('auth_user_id', currentUser.id).single()");

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', currentUser.id)
          .single();

        // THIS IS THE LINE WE EXPECT NOT TO REACH
        console.log('ProfileContext: <<< PROFILE FETCH COMPLETE.');

        if (fetchError) {
          console.error('ProfileContext: Error fetching profile:', fetchError);
          setError(fetchError.message);
          setProfile(null);
        } else {
          console.log('ProfileContext: Successfully fetched profile:', data);
          setProfile(data);
        }
      } catch (err) {
        console.error('ProfileContext: A critical error occurred during fetchProfile:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        console.log('ProfileContext: Fetch attempt finished. Setting loading to false and fetch guard to FALSE.');
        setLoading(false);
        isFetching.current = false;
      }
    };

    fetchProfile();

  }, [currentUser, authLoading, profile]); // Added profile to dependency array

  const value = {
    profile,
    loading: loading || authLoading, // Report loading if *either* context is loading
    error,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};