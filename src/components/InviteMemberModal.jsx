// src/components/InviteMemberModal.jsx (COMPLETE)

import React from 'react';
import InviteMemberForm from './InviteMemberForm';

function InviteMemberModal({ isOpen, onClose, onInviteSuccess }) {
  if (!isOpen) return null;

  const handleSuccess = (resultMessage) => {
    onClose();
    // CRITICAL: Pass the RPC's success message back to the dashboard
    onInviteSuccess(resultMessage); 
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
        <h2 className="text-2xl font-bold mb-4 text-text-primary">Invite a Co-Admin</h2>
        <p className="text-text-secondary mb-6">
          Invite your co-parent or partner to join your household with Admin privileges.
        </p>

        <InviteMemberForm 
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

export default InviteMemberModal;