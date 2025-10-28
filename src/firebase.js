// src/firebase.js (Updated with Getters)

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  connectAuthEmulator 
} from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { 
  getFunctions, 
  connectFunctionsEmulator 
} from "firebase/functions";

// Config is the same
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // (Keep your actual keys)
  authDomain: "momentum-9b492.firebaseapp.com",
  projectId: "momentum-9b492",
  storageBucket: "momentum-9b492.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

console.log('firebase.js: File loaded.');
export const app = initializeApp(firebaseConfig);

// --- 1. DEFINE LOCAL (NON-EXPORTED) VARIABLES ---
let auth;
let db;
let functions;

// --- 2. EXPORT GETTER FUNCTIONS ---
export const getFirebaseAuth = () => auth;
export const getDb = () => db;
export const getFunctionsInstance = () => functions;

// --- 3. INITIALIZE AND ASSIGN THE VARIABLES ---
export async function initializeServices() {
  // Assign the local variables
  auth = getAuth(app);
  functions = getFunctions(app, 'us-central1');
  db = getFirestore(app);

  if (window.location.hostname === 'localhost') {
    console.log('firebase.js: initializeServices() CALLED. Connecting emulators...');
    try {
      // Connect all emulators
      connectAuthEmulator(auth, 'http://localhost:9090');
      connectFunctionsEmulator(functions, 'localhost', 9099);
      connectFirestoreEmulator(db, 'localhost', 5001);
      console.log('firebase.js: Emulators configured. Pinging Firestore...');
      
      // Ping Firestore to wait for full connection
      await getDoc(doc(db, "__test-connection__", "ping"));
      
      console.log('firebase.js: Firestore ping successful. All services ready.');
    } catch (e) {
      if (e.code === 'unavailable') {
         console.error('firebase.js: !!! FIRESTORE EMULATOR IS NOT RESPONDING !!!', e);
         throw e; // This is a fatal error
      }
      // The 404 error from the ping is normal and means it connected
      console.log('firebase.js: Firestore ping successful (ignoring 404). All services ready.');
    }
  } else {
    console.log('firebase.js: Production services initialized.');
  }
}