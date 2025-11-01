// src/components/CreateTaskModal.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

/**
 * Modal for creating a new task, assigned to a member of the current household.
 *
 * @param {boolean} isOpen - Whether the modal is open.
 * @param {function} onClose - Function to close the modal.
 * @param {array} profiles - List of household profiles to select from for assignment.
 * @param {function} onTaskCreated - Callback function on successful task creation.
 */
function CreateTaskModal({ isOpen, onClose, profiles, onTaskCreated }) {
  const { currentUser } = useAuth(); // Used for potential future logic, but mainly for context

  const initialFormState = {
    title: '',
    assigned_profile_id: '',
    due_date: '',
    point_value: 5, // Default point value
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error message when the user starts typing in any field
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // --- Validation ---
    if (!formData.title.trim() || !formData.assigned_profile_id || !formData.point_value) {
      setError("Please fill in the Task Title, Assigned Profile, and Point Value.");
      setLoading(false);
      return;
    }

    const points = parseInt(formData.point_value, 10);
    if (isNaN(points) || points <= 0) {
      setError("Point Value must be a positive number.");
      setLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      // Call the Supabase RPC (Remote Procedure Call) to create the task
      // The RPC handles inserting the task into the database and verifying permissions.
      const { error: rpcError } = await supabase.rpc('create_task', {
        task_title: formData.title.trim(),
        assigned_to_profile_id: formData.assigned_profile_id,
        point_value: points,
        // Convert the date string to null if empty, which is cleaner for PostgreSQL
        due_date_str: formData.due_date || null, 
      });

      if (rpcError) throw rpcError;
      
      // Success: Reset form, notify dashboard, and close modal
      onTaskCreated(`Task "${formData.title}" successfully created and assigned!`);
      setFormData(initialFormState);
      onClose();

    } catch (err) {
      console.error('Task Creation Failed:', err);
      // Construct a user-friendly error message
      setError(`Error creating task: ${err.message || err.details || 'Check console for RPC details.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Reusable classes for clean styling
  const inputClass = "w-full p-2 border border-border-primary rounded-md focus:ring-action-primary focus:border-action-primary";
  const labelClass = "block text-sm font-medium text-text-primary mb-1";

  return (
    <div className="fixed inset-0 bg-palette-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-bg-surface p-6 rounded-lg shadow-2xl max-w-md w-full animate-fadeInUp">
        
        <h2 className="text-xl font-semibold text-text-primary mb-4 border-b border-border-muted pb-3">Create New Task</h2>
        
        <form onSubmit={handleSubmit}>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 mb-4 text-sm text-signal-error border border-signal-error-border bg-signal-error-bg rounded-md">
              {error}
            </div>
          )}

          {/* 1. Task Title (Required) */}
          <div className="mb-4">
            <label htmlFor="title" className={labelClass}>Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g., Empty the dishwasher, Study for Math Test"
              disabled={loading}
              required
            />
          </div>

          {/* 2. Assigned Profile (Required) */}
          <div className="mb-4">
            <label htmlFor="assigned_profile_id" className={labelClass}>Assign To</label>
            <select
              id="assigned_profile_id"
              name="assigned_profile_id"
              value={formData.assigned_profile_id}
              onChange={handleChange}
              className={inputClass}
              disabled={loading}
              required
            >
              <option value="">-- Select a Family Member --</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name} {profile.is_admin ? '(Admin)' : '(Managed)'}
                </option>
              ))}
            </select>
            {profiles.length === 0 && (
                <p className="text-xs text-signal-warning mt-1">No profiles found in household.</p>
            )}
          </div>
          
          {/* 3. Point Value (Required, Positive Integer) */}
          <div className="mb-4">
            <label htmlFor="point_value" className={labelClass}>Point Value</label>
            <input
              type="number"
              id="point_value"
              name="point_value"
              value={formData.point_value}
              onChange={handleChange}
              className={inputClass}
              placeholder="5"
              min="1"
              disabled={loading}
              required
            />
          </div>

          {/* 4. Due Date (Optional) */}
          <div className="mb-6">
            <label htmlFor="due_date" className={labelClass}>Due Date (Optional)</label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className={inputClass}
              disabled={loading}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-text-secondary bg-bg-muted rounded-md hover:bg-palette-gray-300 transition duration-150"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-4 bg-action-primary text-text-on-action font-semibold rounded-md hover:bg-action-primary-hover transition duration-150"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CreateTaskModal;