// src/components/CreateChildProfileModal.jsx (Formerly CreateManagedProfileModal.jsx)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../context/ProfileContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

// FPO: Define color options. These should match the DB and tailwind.config.js
const profileColors = [
  { name: 'Green', class: 'managed-green' },
  { name: 'Orange', class: 'managed-orange' },
  { name: 'Red', class: 'managed-red' },
  { name: 'Teal', class: 'managed-teal' },
  { name: 'Purple', class: 'managed-purple' },
  { name: 'Blue', class: 'managed-blue' },
];

// 🛠️ FIX: Renamed component to CreateChildProfileModal
function CreateChildProfileModal({ isOpen, onClose, householdId }) {
  const { refreshProfiles } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [selectedColor, setSelectedColor] = useState(profileColors[0].class);
  // 🛠️ FIX: Renamed variable to isParent
  const [isParent, setIsParent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // FPO: This will be replaced by the 'create_managed_profile' RPC
    console.log(`FPO: Calling create_managed_profile RPC with:
      Name: ${displayName},
      Color: ${selectedColor},
      IsParent (is_admin): ${isParent}, 
      Household: ${householdId}
    `);
    
    try {
      // 🛠️ FIX: The RPC and DB field is still 'is_admin', but our variable is 'isParent'
      // const { data, error } = await supabase.rpc('create_managed_profile', {
      //   target_household_id: householdId,
      //   display_name: displayName,
      //   profile_color: selectedColor,
      //   is_admin: isParent 
      // });
      // if (error) throw error;

      await new Promise(res => setTimeout(res, 1000)); // Simulate network

      // Success
      console.log('AXIOM LOG: Child profile created.');
      refreshProfiles(); // Refresh the context to show the new profile
      handleClose();

    } catch (rpcError) {
      console.error('AXIOM ERROR: Failed to create profile', rpcError);
      setError(rpcError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setDisplayName('');
    setSelectedColor(profileColors[0].class);
    setIsParent(false);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle`}>
      <div className="modal-box bg-base-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          {/* 🛠️ FIX: Updated title */}
          <h3 className="font-bold text-lg">Create Child Profile</h3>
          <button 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={handleClose}
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Profile Name</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Alex" 
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
              {profileColors.map(color => (
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
          
          <div className="form-control mb-4">
            <label className="label cursor-pointer justify-start gap-4">
              <input 
                type="checkbox" 
                className="checkbox checkbox-primary" 
                checked={isParent}
                // 🛠️ FIX: Renamed variable
                onChange={(e) => setIsParent(e.target.checked)}
              />
              {/* 🛠️ FIX: Updated text */}
              <span className="label-text">Make this profile a Parent?</span> 
            </label>
            <p className="text-xs opacity-60 mt-1">
              {/* 🛠️ FIX: Updated text */}
              Parents can create tasks, manage profiles, and invite other parents.
            </p>
          </div>


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
              {isLoading ? <span className="loading loading-spinner"></span> : 'Create Profile'}
            </button>
          </div>
        </form>

      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose} disabled={isLoading}>close</button>
      </form>
    </div>
  );
}

// 🛠️ FIX: Renamed component export
export default CreateChildProfileModal;