// src/components/InviteMemberForm.jsx (Corrected)

import React, { useState } from 'react';
// --- FIX ---
// Import the *correct* getter function name from firebase.js
import { getFunctionsInstance } from '../firebase';
// --- END FIX ---
import { httpsCallable } from 'firebase/functions';

function InviteMemberForm({ householdId }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // --- FIX ---
      // Get the functions instance using the correct getter
      console.log("InviteMemberForm: Getting functions instance...");
      const functionsInstance = getFunctionsInstance();
      // --- END FIX ---
      
      if (!functionsInstance) {
        console.error("InviteMemberForm: Functions not initialized");
        throw new Error("Functions not initialized");
      }
      console.log("InviteMemberForm: Functions instance OK. Calling 'inviteUserToHousehold'...");

      const inviteUser = httpsCallable(functionsInstance, 'inviteUserToHousehold');
      
      const result = await inviteUser({
        email: email,
        householdId: householdId,
      });

      console.log("InviteMemberForm: Function returned success:", result.data.message);
      setSuccess(result.data.message);
      setEmail(''); 

    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err.message); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md bg-bg-primary p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-semibold mb-4">Invite New Member (Parent)</h3>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
          User's Email
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-grow px-3 py-2 bg-bg-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-action-primary"
            placeholder="friend@example.com"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-action-primary rounded-md text-action-primary-inverted font-medium hover:bg-action-primary-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Invite'}
          </button>
        </div>
        
        {error && <p className="text-sm text-signal-error mt-3">{error}</p>}
        {success && <p className="text-sm text-signal-success mt-3">{success}</p>}
      </form>
    </div>
  );
}

export default InviteMemberForm;