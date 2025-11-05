// src/context/AuthContext.jsx (FIXED: Infinite loop)

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Ensure this path is correct

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      // We set loading to false here too, in case the listener fires first
      if (loading) setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };

    // --- THIS IS THE FIX ---
    // The dependency array must be empty [] so this effect
    // runs only ONCE on mount.
    // Having [loading] in the array caused an infinite loop.
  }, []);
  // -----------------------

  const login = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signup = (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const logout = () => {
    return supabase.auth.signOut();
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}