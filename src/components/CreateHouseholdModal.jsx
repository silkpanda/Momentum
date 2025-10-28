// src/components/CreateHouseholdModal.jsx (Fixed)

import React, { useState, useEffect } from 'react'; // Import useEffect

// ... (modalStyles are the same)
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    background: 'var(--color-bg-canvas)',
    padding: '2rem',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '400px',
    color: 'var(--color-text-primary)',
  },
};


/**
 * A modal dialog for creating a new household.
 * @param {object} props
 *_ @param {boolean} props.isOpen - Whether the modal is currently open.
_ * @param {function} props.onClose - Function to call when the modal should be closed.
_ * @param {function} props.onSubmit - Function to call when the form is submitted. Passes the householdName.
 * @param {boolean} props.isSubmitting - Disables the form while submitting.
 * @param {string} props.error - An error message from the parent.
 */
// --- (1) ADDED isSubmitting and error (from parent) to props ---
function CreateHouseholdModal({ isOpen, onClose, onSubmit, isSubmitting, error: parentError }) {
  const [householdName, setHouseholdName] = useState('');
  const [localError, setLocalError] = useState(''); // For local validation

  // When the modal opens, reset the local state
  useEffect(() => {
    if (isOpen) {
      setHouseholdName('');
      setLocalError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault(); 
    if (!householdName.trim()) {
      setLocalError('Please enter a name.');
      return;
    }
    setLocalError('');
    onSubmit(householdName); // Pass the name up
    // Don't reset name here, wait for modal to close
  };
  
  // Decide which error to show: the one from the parent (like a server error)
  // or the local one (like "name is required")
  const errorToShow = parentError || localError;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-semibold mb-4">Create a New Household</h2>
        <p className="text-sm text-text-secondary mb-6">
          This will be your new family space. You can invite others after it's created.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="householdName" className="block text-sm font-medium text-text-primary mb-2">
              Household Name
            </label>
            <input
              type="text"
              id="householdName"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-action-primary"
              placeholder="e.g., The Avengers HQ"
              autoFocus
              disabled={isSubmitting} // --- (2) Disable input while submitting ---
            />
            {errorToShow && <p className="text-sm text-signal-error mt-2">{errorToShow}</p>}
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary rounded-md text-text-primary font-medium hover:bg-border-primary"
              disabled={isSubmitting} // --- (3) Disable button while submitting ---
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-action-primary rounded-md text-action-primary-inverted font-medium hover:bg-action-primary-hover disabled:opacity-50"
              disabled={isSubmitting} // --- (4) Disable button while submitting ---
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateHouseholdModal;