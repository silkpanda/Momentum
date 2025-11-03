// src/components/EditManagedProfileModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { XMarkIcon } from '@heroicons/react/24/solid';

// CORRECTED: This palette now uses the 'gcal-*' colors
// from your 'tailwind.config.js' file.
const COLOR_PALETTE = [
  { name: 'Red', class: 'bg-gcal-red', value: 'gcal-red' },
  { name: 'Orange', class: 'bg-gcal-orange', value: 'gcal-orange' },
  { name: 'Yellow', class: 'bg-gcal-yellow', value: 'gcal-yellow' },
  { name: 'Green', class: 'bg-gcal-green', value: 'gcal-green' },
  { name: 'Teal', class: 'bg-gcal-teal', value: 'gcal-teal' },
  { name: 'Blue', class: 'bg-gcal-blue', value: 'gcal-blue' },
  { name: 'Purple', class: 'bg-gcal-purple', value: 'gcal-purple' },
  { name: 'Gray', class: 'bg-gcal-gray', value: 'gcal-gray' },
];

function EditManagedProfileModal({ isOpen, onClose, targetProfile, onProfileUpdated }) {
  const { currentUser } = useAuth(); 
  const [displayName, setDisplayName] = useState('');
  const [profileColor, setProfileColor] = useState(COLOR_PALETTE[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (targetProfile) {
      setDisplayName(targetProfile.display_name);
      // Ensure the saved color is one of the available options
      if (COLOR_PALETTE.some(c => c.value === targetProfile.profile_color)) {
        setProfileColor(targetProfile.profile_color);
      } else {
        // Default to the first color if the saved one is invalid
        setProfileColor(COLOR_PALETTE[0].value);
      }
      setError(null);
    }
  }, [targetProfile]);

  if (!isOpen || !targetProfile) return null;
  
  if (targetProfile.auth_user_id === currentUser?.id) {
    console.warn('AXIOM: EditManagedProfileModal was incorrectly opened on the admin user. Closing.');
    onClose();
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        target_profile_id: targetProfile.id,
        new_display_name: displayName,
        new_profile_color: profileColor,
      };

      const { error: rpcError } = await supabase.rpc('update_managed_profile', payload);

      if (rpcError) throw rpcError;

      onProfileUpdated(`Profile for ${displayName} updated successfully.`);

    } catch (err) {
      console.error('Profile Update Failed:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use daisyUI modal structure
    <div className={`modal ${isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle`}>
      {/* Use daisyUI semantic colors 'base-100' and 'base-content' */}
      <div className="modal-box bg-base-100 text-base-content">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit {targetProfile.display_name}'s Profile</h2>
          <button 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={onClose}
            disabled={loading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Display Name Input */}
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-medium opacity-70 mb-2">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.gertValue)}
              // Use daisyUI 'input-bordered' and 'base-200'
              className="input input-bordered w-full bg-base-200"
              required
            />
          </div>

          {/* Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium opacity-70 mb-2">Profile Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setProfileColor(color.value)}
                  // Use 'primary' (daisyUI) for the ring
                  className={`w-8 h-8 rounded-full transition duration-150 cursor-pointer ${color.class} ${
                    profileColor === color.value 
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100'
                      : 'ring-2 ring-transparent hover:ring-2 hover:ring-base-content'
                  }`}
                  title={color.name}
                  aria-label={`Select ${color.name} color`}
                >
                  {profileColor === color.value && (
                    // This check icon is white, which works great with the solid gcal colors
                    <svg className="w-5 h-5 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose} disabled={loading}>close</button>
      </form>
    </div>
  );
}

export default EditManagedProfileModal;