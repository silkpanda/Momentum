// src/components/InviteMemberForm.jsx (COMPLETE)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; 

function InviteMemberForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('An email address is required.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Payload for the Supabase Stored Procedure
    const payload = {
      target_email: email,
    };

    try {
      console.log("Calling Supabase RPC: invite_auth_user_to_household", payload);
      
      const { data: resultMessage, error: rpcError } = await supabase.rpc('invite_auth_user_to_household', payload);

      if (rpcError) {
        throw rpcError;
      }
      
      // The RPC returns a custom success or failure message (as TEXT)
      if (resultMessage.startsWith('Error:')) {
          setError(resultMessage.replace('Error: ', ''));
      } else {
          console.log('Invite RPC success:', resultMessage);
          setEmail('');
          // CRITICAL: Call onSuccess to close modal and show dashboard notification
          onSuccess(resultMessage); 
      }

    } catch (err) {
      console.error('Invite Failed:', err);
      const message = err.message || 'An unexpected error occurred during the invite process.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      
      {error && <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">{error}</div>}

      {/* Email Input */}
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
          Co-Parent's Email Address
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 bg-bg-muted border border-border-primary rounded-md"
          disabled={loading}
          placeholder="co-parent@example.com"
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
      >
        {loading ? 'Sending Invite...' : 'Invite to Household'}
      </button>
    </form>
  );
}

export default InviteMemberForm;