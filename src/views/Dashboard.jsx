// /src/views/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// We'll build this component next
// const CreateHousehold = () => (
//   <div>
//     <h2>Welcome to Momentum</h2>
//     <p>You're not part of a household yet.</p>
//     <button>Create Your First Household</button>
//   </div>
// );

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHouseholds = async () => {
      if (!currentUser) return;
      
      try {
        setError('');
        // This query is now allowed by our new firestore.rules
        const q = query(
          collection(db, 'members'),
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const userMemberships = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMemberships(userMemberships);

      } catch (err) {
        console.error("Failed to fetch households:", err);
        setError('Could not load your data.');
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholds();
  }, [currentUser]); // Re-run if the user changes

  if (loading) {
    return <div>Loading your dashboard...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
        <h1>Momentum</h1>
        <button onClick={logout}>Log Out</button>
      </header>

      <main style={{ padding: '1rem' }}>
        {memberships.length === 0 ? (
          // <CreateHousehold /> 
          <div>
            <h2>Welcome, {currentUser.email}!</h2>
            <p>You're not part of any households yet.</p>
            {/* We'll build this button out next to trigger HH-01 */}
            <button>Create Your First Household</button>
          </div>
        ) : (
          <div>
            <h2>Your Households:</h2>
            <ul>
              {memberships.map(mem => (
                <li key={mem.id}>
                  Household ID: {mem.householdId} (Your Role: {mem.role})
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;