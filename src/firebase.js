// src/firebase.js (Corrected)

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCfmFfAeh5nkDsUEbdGCjNdO_fDqF2ZACw",
  authDomain: "momentum-9b492.firebaseapp.com",
  projectId: "momentum-9b492",
  storageBucket: "momentum-9b492.firebasestorage.app",
  messagingSenderId: "586333342003",
  appId: "1:586333342003:web:89901ec7ae9787055cd646",
  measurementId: "G-EXB4DVVZ8J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// This checks if we are running the app locally
if (window.location.hostname === 'localhost') {
  console.log('Connecting to local emulators...');
  
  // Connect to the local Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099');
  
  // Connect to the local Functions emulator
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// (The extra '}' that was here is now removed)