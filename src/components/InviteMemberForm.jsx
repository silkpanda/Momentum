// src/components/InviteMemberForm.jsx (Fixed with Getter)

import React, { useState } from 'react';
// --- 1. IMPORT GETTER ---
import { getFunctionsInstance } from '../firebase'; 
import { httpsCallable } from 'firebase/functions';

/**
 * A form for inviting a new member to a specific household.
 * @param {object} props
 * @param {string} props.householdId - The ID of the household to invite to.
 */
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
      // --- 2. GET FUNCTIONS INSTANCE ---
      const functionsInstance = getFunctionsInstance();
      if (!functionsInstance) throw new Error("Functions not initialized");

      // 3. Get a reference to our cloud function
      const inviteUser = httpsCallable(functionsInstance, 'inviteUserToHousehold');
      
      // 4. Call it with the data it needs
      const result = await inviteUser({
        email: email,
        householdId: householdId,
      });

      // 5. Show the success message from the server
      setSuccess(result.data.message);
      setEmail(''); // Clear the form

    } catch (err) {
      console.error('Error inviting user:', err);
      // 'err.message' will be the clean error we wrote in the function
      setError(err.message); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md bg-bg-primary p-6 rounded-lg shadow-md mt-8">
      <h3 className="text-lg font-semibold mb-4">Invite New Member</h3>
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