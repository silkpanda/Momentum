// src/views/Dashboard.jsx (Updated)

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch, 
  doc,        
  serverTimestamp 
} from 'firebase/firestore';
import { Link } from 'react-router-dom'; // --- (1) IMPORT Link ---
import CreateHouseholdModal from '../components/CreateHouseholdModal';

// ... (All the functions like fetchHouseholds and handleCreateHousehold are the same)
function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [modalError, setModalError] = useState('');     

  const fetchHouseholds = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');
    try {
      const membersRef = collection(db, 'members');
      const q = query(membersRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const userHouseholds = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHouseholds(userHouseholds);
    } catch (err) {
      console.error('Failed to fetch households:', err);
      setError('Error: Could not load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]); 

  const handleCreateHousehold = async (householdName) => {
    if (!currentUser) return; 

    setIsSubmitting(true);
    setModalError('');
    try {
      const batch = writeBatch(db);
      const householdDocRef = doc(collection(db, 'households'));
      const memberDocRef = doc(db, 'members', `${currentUser.uid}_${householdDocRef.id}`);
      const householdData = {
        name: householdName,
        createdAt: serverTimestamp(),
        ownerId: currentUser.uid, 
      };
      const memberData = {
        userId: currentUser.uid,
        householdId: householdDocRef.id,
        role: 'admin', 
        joinedAt: serverTimestamp(),
        points: 0, 
      };
      batch.set(householdDocRef, householdData); 
      batch.set(memberDocRef, memberData);      
      await batch.commit();
      setIsModalOpen(false);
      fetchHouseholds(); 
    } catch (err) {
      console.error('Error creating household:', err);
      setModalError('Failed to create household. Please try again.');
    } finally {
      setIsSubmitting(false); 
    }
  };

  if (isLoading && households.length === 0) { 
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
          // ... ("Lobby" is the same)
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
          // --- (2) THIS IS THE CHANGE ---
          // Main dashboard for users with households
          <div>
            <h2 className="text-xl font-semibold">Your Households:</h2>
            <ul className="mt-4 space-y-3">
              {households.map(h => (
                <li key={h.id}>
                  <Link 
                    to={`/household/${h.householdId}`} 
                    className="block p-4 bg-bg-primary rounded-md shadow hover:bg-bg-secondary transition-colors"
                  >
                    <span className="font-medium">Go to household: {h.householdId}</span>
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