// src/components/CreateManagedProfileForm.jsx

import React, { useState } from 'react';
import { auth } from '../firebase'; // For getting the auth token

/**
 * A form for Admins to create a "Managed Profile" (a child
 * without an email/auth account) for the household.
 *
 * @param {object} props
 * @param {string} props.householdId - The ID of the household to add this profile to.
 */
function CreateManagedProfileForm({ householdId }) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Please enter a name.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // --- Manual Fetch for createManagedProfile ---
      if (!auth.currentUser) {
        throw new Error("User is not signed in.");
      }

      // 1. Get a fresh auth token
      const token = await auth.currentUser.getIdToken(true);

      // 2. Define our function's URL (dynamic for emulators)
      const isLocal = window.location.hostname === 'localhost';
      const functionUrl = isLocal
        ? `http://127.0.0.1:5001/momentum-9b492/us-central1/createManagedProfile`
        : `https://us-central1-momentum-9b492.cloudfunctions.net/createManagedProfile`;

      // 3. Build and send the manual fetch request
      console.log("Calling createManagedProfile at:", functionUrl);
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            displayName: displayName,
            householdId: householdId
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error ? result.error.message : 'An unknown error occurred.';
        console.error('Server responded with an error:', result);
        throw new Error(errorMessage);
      }
      
      // 4. Success!
      setSuccess(result.result.message); // Show success message from our function
      setDisplayName(''); // Clear the form

    } catch (err)
 {
      console.error('Error creating managed profile:', err);
      setError(err.message); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md bg-bg-primary p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-semibold mb-4">Add a New Child Profile</h3>
      <form onSubmit={handleSubmit}>
        <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2">
          Child's First Name
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-grow px-3 py-2 bg-bg-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-action-primary"
            placeholder="e.g., Sammy"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-action-primary rounded-md text-action-primary-inverted font-medium hover:bg-action-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
        
        {error && <p className="text-sm text-signal-error mt-3">{error}</p>}
        {success && <p className="text-sm text-signal-success mt-3">{success}</p>}
      </form>
    </div>
  );
}

export default CreateManagedProfileForm;