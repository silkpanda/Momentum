// src/views/HouseholdDashboard.jsx (NEW FILE)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import InviteMemberForm from '../components/InviteMemberForm';

function HouseholdDashboard() {
  const { householdId } = useParams(); // Gets the ID from the URL
  const { currentUser } = useAuth();
  const [household, setHousehold] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHouseholdData = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      
      try {
        // TODO: Check if user is actually a member of this household (for security)
        // For now, just fetch the household's public data

        const householdRef = doc(db, 'households', householdId);
        const householdSnap = await getDoc(householdRef);

        if (householdSnap.exists()) {
          setHousehold({ id: householdSnap.id, ...householdSnap.data() });
        } else {
          setError('Household not found.');
        }
      } catch (err) {
        console.error('Failed to fetch household:', err);
        setError('Error: Could not load household data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHouseholdData();
  }, [householdId, currentUser]);

  if (isLoading) {
    return <div className="p-8">Loading household...</div>;
  }

  if (error) {
    return <div className="p-8 text-signal-error">{error}</div>;
  }

  return (
    <div className="w-full min-h-screen p-8 bg-bg-canvas text-text-primary">
      <header className="mb-12">
        <Link to="/dashboard" className="text-sm text-action-primary hover:underline">
          &larr; Back to All Households
        </Link>
        <h1 className="text-3xl font-semibold mt-2">
          {household ? household.name : 'Household'}
        </h1>
      </header>

      <main>
        {/* We'll add lists of members and tasks here later */}
        
        {/* --- Render the Invite Form --- */}
        <InviteMemberForm householdId={householdId} />

      </main>
    </div>
  );
}

export default HouseholdDashboard;