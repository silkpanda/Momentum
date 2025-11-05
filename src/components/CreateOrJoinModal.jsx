// src/components/CreateOrJoinModal.jsx (FIXED: Import paths)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
// --- THIS IS THE FIX (Part 1) ---
import LoadingSpinner from './LoadingSpinner.jsx';
import CreateManagedProfileForm from './CreateManagedProfileForm.jsx';
// --------------------------------

export default function CreateOrJoinModal({ user, onSuccess }) {
  const [view, setView] = useState('join'); // 'join' or 'create'
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (inviteCode.length !== 6) {
      setError('The invite code must be exactly 6 digits.');
      setLoading(false);
      return;
    }

    try {
      console.log(`Attempting to join with code: ${inviteCode}`);

      // Call the RPC function to join
      const { data, error: rpcError } = await supabase.rpc(
        'join_household_with_code',
        {
          target_code: inviteCode,
        }
      );

      if (rpcError) throw rpcError;

      console.log('Successfully joined household:', data);
      // On success, call the handler from Dashboard to refetch profile
      onSuccess();
    } catch (err) {
      console.error('Join by Code Failed:', err);
      setError(err.message || 'Join failed. Check code validity.');
    } finally {
      setLoading(false);
    }
  };

  // This is the "Create" view
  if (view === 'create') {
    return (
      <CreateManagedProfileForm user={user} onHouseholdCreated={onSuccess} />
    );
  }

  // This is the default "Join" view
  return (
    <div className="fixed inset-0 bg-bg-canvas flex items-center justify-center z-50">
      <div
        className="bg-bg-surface p-8 rounded-lg shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          Welcome!
        </h2>
        <p className="text-text-secondary mb-6">
          To get started, join your household using an invite code.
        </p>

        {error && (
          <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        {/* --- 1. Join Existing Household --- */}
        <form
          onSubmit={handleJoin}
          className="mb-8 p-4 border border-border-muted rounded-md"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-3">
            Join Household
          </h3>
          <label
            htmlFor="inviteCode"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Enter 6-Digit Invite Code
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="inviteCode"
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(e.target.value.trim().toUpperCase())
              }
              maxLength="6"
              className="flex-grow px-3 py-2 bg-bg-input border border-border-default rounded-md text-xl tracking-widest text-center"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || inviteCode.length !== 6}
              className="py-2 px-4 bg-action-primary text-text-on-action font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </form>

        {/* --- 2. Create New Household --- */}
        <div className="text-center">
          <p className="text-text-secondary mb-3">— OR —</p>
          <button
            onClick={() => setView('create')}
            className="w-full py-2 px-4 bg-bg-muted text-text-primary font-semibold rounded-md border border-border-muted hover:bg-border-muted transition duration-150"
            disabled={loading}
          >
            Create New Household
          </button>
        </div>
      </div>
    </div>
  );
}