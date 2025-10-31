// src/components/CreateManagedProfileModal.jsx (Complete & Cleaned)

import React from 'react';
import CreateManagedProfileForm from './CreateManagedProfileForm';

// CRITICAL FIX: Removed redundant householdId from props
function CreateManagedProfileModal({ isOpen, onClose, onProfileAdded }) { 
  if (!isOpen) return null;

  const handleSuccess = (newProfileId) => {
    onClose();
    onProfileAdded(newProfileId); 
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} 
    >
      <div 
        className="bg-bg-surface p-8 rounded-lg shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()} 
      >
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Add New Family Member</h2>
        <p className="text-text-secondary mb-6">Create a managed profile for a child or family member.</p>

        {/* CRITICAL FIX: Removed householdId from prop pass */}
        <CreateManagedProfileForm 
          onSuccess={handleSuccess}
        />
        
        <div className="mt-6 text-right">
            <button
                onClick={onClose}
                className="text-text-secondary hover:text-action-primary text-sm font-medium"
            >
                Cancel
            </button>
        </div>

      </div>
    </div>
  );
}

export default CreateManagedProfileModal;