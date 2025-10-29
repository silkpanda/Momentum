// src/context/AuthContext.jsx (Corrected)

import React, { useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Import our services

// Create the context
const AuthContext = React.createContext();

// Hook for child components to consume the context
export function useAuth() {
  return useContext(AuthContext);
}

// The Provider component that will wrap our app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state

  // --- SIGNUP (AUTH-01) ---
  // This does TWO things:
  // 1. Creates the user in Firebase Auth
  // 2. Creates the user document in our 'users' Firestore collection
  async function signup(email, password, firstName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create the user doc in Firestore
    // This satisfies the security rule we wrote (must have 'createdAt')
    return setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      firstName: firstName,
      createdAt: serverTimestamp()
    });
  }

  // --- LOGIN (AUTH-02) ---
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // --- LOGOUT ---
  function logout() {
    return signOut(auth);
  }

  // --- AUTH LISTENER ---
  // This is the magic. It listens to Firebase for auth changes
  // and updates our app's state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false); // Auth state is now confirmed
    });

    // Cleanup function to unsubscribe when component unmounts
    return unsubscribe;
  }, []);

  // The value we pass down to all children
  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  // Don't render the app until we've confirmed the auth state
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// (The extra '}' that was here is now removed)