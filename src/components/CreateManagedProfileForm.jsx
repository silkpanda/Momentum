// src/components/CreateManagedProfileForm.jsx (Complete & Final)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; 

const COLOR_PALETTE = [
  { name: 'Red', class: 'bg-managed-red', value: 'managed-red' },
  { name: 'Orange', class: 'bg-managed-orange', value: 'managed-orange' },
  { name: 'Yellow', class: 'bg-managed-yellow', value: 'managed-yellow' },
  { name: 'Green', class: 'bg-managed-green', value: 'managed-green' },
  { name: 'Teal', class: 'bg-managed-teal', value: 'managed-teal' },
  { name: 'Blue', class: 'bg-managed-blue', value: 'managed-blue' },
  { name: 'Purple', class: 'bg-managed-purple', value: 'managed-purple' },
  { name: 'Gray', class: 'bg-managed-gray', value: 'managed-gray' },
];

// CRITICAL FIX: Removed householdId from props since the RPC infers it.
function CreateManagedProfileForm({ onSuccess }) { 
  const [displayName, setDisplayName] = useState('');
  const [profileColor, setProfileColor] = useState(COLOR_PALETTE[0].value); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName) {
      setError('A display name is required for the new profile.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // CRITICAL FIX: Payload now only sends display name and color. The household ID is INFERRED by the RPC.
    const payload = {
      p_display_name: displayName,
      p_color: profileColor 
    };

    try {
      console.log("Calling Supabase RPC: create_managed_profile (Inferred ID)", payload);
      
      // Note: The RPC signature is now create_managed_profile(text, text)
      const { data: newProfileId, error: rpcError } = await supabase.rpc('create_managed_profile', payload);

      if (rpcError) {
        throw rpcError;
      }
      
      console.log(`Managed Profile created successfully. ID: ${newProfileId}`);
      
      setDisplayName('');
      setProfileColor(COLOR_PALETTE[0].value);
      
      onSuccess(newProfileId); 

    } catch (err) {
      console.error('Managed Profile Creation Failed:', err);
      const message = err.message || 'Failed to create profile. Check RLS and RPC logs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      
      {error && <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">{error}</div>}

      {/* 1. Display Name Input */}
      <div className="mb-4">
        <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-2">
          Profile Name (e.g., Liam, Sarah)
        </label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 bg-bg-muted border border-border-primary rounded-md"
          disabled={loading}
          required
        />
      </div>

      {/* 2. Color Picker */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Profile Color
        </label>
        <div className="flex space-x-2">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setProfileColor(color.value)}
              disabled={loading}
              className={`w-8 h-8 rounded-full transition duration-150 cursor-pointer ${color.class} ${
                profileColor === color.value 
                  ? 'ring-4 ring-action-primary' 
                  : 'border-2 border-transparent hover:ring-2 hover:ring-text-secondary'
              }`}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            >
              {profileColor === color.value && (
                <svg className="w-5 h-5 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
      >
        {loading ? 'Creating Profile...' : 'Create Managed Profile'}
      </button>
    </form>
  );
}

export default CreateManagedProfileForm;