// src/components/CreateManagedProfileForm.jsx (FIXED: Removed .jsx from imports)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';
// --- THIS IS THE FIX (Part 3) ---
import LoadingSpinner from './LoadingSpinner';
// --------------------------------

export default function CreateManagedProfileForm({ user, onHouseholdCreated }) {
  const [householdName, setHouseholdName] = useState('');
  const [adminProfileName, setAdminProfileName] = useState('');
  const [childProfileName, setChildProfileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !householdName.trim() ||
      !adminProfileName.trim() ||
      !childProfileName.trim()
    ) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the RPC function
      const { data, error: rpcError } = await supabase.rpc(
        'create_household_and_profile',
        {
          household_name: householdName,
          admin_profile_name: adminProfileName,
          child_profile_name: childProfileName,
        }
      );

      if (rpcError) throw rpcError;

      console.log('Household created successfully:', data);
      // On success, call the handler from Dashboard to refetch profile
      onHouseholdCreated();
    } catch (err) {
      console.error('Error creating household:', err);
      setError(err.message || 'Failed to create household.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-canvas flex items-center justify-center z-50">
      <div className="bg-bg-surface p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-text-primary">
          Create Your Household
        </h2>
        <p className="text-text-secondary mb-6">
          Let's get your family set up. You'll be the first admin.
        </p>

        {error && (
          <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="householdName"
              className="block text-sm font-medium text-text-secondary"
            >
              Family or Household Name
            </label>
            <input
              type="text"
              id="householdName"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-bg-input border-border-default focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              placeholder="e.g., The Smith Family"
              required
            />
          </div>

          <div>
            <label
              htmlFor="adminProfileName"
              className="block text-sm font-medium text-text-secondary"
            >
              Your Display Name
            </label>
            <input
              type="text"
              id="adminProfileName"
              value={adminProfileName}
              onChange={(e) => setAdminProfileName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-bg-input border-border-default focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              placeholder="e.g., Mom"
              required
            />
          </div>

          <div>
            <label
              htmlFor="childProfileName"
              className="block text-sm font-medium text-text-secondary"
            >
              Add Your First Child's Name
            </label>
            <input
              type="text"
              id="childProfileName"
              value={childProfileName}
              onChange={(e) => setChildProfileName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-bg-input border-border-default focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
              placeholder="e.g., Jamie"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-medium text-white rounded-md bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Household & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}