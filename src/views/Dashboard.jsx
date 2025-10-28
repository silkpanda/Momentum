// src/views/Dashboard.jsx (Fixed Syntax Error)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDb } from '../firebase'; 
import { 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch, 
  doc,        
  serverTimestamp,
  documentId 
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import CreateHouseholdModal from '../components/CreateHouseholdModal';

function Dashboard() {
  const { currentUser, logout, loading: authLoading } = useAuth(); 
  const [households, setHouseholds] = useState([]);
  const [isLoading, setIsLoading] = useState(authLoading); 
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- THIS IS THE FIX ---
  const [isSubmitting, setIsSubmitting] = useState(false); // Removed extra '=' sign
  // --- END FIX ---
  const [modalError, setModalError] = useState('');     

  const fetchHouseholds = useCallback(async () => {
    if (authLoading || !currentUser || !currentUser.uid) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    console.log(`fetchHouseholds: RUNNING for user: ${currentUser.uid}`);
    setIsLoading(true);
    setError('');
    
    try {
      const dbInstance = getDb(); 
      if (!dbInstance) throw new Error("Database service not initialized.");

      const membersRef = collection(dbInstance, 'members'); 
      const q = query(membersRef, where('profileId', '==', currentUser.uid));
      
      const querySnapshot = await getDocs(q);
      const userMembers = querySnapshot.docs.map(d => ({ docId: d.id, ...d.data() }));

      const householdIds = userMembers.map(member => member.householdId);
      console.log(`fetchHouseholds: Found ${householdIds.length} household(s).`);

      if (householdIds.length > 0) {
        const householdsRef = collection(dbInstance, 'households'); 
        const householdsQuery = query(householdsRef, where(documentId(), 'in', householdIds));
        
        const householdSnap = await getDocs(householdsQuery);
        const householdsData = householdSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const finalHouseholds = userMembers.map(member => {
          const householdData = householdsData.find(h => h.id === member.householdId);
          return { ...member, ...householdData };
        });

        setHouseholds(finalHouseholds);
      } else {
        setHouseholds([]);
      }
      
    } catch (err) {
      console.error('--- fetchHouseholds: FAILED ---', err.message);
      console.error(err);
      setError('Error: Could not load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, authLoading]); 

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]); 
  
  const handleCreateHousehold = async (householdName) => {
    if (!currentUser) return; 

    setIsSubmitting(true);
    setModalError('');
    const profileId = currentUser.uid;
    const dbInstance = getDb(); 
    if (!dbInstance) {
      setModalError("Database service not initialized.");
      setIsSubmitting(false);
      return;
    }

    try {
      const batch = writeBatch(dbInstance); 
      
      const profileDocRef = doc(dbInstance, 'profiles', profileId);
      batch.set(profileDocRef, {
        authUserId: currentUser.uid,
        name: currentUser.email || 'New User',
        isManaged: false
      }, { merge: true });

      const householdDocRef = doc(collection(dbInstance, 'households'));
      batch.set(householdDocRef, {
        name: householdName,
        createdAt: serverTimestamp(),
        ownerId: profileId,
      });
      
      const memberDocRef = doc(dbInstance, 'members', `${profileId}_${householdDocRef.id}`);
      batch.set(memberDocRef, {
        profileId: profileId,
        householdId: householdDocRef.id,
        role: 'admin', 
        joinedAt: serverTimestamp(),
        points: 0,
      });

      await batch.commit();
      
      setIsModalOpen(false);
      fetchHouseholds(); 
    } catch (err) {
      console.error('Error creating household:', err.message);
      setModalError('Failed to create household. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) { 
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bg-canvas text-text-primary">
        Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bg-canvas text-signal-error">
        {error}
      </div>
    );
  }

  return (
    // ... JSX is the same ...
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
        {households.length === 0 ? (
          <div className="max-w-md mx-auto mt-20 text-center bg-bg-primary p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Welcome to Momentum!</h2>
            <p className="text-text-secondary mb-6">
              It looks like you're not part of a household yet. Get started by creating one
              or by asking an admin of an existing household to send you an invite.
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
        ) : (
          <div>
            <h2 className="text-xl font-semibold">Your Households:</h2>
            <ul className="mt-4 space-y-3">
              {households.map(h => (
                <li key={h.householdId}>
                  <Link 
                    to={`/household/${h.householdId}`} 
                    className="block p-4 bg-bg-primary rounded-md shadow hover:bg-bg-secondary transition-colors"
                  >
                    <span className="font-medium">{h.name || h.householdId}</span> 
                    <span className="block text-sm text-text-secondary">Your Role: {h.role}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
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