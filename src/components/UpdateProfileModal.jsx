// src/components/UpdateProfileModal.jsx (FIXED: Calls new optimistic function)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

function UpdateProfileModal() {
  const { user } = useAuth();
  const { 
    profiles,
    allProfileColors,
    updateModal, 
    closeUpdateModal,
    saveProfileUpdate // 🛠️ FIX: Get the new function from context
  } = useProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isParent, setIsParent] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isEditorParent, setIsEditorParent] = useState(false);

  // Memoized fetch function
  const fetchProfileData = useCallback(async () => {
    if (!updateModal.profileId || !user || profiles.length === 0 || !allProfileColors) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const currentProfile = profiles.find(p => p.id === updateModal.profileId);
      if (!currentProfile) throw new Error('Profile to edit not found.');

      const editorProfile = profiles.find(p => p.auth_user_id === user.id);
      if (!editorProfile) throw new Error('Editor profile not found.');
      
      setDisplayName(currentProfile.display_name || '');
      setSelectedColor(currentProfile.profile_color || allProfileColors[0].class);
      setIsParent(currentProfile.is_admin || false);
      setIsEditorParent(editorProfile.is_admin || false);

    } catch (err) {
      console.error("AXIOM ERROR: Failed to fetch profile data", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [updateModal.profileId, user, profiles, allProfileColors]);

  // Effect to fetch data when modal opens
  useEffect(() => {
    if (updateModal.isOpen) {
      fetchProfileData();
    }
  }, [updateModal.isOpen, fetchProfileData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 🛠️ FIX: Call the new optimistic function from the context.
      // This will update the UI *instantly* and save in the background.
      await saveProfileUpdate(
        updateModal.profileId,
        displayName,
        selectedColor,
        isParent
      );
      
      // Success!
      console.log('AXIOM LOG: Optimistic update submitted.');
      closeUpdateModal(); // Close self

    } catch (rpcError) {
      // This catch block will only catch errors from the save
      // if the saveProfileUpdate function re-throws them.
      // For now, we assume the context handles errors.
      console.error('AXIOM ERROR: Failed to submit update', rpcError);
      setError(rpcError.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!updateModal.isOpen) {
    return null;
  }

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle">
      <div className="modal-box bg-base-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Update Profile</h3>
          <button 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={closeUpdateModal}
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading || !allProfileColors ? (
          <div className="flex justify-center items-center h-48">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text">Display Name</span>
              </label>
              <input 
                type="text" 
                placeholder="Your display name" 
                className="input input-bordered w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text">Profile Color</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allProfileColors.map(color => (
                  <button
                    key={color.class}
                    type="button"
                    className={`btn btn-circle btn-sm ${color.class} ${selectedColor === color.class ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : ''}`}
                    onClick={() => setSelectedColor(color.class)}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>
            
            {isEditorParent && (
              <div className="form-control mb-4">
                <label className="label cursor-pointer justify-start gap-4">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary" 
                    checked={isParent}
                    onChange={(e) => setIsParent(e.target.checked)}
                  />
                  <span className="label-text">Parent Status</span> 
                </label>
                <p className="text-xs opacity-60 mt-1">
                  Parents can create tasks, manage profiles, and invite other parents.
                </p>
              </div>
            )}


            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <div className="modal-action">
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button onClick={closeUpdateModal} disabled={isLoading}>close</button>
      </form>
    </div>
  );
}

export default UpdateProfileModal;