// src/firebase.js (Updated)

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"; 

// Your real config
const firebaseConfig = {
  apiKey: "AIzaSyCfmFfAeh5nkDsUEbdGCjNdO_fDqF2ZACw",
  authDomain: "momentum-9b492.firebaseapp.com",
  projectId: "momentum-9b492",
  storageBucket: "momentum-9b492.appspot.com", // (Fixed typo here)
  messagingSenderId: "586333342003",
  appId: "1:586333342003:web:89901ec7ae9787055cd646",
  measurementId: "G-EXB4DVVZ8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize all services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Emulator connection logic
if (window.location.hostname === 'localhost') {
  console.log('Connecting to local emulators...');
  
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFunctionsEmulator(functions, 'localhost', 5001);
  
  // --- THIS IS THE FIX ---
  connectFirestoreEmulator(db, 'localhost', 8081);
  // --- (was 8080) ---
}