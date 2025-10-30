// src/components/CreateManagedProfileForm.jsx (REFACTORED for SUPABASE)

import React, { useState } from 'react';
// FIX: Remove Firebase Functions imports
// import { functions } from '../firebase';
// import { httpsCallable } from 'firebase/functions';
import { supabase } from '../supabaseClient'; 

// NOTE: We will use supabase.rpc('create_managed_profile') here.

// Accept optimistic functions from parent
function CreateManagedProfileForm({ householdId, addOptimisticMember, removeOptimisticMember }) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STUB: Replace the Firebase callable function setup
  // const createManagedProfile = httpsCallable(functions, 'createManagedProfile');

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
    const tempName = displayName;
    const tempId = addOptimisticMember(tempName);
    setDisplayName('');
    // --- End Optimistic Update ---

    try {
      console.log("Calling Supabase RPC: create_managed_profile (STUBBED)");

      // CRITICAL FIX: Replace Cloud Function call with Supabase RPC
      // const { data, error: rpcError } = await supabase.rpc('create_managed_profile', {
      //     h_id: householdId,
      //     p_display_name: tempName
      // });
      
      // STUB: Simulate success for now
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // if (rpcError) throw rpcError;
      
      console.log("Managed Profile created successfully (STUB).");
      setSuccess(`${tempName} profile created!`);

    } catch (err) {
      console.error('Error creating managed profile:', err);
      setError(err.message || 'Failed to create profile. Supabase RPC is stubbed.');
      removeOptimisticMember(tempId); // Rollback optimistic update
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
      {/* ... rest of the form UI remains ... */}
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
        {success && <p className="text-sm text-signal-success mt-3">{success}</p>}
      </form>
    </div>
  );
}

export default CreateManagedProfileForm;