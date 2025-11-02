// src/components/CreateTaskModal.jsx (FIXED: Uses display_name)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../context/ProfileContext';

function CreateTaskModal({ isOpen, onClose, preselectedProfileId }) {
  const { profiles, activeProfileData } = useProfile();
  
  const [title, setTitle] = useState('');
  const [pointValue, setPointValue] = useState(10);
  const [assignedProfileId, setAssignedProfileId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effect to set the default assigned profile
  useEffect(() => {
    // Only set if the profiles are actually loaded
    if (profiles.length > 0) {
      if (preselectedProfileId) {
        setAssignedProfileId(preselectedProfileId);
      } else {
        // Default to the first profile if none is preselected
        setAssignedProfileId(profiles[0].id);
      }
    }
  }, [preselectedProfileId, profiles, isOpen]); // Reset when modal opens

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
        status: 'pending' // FPO: Add due_date, etc.
      });

    setIsLoading(false);

    if (insertError) {
      console.error('AXIOM ERROR: Failed to create task', insertError);
      setError(insertError.message);
    } else {
      // Success
      console.log('AXIOM LOG: Task created successfully');
      // FPO: We don't need to refresh tasks because the
      // realtime subscription in HouseholdDashboard should catch it.
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset form
    setTitle('');
    setPointValue(10);
    setAssignedProfileId(profiles.length > 0 ? profiles[0].id : ''); // Reset to default
    setError(null);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Task</h3>
        
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

          <div className="form-control w-full mb-4">
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

          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Assign To</span>
            </label>
            <select 
              className="select select-bordered"
              value={assignedProfileId}
              onChange={(e) => setAssignedProfileId(e.target.value)}
              required
            >
              <option value="" disabled>Select profile</option>
              {/* 🛠️ FIX: Map over the profiles from context and use display_name */}
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name} 
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <div className="modal-action">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Create Task'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default CreateTaskModal;