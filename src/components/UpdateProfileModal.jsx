// src/components/UpdateProfileModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../context/ProfileContext'; // Gets its own data
import { XMarkIcon } from '@heroicons/react/24/solid';

// This modal only needs 'isOpen' and 'onClose'
function UpdateProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const { profile: userProfile } = useProfile(); // Get the logged-in user's profile
  
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // When the modal opens, populate the form with the user's current name
  useEffect(() => {
    if (isOpen && userProfile) {
      setDisplayName(userProfile.display_name);
      setError(null);
    }
  }, [isOpen, userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update the 'profiles' table where the id matches
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Tell the dashboard we've updated
      onProfileUpdated('Profile updated successfully.');
      onClose(); // Close the modal

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle`}>
      <div className="modal-box bg-base-100 text-base-content">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Your Profile</h2>
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
            <label htmlFor="displayName" className="block text-sm font-medium opacity-70 mb-2">Your Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input input-bordered w-full bg-base-200"
              required
            />
          </div>

          {/* Note: We don't include a color picker here,
              as the admin's color is tied to their auth account
              or a different setting, not the managed-profile colors.
          */}

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

export default UpdateProfileModal;