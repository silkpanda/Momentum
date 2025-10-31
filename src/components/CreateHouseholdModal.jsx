// src/components/CreateHouseholdModal.jsx (Updated with Profile Color Picker)

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; 

// Constants for our Google Calendar-based color palette
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


function CreateHouseholdModal({ isOpen, onClose, onHouseholdCreated }) {
  const { currentUser } = useAuth();
  const [householdName, setHouseholdName] = useState('');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  // NEW STATE: Set default color to the first one in the list (Red)
  const [profileColor, setProfileColor] = useState(COLOR_PALETTE[0].value); 
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
    // CRITICAL UPDATE: Added p_color
    const payload = {
      h_name: householdName,
      p_display_name: adminDisplayName,
      auth_id: currentUser.id,
      p_color: profileColor // NEW PAYLOAD FIELD
    };

    try {
      console.log("Calling Supabase RPC: create_household_and_profile");
      
      const { data, error: rpcError } = await supabase.rpc('create_household_and_profile', payload);

      if (rpcError) {
        throw rpcError;
      }
      
      const newHouseholdId = data;
      
      console.log(`Household created successfully. ID: ${newHouseholdId}`);
      onHouseholdCreated(newHouseholdId);
      
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
      <div className="bg-bg-surface p-8 rounded-lg shadow-2xl max-w-md w-full">
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
              className="w-full px-3 py-2 bg-bg-muted border border-border-primary rounded-md"
              disabled={loading}
              required
            />
          </div>
          
          {/* Admin Display Name */}
          <div className="mb-4">
            <label htmlFor="adminDisplayName" className="block text-sm font-medium text-text-secondary mb-2">Your Display Name</label>
            <input
              type="text"
              id="adminDisplayName"
              value={adminDisplayName}
              onChange={(e) => setAdminDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-muted border border-border-primary rounded-md"
              placeholder="e.g., Mom, Dad, Anthony"
              disabled={loading}
              required
            />
          </div>

          {/* NEW: Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Your Profile Color
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
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
          >
            {loading ? 'Creating Structure...' : 'Create Household & Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateHouseholdModal;