// src/components/InviteMemberForm.jsx (REFACTORED for SUPABASE STUB)

import React, { useState } from 'react';
// FIX: Remove Firebase Functions imports
// import { functions } from "../firebase";
// import { httpsCallable } from "firebase/functions";
// NOTE: We will import { supabase } from '../supabaseClient' later for RPC calls.


function InviteMemberForm({ householdId }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STUB: The inviteUser RPC will be set up later in Supabase
  // const inviteUser = supabase.rpc('invite_user_to_household');
  
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
      console.log(`InviteMemberForm: Calling RPC 'inviteUserToHousehold' (STUBBED for email: ${email})`);
      
      // STUB: Simulate the RPC call (we will replace this with supabase.rpc() later)
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      setSuccess(`Invite sent to ${email} successfully (STUB).`);
      setEmail(''); 

    } catch (err) {
      // NOTE: Supabase RPC errors will be handled here
      console.error('Error inviting user (STUB):', err);
      setError('Invite failed. The Supabase RPC is currently stubbed.'); 
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