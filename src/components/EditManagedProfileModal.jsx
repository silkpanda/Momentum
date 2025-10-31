// src/components/EditManagedProfileModal.jsx (COMPLETE & FINAL FIX)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; // CRITICAL FIX: Import useAuth
import LoadingSpinner from './LoadingSpinner';

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

function EditManagedProfileModal({ isOpen, onClose, targetProfile, onProfileUpdated }) {
  // CRITICAL FIX: Get currentUser from Context
  const { currentUser } = useAuth(); 
  const [displayName, setDisplayName] = useState('');
  const [profileColor, setProfileColor] = useState(COLOR_PALETTE[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set initial state when the targetProfile prop changes
  useEffect(() => {
    if (targetProfile) {
      setDisplayName(targetProfile.display_name);
      setProfileColor(targetProfile.profile_color);
      setError(null);
    }
  }, [targetProfile]);


  if (!isOpen || !targetProfile) return null;
  
  // CRITICAL FIX: Use currentUser.id for the guard check
  if (targetProfile.auth_user_id === currentUser?.id) {
      onClose(); // Close if accidentally opened on Admin profile
      return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        target_profile_id: targetProfile.id, // Pass the target profile's ID
        new_display_name: displayName,
        new_profile_color: profileColor,
      };

      // Call the dedicated RPC for managed profiles
      const { error: rpcError } = await supabase.rpc('update_managed_profile', payload);

      if (rpcError) throw rpcError;

      onProfileUpdated(`Profile for ${displayName} updated successfully.`);
      onClose();

    } catch (err) {
      console.error('Profile Update Failed:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-bg-surface p-8 rounded-lg shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6 text-text-primary">Edit {targetProfile.display_name}'s Profile</h2>

        {loading && <LoadingSpinner text="Saving profile..." />}
        {error && <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">{error}</div>}
        

        <form onSubmit={handleSubmit}>
          {/* Display Name Input */}
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-2">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-muted border border-border-primary rounded-md"
              required
            />
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">Profile Color</label>
            <div className="flex space-x-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setProfileColor(color.value)}
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

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-text-secondary hover:bg-bg-muted rounded-md transition duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditManagedProfileModal;