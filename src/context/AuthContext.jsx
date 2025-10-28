// src/context/AuthContext.jsx (With Extra Logging)

import React, { useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { getFirebaseAuth } from '../firebase'; // <-- CORRECT IMPORT

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthContext: Provider rendering, initial loading: true');

  function signup(email, password) {
    console.log('AuthContext: signup() function called.');
    const authInstance = getFirebaseAuth(); // <-- Get instance
    if (!authInstance) {
      console.error("AuthContext: signup() FAILED - Auth not initialized.");
      return Promise.reject(new Error("Auth service not ready."));
    }
    return createUserWithEmailAndPassword(authInstance, email, password);
  }

  function login(email, password) {
    console.log('AuthContext: login() function called.');
    const authInstance = getFirebaseAuth(); // <-- Get instance
    if (!authInstance) {
      console.error("AuthContext: login() FAILED - Auth not initialized.");
      return Promise.reject(new Error("Auth service not ready."));
    }
    return signInWithEmailAndPassword(authInstance, email, password);
  }

  function logout() {
    console.log('AuthContext: logout() function called.');
    const authInstance = getFirebaseAuth(); // <-- Get instance
    if (!authInstance) {
      console.error("AuthContext: logout() FAILED - Auth not initialized.");
      return Promise.reject(new Error("Auth service not ready."));
    }
    return signOut(authInstance);
  }

  useEffect(() => {
    console.log('AuthContext: useEffect subscribing to onAuthStateChanged...');
    const authInstance = getFirebaseAuth(); // <-- Get instance
    
    if (!authInstance) {
      console.error("AuthContext: useEffect FAILED - Auth not initialized!");
      setLoading(false);
      return;
    }

    console.log("AuthContext: ...auth instance found. Attaching listener.");
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