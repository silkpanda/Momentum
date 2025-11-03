// src/components/UpdateProfileModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../context/ProfileContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

function UpdateProfileModal({ isOpen, onClose, onProfileUpdated }) {
  // Use context to get profile AND the refetch function
  const { profile: userProfile, fetchProfile } = useProfile(); 
  
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Manually trigger a re-fetch in the context
      await fetchProfile(); 
      
      onProfileUpdated('Profile updated successfully.');
      // onClose(); // The dashboard handler will close it

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

          {/* --- CLARIFICATION ADDED --- */}
          <div className="mb-6">
            <label className="block text-sm font-medium opacity-70 mb-2">Profile Color</label>
            <p className="text-sm opacity-50">
              Admin profile colors are managed in your main account settings (coming soon).
            </p>
          </div>
          {/* ------------------------- */}
          

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