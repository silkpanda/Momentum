// src/context/AuthContext.jsx (Updated with Getter)

import React, { useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
// --- 1. IMPORT THE GETTER, NOT 'auth' ---
import { getFirebaseAuth } from '../firebase'; 

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext: Provider rendering, initial loading: true');

  function signup(email, password) {
    // --- 2. USE THE GETTER FUNCTION ---
    return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  }

  function login(email, password) {
    console.log('AuthContext: login() function called.');
    // --- 3. USE THE GETTER FUNCTION ---
    return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }

  function logout() {
    // --- 4. USE THE GETTER FUNCTION ---
    return signOut(getFirebaseAuth());
  }

  useEffect(() => {
    console.log('AuthContext: useEffect subscribing to onAuthStateChanged');
    // --- 5. USE THE GETTER FUNCTION ---
    const authInstance = getFirebaseAuth(); 
    if (!authInstance) {
      console.error("AuthContext: Auth service not initialized!");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (user) {
        console.log(`AuthContext: onAuthStateChanged - USER FOUND. UID: ${user.uid}`);
        setCurrentUser(user);
      } else {
        console.log('AuthContext: onAuthStateChanged - USER IS NULL.');
        setCurrentUser(null);
      }
      console.log('AuthContext: onAuthStateChanged - SETTING LOADING = FALSE');
      setLoading(false);
    });

    return () => {
      console.log('AuthContext: useEffect cleanup, unsubscribing');
      unsubscribe();
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
      {children}
    </AuthContext.Provider>
  );
}