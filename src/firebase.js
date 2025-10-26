// src/firebase.js (Updated to use Emulators)

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth"; // --- (1) IMPORT ---
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"; // --- (2) IMPORT ---

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // (Keep your actual keys)
  authDomain: "momentum-9b492.firebaseapp.com",
  projectId: "momentum-9b492",
  storageBucket: "momentum-9b492.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// --- (3) THIS IS THE MAGIC ---
// This checks if we are running the app locally
if (window.location.hostname === 'localhost') {
  console.log('Connecting to local emulators...');
  
  // Connect to the local Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099');
  
  // Connect to the local Functions emulator
  connectFunctionsEmulator(functions, 'localhost', 5001);
}