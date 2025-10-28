import { initializeApp } from 'firebase/app';
import { getAuth /* connectAuthEmulator */ } from 'firebase/auth'; // Emulator connection removed/commented
import { 
  // initializeFirestore, // Keep standard initialization for live
  // connectFirestoreEmulator, 
  getFirestore 
} from 'firebase/firestore';
import { 
  getFunctions /* connectFunctionsEmulator */ // Emulator connection removed/commented
} from 'firebase/functions';

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

console.log('firebase.js: File loaded. Preparing LIVE connection.');

export const app = initializeApp(firebaseConfig);
console.log("Firebase App initialized (LIVE).");

// --- Define local (non-exported) variables ---
let auth;
let db;
let functions;

// --- Initialize services immediately for LIVE connection ---
try {
  auth = getAuth(app);
  console.log("Firebase Auth service fetched (LIVE).");

  // Use standard getFirestore for live connection
  db = getFirestore(app);
  console.log("Firestore service fetched (LIVE).");

  // Specify region if your functions aren't in us-central1
  functions = getFunctions(app, 'us-central1'); 
  console.log("Firebase Functions service fetched (LIVE).");

} catch (error) {
  console.error("Error initializing Firebase LIVE services:", error);
  // Depending on the error, you might want to show a message to the user
}


// --- EXPORT GETTER FUNCTIONS (Still useful) ---
export const getFirebaseAuth = () => {
    if (!auth) console.error("getFirebaseAuth called before auth was initialized!");
    return auth;
};
export const getDb = () => {
    if (!db) console.error("getDb called before db was initialized!");
    return db;
};
export const getFunctionsInstance = () => {
    if (!functions) console.error("getFunctionsInstance called before functions was initialized!");
    return functions;
};

// --- EMULATOR CONNECTION FUNCTION (Now does nothing) ---
// We keep the export so main.jsx doesn't break, but it's empty.
export const connectEmulators = () => {
  console.log("connectEmulators called - SKIPPING for LIVE connection.");
  // --- ALL EMULATOR CONNECTIONS ARE REMOVED/COMMENTED ---
  // connectAuthEmulator(auth, 'http://localhost:9090');
  // connectFirestoreEmulator(db, 'localhost', 5001);
  // connectFunctionsEmulator(functions, 'localhost', 9099);
};


// Async function (matching your previous structure, but less critical now)
// This doesn't really do the initialization anymore but confirms services are ready
export async function initializeServices() {
    console.log("firebase.js: initializeServices() called (LIVE check).");
    if (!auth || !db || !functions) {
        console.error("Firebase services failed to initialize!");
        // Handle this critical failure - maybe show an error overlay?
        throw new Error("Firebase services failed to initialize.");
    }
    // We don't need to connect emulators
    // We don't need the ping test for the live service
    console.log('firebase.js: LIVE services confirmed ready.');
}