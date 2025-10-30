// src/context/AuthContext.jsx (REFACTORED FOR SUPABASE)

import React, { createContext, useContext, useState, useEffect } from 'react';
// IMPORT FIX: Use the new Supabase client instead of Firebase imports
import { supabase } from '../supabaseClient'; 

// Create the context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  // currentUser now holds the Supabase Session object's user details
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Core Supabase Authentication Methods ---

  const signup = async (email, password) => {
    // Supabase sign-up automatically creates an auth.users record
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password 
    });
    if (error) throw error;
    return data;
  };

  const login = async (email, password) => {
    // Supabase sign-in also returns session/user data
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    // Supabase simple sign-out
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // --- State Synchronization (Supabase Auth Listener) ---

  useEffect(() => {
    // Subscribes to changes in the authentication state
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // session.user is the authenticated user object (from auth.users table)
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Initial check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setCurrentUser(session?.user ?? null);
        setLoading(false);
    });

    // Clean up the listener when the component unmounts (Firebase cleanup equivalent)
    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};