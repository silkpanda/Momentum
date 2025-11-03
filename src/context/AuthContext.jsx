import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // Corrected import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext: useEffect triggered. Setting up onAuthStateChange listener.');

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`AuthContext: onAuthStateChange event fired: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          console.log('AuthContext: User is signed in or session updated. Setting user:', session.user);
          setCurrentUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: User signed out. Setting user to null.');
          setCurrentUser(null);
        }
        
        // This is the first time the listener runs
        if (event === 'INITIAL_SESSION') {
           console.log('AuthContext: Initial session processed. User:', session?.user);
           setCurrentUser(session?.user || null);
        }

        console.log('AuthContext: Auth state change processed. Setting auth loading to false.');
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthContext: useEffect cleanup. Unsubscribing from onAuthStateChange.');
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- FUNCTIONS ADDED BACK ---
  const login = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password) => {
    // Note: You'll need to handle the profile creation trigger separately
    // This just creates the auth user.
    return supabase.auth.signUp({ email, password });
  };
  // --------------------------

  const value = {
    currentUser,
    loading,
    signOut: () => supabase.auth.signOut(),
    login,  // <-- FIXED: Added back
    signUp, // <-- FIXED: Added back
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};