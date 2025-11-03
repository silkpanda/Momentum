// src/context/AuthContext.jsx (FIXED: Added 'useRef' guard to prevent fetch race condition)

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true

  // 🛠️ FIX: Add a ref to track if a fetch is already in progress.
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    console.log('AXIOM LOG: [AuthContext] Subscribing to auth state changes.');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AXIOM LOG: [AuthContext] onAuthStateChange event: ${event}`);
        const currentUser = session?.user || null;
        
        // setUser(currentUser) is fine to call multiple times.
        setUser(currentUser); 

        // 🛠️ FIX: Check the guard rail.
        // If a fetch is already running, do NOT start another one.
        if (currentUser && !fetchInProgressRef.current) {
          // User is logged in, fetch their profile
          console.log(`AXIOM LOG: [AuthContext] User found. Fetching profile...`);
          
          // 🛠️ FIX: Set the guard rail
          fetchInProgressRef.current = true;
          setLoading(true); 
          
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('auth_user_id', currentUser.id)
              .single();
            
            if (error) {
              console.error('AXIOM ERROR: [AuthContext] Error fetching profile', error);
              setUserProfile(null);
            } else {
              console.log('AXIOM LOG: [AuthContext] userProfile successfully SET.');
              setUserProfile(data);
            }
          } catch (err) {
            console.error('AXIOM ERROR: [AuthContext] Exception in fetchUserProfile', err);
            setUserProfile(null);
          } finally {
            console.log('AXIOM LOG: [AuthContext] Profile fetch complete. Setting loading = false.');
            setLoading(false); 
            // 🛠️ FIX: Release the guard rail *after* loading is false
            fetchInProgressRef.current = false;
          }
        } else if (!currentUser) {
          // User is logged out
          console.log('AXIOM LOG: [AuthContext] No user. Clearing profile and loading.');
          setUserProfile(null);
          setLoading(false);
          fetchInProgressRef.current = false; // Clear guard rail on logout
        } else {
          console.log('AXIOM LOG: [AuthContext] Fetch already in progress. Skipping duplicate request.');
        }
      }
    );

    return () => {
      console.log('AXIOM LOG: [AuthContext] Unsubscribing from auth state changes.');
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array. This runs only once.


  const value = {
    user,
    userProfile,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    logout: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}