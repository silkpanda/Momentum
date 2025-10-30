// src/components/CreateHouseholdModal.jsx (REFACTORED for SUPABASE)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 

function CreateHouseholdModal({ isOpen, onClose, onHouseholdCreated }) {
  const { currentUser } = useAuth();
  const [householdName, setHouseholdName] = useState('');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!householdName || !adminDisplayName) {
      setError('Please provide a name for your household and your profile.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // The data we send to the Supabase Stored Procedure
    const payload = {
      h_name: householdName,
      p_display_name: adminDisplayName,
      // The auth_user_id is passed implicitly via the RLS policy and stored procedure
      // but we send the current user's ID for simplicity in the procedure's definition.
      auth_id: currentUser.id 
    };

    try {
      console.log("Calling Supabase RPC: create_household_and_profile");
      
      // CRITICAL FIX: Replace all Firestore writes with a single Supabase RPC call.
      // The RPC call executes the atomic transaction defined in PostgreSQL.
      const { data, error: rpcError } = await supabase.rpc('create_household_and_profile', payload);

      if (rpcError) {
        throw rpcError;
      }
      
      // The stored procedure should return the new household_id on success
      const newHouseholdId = data; // Assuming the procedure returns the UUID
      
      console.log(`Household created successfully. ID: ${newHouseholdId}`);
      onHouseholdCreated(newHouseholdId); // Triggers redirect in Dashboard.jsx
      
      // Cleanup local state
      setHouseholdName('');
      setAdminDisplayName('');

    } catch (err) {
      console.error('Household Creation Failed:', err);
      // Supabase RPC errors are typically clean messages
      setError(err.message || 'Failed to create household. Check RLS policy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Welcome! Create Your First Household</h2>
        <p className="text-text-secondary mb-6">This will set up your profile and your family's core data structure.</p>

        {error && <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Household Name */}
          <div className="mb-4">
            <label htmlFor="householdName" className="block text-sm font-medium text-text-secondary mb-2">Household Name (e.g., The Smith Family)</label>
            <input
              type="text"
              id="householdName"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md"
              disabled={loading}
              required
            />
          </div>
          
          {/* Admin Display Name */}
          <div className="mb-6">
            <label htmlFor="adminDisplayName" className="block text-sm font-medium text-text-secondary mb-2">Your Display Name</label>
            <input
              type="text"
              id="adminDisplayName"
              value={adminDisplayName}
              onChange={(e) => setAdminDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-md"
              placeholder="e.g., Mom, Dad, Anthony"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-action-primary text-action-primary-inverted font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
          >
            {loading ? 'Creating Structure...' : 'Create Household & Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateHouseholdModal;