// src/components/CreateManagedProfileForm.jsx (With Optimistic UI)

import React, { useState } from 'react';
import { getFunctionsInstance } from '../firebase';
import { httpsCallable } from 'firebase/functions';

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
    const tempId = addOptimisticMember(displayName);
    setDisplayName(''); // Clear input immediately
    // --- End Optimistic Update ---

    try {
      // --- 2. Background Sync ---
      const functionsInstance = getFunctionsInstance();
      if (!functionsInstance) throw new Error("Functions service not initialized yet.");

      console.log("CreateManagedProfileForm: Calling 'createManagedProfile'...");
      const createManagedProfile = httpsCallable(functionsInstance, 'createManagedProfile');
      const result = await createManagedProfile({
          displayName: displayName,
          householdId: householdId
      });
      // --- End Background Sync ---

      // --- 3. Handle Success ---
      if (result.data.success) {
        console.log("CreateManagedProfileForm: Success:", result.data.message);
        // Don't need to set success message, UI already updated.
        // The real listener will eventually replace the temp entry.
        // setSuccess(result.data.message || 'Profile created successfully!');
      } else {
        // --- 4. Handle Backend Failure (Rollback) ---
        console.error("CreateManagedProfileForm: Function returned error:", result.data.message);
        setError(result.data.message || 'Failed to create profile.');
        // Remove the optimistic entry
        removeOptimisticMember(tempId);
        // --- End Rollback ---
      }

    } catch (err) {
      // --- 4. Handle Network/Function Call Failure (Rollback) ---
      console.error('Error creating managed profile:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      // Remove the optimistic entry
      removeOptimisticMember(tempId);
      // --- End Rollback ---
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
            // Style update: Use primary action color for create
            className="px-4 py-2 bg-action-primary text-action-primary-inverted font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Profile'}
          </button>
        </div>

        {error && <p className="text-sm text-signal-error mt-3">{error}</p>}
        {/* Success message might be less necessary with optimistic UI */}
        {/* {success && <p className="text-sm text-signal-success mt-3">{success}</p>} */}
      </form>
    </div>
  );
}

export default CreateManagedProfileForm;