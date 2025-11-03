// src/components/CreateTaskModal.jsx (FIXED: Style Guide UI)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../context/ProfileContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

function CreateTaskModal({ isOpen, onClose, preselectedProfileId }) {
  const { profiles, activeProfileData } = useProfile();
  
  const [title, setTitle] = useState('');
  const [pointValue, setPointValue] = useState(10);
  const [assignedProfileId, setAssignedProfileId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && profiles.length > 0) {
      if (preselectedProfileId) {
        setAssignedProfileId(preselectedProfileId);
      } else if (profiles.length > 0) {
        setAssignedProfileId(profiles[0].id);
      }
    }
  }, [preselectedProfileId, profiles, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!activeProfileData || !activeProfileData.household_id) {
      setError('Could not identify household or creator profile.');
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('tasks')
      .insert({
        household_id: activeProfileData.household_id,
        creator_profile_id: activeProfileData.id,
        assigned_profile_id: assignedProfileId,
        title: title,
        point_value: pointValue,
        status: 'pending'
      });

    setIsLoading(false);

    if (insertError) {
      console.error('AXIOM ERROR: Failed to create task', insertError);
      setError(insertError.message);
    } else {
      console.log('AXIOM LOG: Task created successfully');
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form
    setTitle('');
    setPointValue(10);
    setAssignedProfileId(profiles.length > 0 ? profiles[0].id : '');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  // 🛠️ FIX: Use 'modal-open' class conditionally
  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle`}>
      {/* 🛠️ FIX: Updated modal-box styling */}
      <div className="modal-box bg-base-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Create New Task</h3>
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
              <span className="label-text">Task Title</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Clean room" 
              className="input input-bordered w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="form-control w-1/2">
              <label className="label">
                <span className="label-text">Point Value</span>
              </label>
              <input 
                type="number" 
                className="input input-bordered w-full"
                value={pointValue}
                onChange={(e) => setPointValue(parseInt(e.target.value, 10))}
                min="0"
                step="5"
                required
              />
            </div>

            <div className="form-control w-1/2">
              <label className="label">
                <span className="label-text">Assign To</span>
              </label>
              <select 
                className="select select-bordered"
                value={assignedProfileId}
                onChange={(e) => setAssignedProfileId(e.target.value)}
                required
              >
                {/* Note: We removed "Select profile" because the useEffect
                  now guarantees a default selection, which is better UX.
                */}
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name} 
                  </option>
                ))}
              </select>
            </div>
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
              {isLoading ? <span className="loading loading-spinner"></span> : 'Create Task'}
            </button>
          </div>
        </form>

      </div>
      
      {/* 🛠️ FIX: Add modal-backdrop for clicking off to close */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose} disabled={isLoading}>close</button>
      </form>
    </div>
  );
}

export default CreateTaskModal;