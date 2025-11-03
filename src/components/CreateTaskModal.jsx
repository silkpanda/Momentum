import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useProfile } from '../context/ProfileContext';
import { XMarkIcon } from '@heroicons/react/24/solid';

// CORRECTED: Added 'onTaskCreated' prop
function CreateTaskModal({ isOpen, onClose, onTaskCreated, householdId, profiles = [], preselectedProfileId }) {
  
  const { profile: creatorProfile } = useProfile(); 
  
  const [title, setTitle] = useState('');
  const [pointValue, setPointValue] = useState(10);
  const [assignedProfileId, setAssignedProfileId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const profilesArray = Array.isArray(profiles) ? profiles : [];
    if (isOpen && profilesArray.length > 0) {
      // If 'all' is selected, default to the first profile.
      // Otherwise, use the selected profile.
      if (preselectedProfileId && preselectedProfileId !== 'all') {
        setAssignedProfileId(preselectedProfileId);
      } else if (profilesArray.length > 0) {
        setAssignedProfileId(profilesArray[0].id);
      }
    }
  }, [preselectedProfileId, profiles, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!householdId || !creatorProfile) {
      setError('Could not identify household or creator profile.');
      setIsLoading(false);
      return;
    }

    // FIXED: Added .select().single() to get the new task back
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        household_id: householdId,
        creator_profile_id: creatorProfile.id,
        assigned_profile_id: assignedProfileId,
        title: title,
        point_value: pointValue,
        status: 'pending'
      })
      .select()
      .single(); // We only inserted one

    setIsLoading(false);

    if (insertError) {
      console.error('AXIOM ERROR: Failed to create task', insertError);
      setError(insertError.message);
    } else {
      console.log('AXIOM LOG: Task created successfully', newTask);
      onTaskCreated(newTask); // <-- CALL NEW PROP
    }
  };

  const handleClose = () => {
    const profilesArray = Array.isArray(profiles) ? profiles : [];
    setTitle('');
    setPointValue(10);
    // Reset to first profile or preselected, not just first
    const defaultProfile = (preselectedProfileId && preselectedProfileId !== 'all') ? preselectedProfileId : (profilesArray.length > 0 ? profilesArray[0].id : '');
    setAssignedProfileId(defaultProfile);
    setError(null);
    setIsLoading(false);
    onClose(); // Call the onClose prop
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle`}>
      <div className="modal-box bg-bg-surface text-text-primary"> 
        
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
              <span className="label-text text-text-secondary">Task Title</span>
            </label>
            <input 
              type="text" 
              placeholder="e.g. Clean room" 
              className="input input-bordered w-full bg-bg-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="form-control w-1/2">
              <label className="label">
                <span className="label-text text-text-secondary">Point Value</span>
              </label>
              <input 
                type="number" 
                className="input input-bordered w-full bg-bg-input"
                value={pointValue}
                onChange={(e) => setPointValue(parseInt(e.target.value, 10))}
                min="0"
                step="5"
                required
              />
            </div>

            <div className="form-control w-1/2">
              <label className="label">
                <span className="label-text text-text-secondary">Assign To</span>
              </label>
              <select 
                className="select select-bordered bg-bg-input"
                value={assignedProfileId}
                onChange={(e) => setAssignedProfileId(e.target.value)}
                required
              >
                {Array.isArray(profiles) && profiles.map(profile => (
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
              className="btn btn-primary w-full bg-brand-primary text-white"
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Create Task'}
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

export default CreateTaskModal;