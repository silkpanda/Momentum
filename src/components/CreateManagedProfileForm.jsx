// src/components/CreateManagedProfileForm.jsx (FIXED)

import React, { useState } from 'react';
// --- FIX START ---
import { functions } from '../firebase';
// --- FIX END ---
import { httpsCallable } from 'firebase/functions';

// Prepare the Cloud Function reference once
const createManagedProfile = httpsCallable(functions, 'createManagedProfile');

// --- Accept optimistic functions ---
function CreateManagedProfileForm({ householdId, addOptimisticMember, removeOptimisticMember }) {
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

    // --- 1. Optimistic Update ---
    // Add temporary member to parent state and get its temp ID
    const tempName = displayName; // Save name before clearing input
    const tempId = addOptimisticMember(tempName);
    setDisplayName(''); // Clear input immediately
    // --- End Optimistic Update ---

    try {
      // --- 2. Background Sync ---
      console.log("CreateManagedProfileForm: Calling 'createManagedProfile'...");

      const result = await createManagedProfile({
          displayName: tempName, // Use the saved name
          householdId: householdId
      });
      // --- End Background Sync ---

      // ... rest of logic for success/failure is the same
      if (result.data.success) {
        console.log("CreateManagedProfileForm: Success:", result.data.message);
      } else {
        // --- 4. Handle Backend Failure (Rollback) ---
        console.error("CreateManagedProfileForm: Function returned error:", result.data.message);
        setError(result.data.message || 'Failed to create profile.');
        removeOptimisticMember(tempId);
      }

    } catch (err) {
      // --- 4. Handle Network/Function Call Failure (Rollback) ---
      console.error('Error creating managed profile:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      removeOptimisticMember(tempId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md bg-bg-primary p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-semibold mb-4">Add a New Child Profile</h3>
       <p className="text-sm text-text-secondary mb-4">
        Create a profile for a child. They won't have their own login.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="displayName" className="block text-sm font-medium text-text-primary mb-2 sr-only">
          Child's First Name
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="flex-grow px-3 py-2 bg-bg-secondary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-action-primary"
            placeholder="e.g., Sammy"
            disabled={isSubmitting}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-action-primary text-action-primary-inverted font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Profile'}
          </button>
        </div>

        {error && <p className="text-sm text-signal-error mt-3">{error}</p>}
      </form>
    </div>
  );
}

export default CreateManagedProfileForm;