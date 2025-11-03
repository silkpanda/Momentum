// src/context/AuthContext.jsx (FIXED: Robust profile fetching and loading)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true

  // This is the ONLY effect managing auth state.
  // It's much simpler and loop-proof.
  useEffect(() => {
    console.log('AXIOM LOG: [AuthContext] Subscribing to auth state changes.');
    
    // onAuthStateChange fires *immediately* with the current session
    // or 'SIGNED_OUT' if there isn't one.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AXIOM LOG: [AuthContext] onAuthStateChange event: ${event}`);
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          // User is logged in, fetch their profile
          console.log(`AXIOM LOG: [AuthContext] User found. Fetching profile...`);
          setLoading(true); // 🛠️ Set loading TRUE while we fetch
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
            setLoading(false); // 🛠️ Set loading FALSE only after fetch is done
          }
        } else {
          // User is logged out
          console.log('AXIOM LOG: [AuthContext] No user. Clearing profile and loading.');
          setUserProfile(null);
          setLoading(false);
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
    // 🛠️ FIX: Use 'login' to match Login.jsx
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    logout: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}