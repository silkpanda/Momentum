// src/views/Dashboard.jsx (v4 - Fixed ReferenceError)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase'; 
import { 
  collection, 
  writeBatch, 
  doc,        
  serverTimestamp,
  onSnapshot, // <-- The real-time listener
  updateDoc   // For updating the profile
} from 'firebase/firestore';
// We need this to auto-redirect the user
import { useNavigate } from 'react-router-dom'; 
import CreateHouseholdModal from '../components/CreateHouseholdModal';

function Dashboard() {
  const { currentUser, logout, loading: authLoading } = useAuth(); 
  const navigate = useNavigate(); // Get the redirect function
  
  // isLoading is now for the profile check
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState('');
  
  // The modal state is still needed for new users
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');     

  // This useEffect now has one job:
  // 1. Check if the user has a household.
  // 2. If YES, redirect them to it.
  // 3. If NO, stop loading and show the "Create Household" UI.
  useEffect(() => {
    // Don't run if auth is still loading
    if (authLoading || !currentUser || !currentUser.uid) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    console.log(`v4 onSnapshot: Subscribing to PROFILE doc: ${currentUser.uid}`);
    setIsLoading(true);
    setError('');
    
    const dbInstance = getDb(); 
    if (!dbInstance) {
      setError("Database service not initialized.");
      setIsLoading(false);
      return;
    }

    // Listen to the user's single profile document
    const profileRef = doc(dbInstance, 'profiles', currentUser.uid);
    
    const unsubscribe = onSnapshot(profileRef, (profileSnap) => {
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        
        // --- NEW v4 LOGIC ---
        // Does their profile have a householdId?
        if (profileData.householdId) {
          console.log(`v4: User belongs to household ${profileData.householdId}. Redirecting...`);
          // YES. Redirect them straight to their household dashboard.
          navigate(`/household/${profileData.householdId}`);
        } else {
          // NO. They are a user without a household.
          // Stop loading and show the "Create" UI.
          console.log("v4: Profile exists but has no householdId. Showing 'Create' UI.");
          setIsLoading(false);
        }
        // --- END v4 LOGIC ---

      } else {
        // This is a brand new user, their profile doc doesn't even exist.
        console.log("v4: Profile not found. User is new. Showing 'Create' UI.");
        
        // --- THIS WAS THE BUGGY LINE ---
        // setHouseholds([]); // <-- Removed this line
        // --- END FIX ---

        setIsLoading(false);
      }
    }, (err) => {
      // This is a REAL error
      console.error('--- onSnapshot (Profile): FAILED (REAL ERROR) ---', err.message);
      console.error(err);
      setError('Error: Could not load your profile data.');
      setIsLoading(false);
    });

    // Cleanup the listener
    return () => {
      console.log("v4 onSnapshot: Unsubscribing from profile.");
      unsubscribe();
    };
  }, [currentUser, authLoading, navigate]); // Add navigate to dependencies
  
  // This function is now refactored for the v4 "single household" model
  const handleCreateHousehold = async (householdName) => {
    if (!currentUser) return; 

    setIsSubmitting(true);
    setModalError('');
    const profileId = currentUser.uid; // This is also the profile doc ID
    const dbInstance = getDb(); 
    if (!dbInstance) {
      setModalError("Database service not initialized.");
      setIsSubmitting(false);
      return;
    }

    try {
      const batch = writeBatch(dbInstance); 
      
      // 1. Create/update the Profile doc
      const profileDocRef = doc(dbInstance, 'profiles', profileId);
      batch.set(profileDocRef, {
        authUserId: currentUser.uid,
        name: currentUser.email || 'New User',
        isManaged: false
        // NOTE: We do NOT add the householdId here, we do it after
      }, { merge: true }); 

      // 2. Create the new Household doc
      const householdDocRef = doc(collection(dbInstance, 'households'));
      batch.set(householdDocRef, {
        name: householdName,
        createdAt: serverTimestamp(),
        ownerId: profileId,
      });
      
      // 3. Create the new Member doc (linking profile to household as admin)
      const memberDocRef = doc(dbInstance, 'members', `${profileId}_${householdDocRef.id}`);
      batch.set(memberDocRef, {
        profileId: profileId,
        householdId: householdDocRef.id,
        role: 'admin', 
        joinedAt: serverTimestamp(),
        points: 0,
      });

      // Commit the core documents
      await batch.commit();
      
      // 4. SECOND operation: Update the profile with the new single householdId
      // This is what our listener is waiting for!
      await updateDoc(profileDocRef, {
        householdId: householdDocRef.id
      });
      
      // All done. Close the modal. 
      // The onSnapshot listener will see the profile change and
      // trigger the redirect to the new household automatically.
      setIsModalOpen(false);

    } catch (err) {
      console.error('Error creating household:', err.message);
      setModalError('Failed to create household. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER LOGIC ---

  // Show loading while we check the profile
  if (isLoading || authLoading) { 
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bg-canvas text-text-primary">
        Loading your dashboard...
      </div>
    );
  }

  // Show error if the listener failed
  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bg-canvas text-signal-error">
        {error}
      </div>
    );
  }

  // If we're NOT loading, and NOT erroring, and NOT redirecting,
  // it means the user has no household. Show the "Create" UI.
  return (
    <div className="w-full min-h-screen p-8 bg-bg-canvas text-text-primary">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-bg-secondary rounded-md text-text-primary font-medium hover:bg-border-primary"
        >
          Log Out
        </button>
      </header>

      <main>
        <div className="max-w-md mx-auto mt-20 text-center bg-bg-primary p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Welcome to Momentum!</h2>
          <p className="text-text-secondary mb-6">
            It looks like you don't have a household yet. Get started by creating one!
          </p>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalError(''); 
            }}
            className="w-full px-6 py-3 bg-action-primary text-action-primary-inverted font-semibold rounded-md hover:bg-action-primary-hover"
          >
            Create Your First Household
          </button>
        </div>
      </main>
      
      <CreateHouseholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateHousehold}
        isSubmitting={isSubmitting}
        error={modalError}
      />
    </div>
  );
}

export default Dashboard;