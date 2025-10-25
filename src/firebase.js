// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

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

// Initialize and export our services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;