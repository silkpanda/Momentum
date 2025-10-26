// src/components/CreateHouseholdModal.jsx

import React, { useState } from 'react';

// I'm putting some simple styles right here.
// We can move this to a CSS file later if we want.
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
 * @param {boolean} props.isOpen - Whether the modal is currently open.
 * @param {function} props.onClose - Function to call when the modal should be closed.
 * @param {function} props.onSubmit - Function to call when the form is submitted. Passes the householdName.
 */
function CreateHouseholdModal({ isOpen, onClose, onSubmit }) {
  const [householdName, setHouseholdName] = useState('');
  const [error, setError] = useState('');

  // If we're not open, render nothing.
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault(); // Stop the page from reloading
    if (!householdName.trim()) {
      setError('Please enter a name.');
      return;
    }
    setError('');
    onSubmit(householdName); // Pass the name up to the parent (Dashboard)
    setHouseholdName(''); // Reset the form
  };

  return (
    // The overlay: click this to close the modal
    <div style={modalStyles.overlay} onClick={onClose}>
      {/* The modal content: click this to stop the overlay click */}
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
              autoFocus // Automatically focuses this input when the modal opens
            />
            {error && <p className="text-sm text-signal-error mt-2">{error}</p>}
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary rounded-md text-text-primary font-medium hover:bg-border-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-action-primary rounded-md text-action-primary-inverted font-medium hover:bg-action-primary-hover"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateHouseholdModal;