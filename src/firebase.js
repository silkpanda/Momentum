// src/firebase.js (Updated to BYPASS Emulators)

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {

  apiKey: "AIzaSyCfmFfAeh5nkDsUEbdGCjNdO_fDqF2ZACw",

  authDomain: "momentum-9b492.firebaseapp.com",

  projectId: "momentum-9b492",

  storageBucket: "momentum-9b492.firebasestorage.app",

  messagingSenderId: "586333342003",

  appId: "1:586333342003:web:89901ec7ae9787055cd646",

  measurementId: "G-EXB4DVVZ8J"

};


const app = initializeApp(firebaseConfig);

// Export the services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// This checks if we are running the app locally
if (window.location.hostname === 'localhost') {
  
  // --- WE ARE BYPASSING THE EMULATORS ---
  // We're commenting these out to force the app to talk to
  // the real, live Firebase services.
  
  console.log('Connecting to LIVE Firebase services (Emulators Bypassed)...');
  
  // connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  // connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  // connectFirestoreEmulator(db, '127.0.0.1', 8080);
}