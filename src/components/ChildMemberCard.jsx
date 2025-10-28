// src/components/ChildMemberCard.jsx

import React, { useState } from 'react';
import { auth } from '../firebase'; // We need auth for the token

/**
 * A card component that displays a child member's info and
 * allows an admin to set their active household.
 *
 * @param {object} props
 * @param {object} props.member - The 'members' collection document data.
 * @param {object} props.userData - The 'users' collection document data for this member.
 * @param {string} props.householdId - The ID of the household we are currently viewing.
 */
function ChildMemberCard({ member, userData, householdId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if this child is already active in this household.
  const isActive = userData.activeHouseholdId === householdId;

  const handleSetLocation = async () => {
    setIsLoading(true);
    setError('');

    try {
      // --- Manual Fetch for setChildActiveLocation ---
      if (!auth.currentUser) {
        throw new Error("User is not signed in.");
      }

      // 1. Get a fresh auth token
      console.log("Forcing auth token refresh...");
      const token = await auth.currentUser.getIdToken(true);
      console.log("Token refresh complete.");

      // 2. Define our function's URL (dynamic for emulators)
      const isLocal = window.location.hostname === 'localhost';
      const functionUrl = isLocal
        ? `http://127.0.0.1:5001/momentum-9b492/us-central1/setChildActiveLocation`
        : `https://us-central1-momentum-9b492.cloudfunctions.net/setChildActiveLocation`;

      // 3. Build and send the manual fetch request
      console.log("Calling setChildActiveLocation at:", functionUrl);
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            childUserId: member.userId, // The UID of the child
            targetHouseholdId: householdId // The ID of this household
          }
        })
      });

      console.log("Fetch response status:", response.status);
      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error ? result.error.message : 'An unknown error occurred.';
        console.error('Server responded with an error:', result);
        throw new Error(errorMessage);
      }
      
      // 4. Success!
      console.log(result.result.message);
      // We don't need to do anything else. The dashboard's
      // real-time listener (which we'll add next) will see
      // the 'users' doc change and re-render everything.

    } catch (err) {
      console.error('Error setting child location:', err);
      setError(err.message); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-bg-secondary p-4 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-text-primary">{member.email}</h4>
        <p className="text-sm text-text-secondary">
          Status: {isActive ? (
            <span className="font-medium text-signal-success">Active Here</span>
          ) : (
            <span className="font-medium text-text-disabled">At Other Household</span>
          )}
        </p>
      </div>
      <button
        onClick={handleSetLocation}
        disabled={isActive || isLoading}
        className="px-4 py-2 bg-action-primary rounded-md text-action-primary-inverted font-medium hover:bg-action-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Setting...' : (isActive ? 'Active' : 'Set as Active')}
      </button>
      {error && <p className="text-sm text-signal-error mt-2 w-full">{error}</p>}
    </div>
  );
}

export default ChildMemberCard;