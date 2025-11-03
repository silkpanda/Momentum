// src/components/InviteMemberModal.jsx (FIXED: Style Guide UI)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { XMarkIcon } from '@heroicons/react/24/solid';

function InviteMemberModal({ isOpen, onClose, householdId }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // FPO: This will be replaced by the 'inviteUserToHousehold' RPC
    console.log(`FPO: Calling inviteUserToHousehold RPC with email: ${email} and householdId: ${householdId}`);
    
    // Simulating RPC call
    try {
      // const { data, error } = await supabase.rpc('invite_user_to_household', {
      //   invitee_email: email,
      //   target_household_id: householdId
      // });
      
      // if (error) throw error;
      
      // FPO: Simulated success
      if (email === 'fail@test.com') {
        throw new Error('Test Error: User not found.');
      }
      
      await new Promise(res => setTimeout(res, 1000)); // Simulate network delay
      
      setSuccess(`Invite successfully sent to ${email}.`);
      setEmail(''); // Clear input on success
      
    } catch (rpcError) {
      console.error('AXIOM ERROR: Failed to send invite', rpcError);
      setError(rpcError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setEmail('');
    setError(null);
    setSuccess(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''} modal-bottom sm:modal-middle`}>
      <div className="modal-box bg-base-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Invite New Member</h3>
          <button 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={handleClose}
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <p className="text-sm opacity-80 mb-4">
          Invite another parent or guardian to your household using their email. They will be able to view and manage all profiles and tasks.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mb-4">
            <label className="label">
              <span className="label-text">Member's Email</span>
            </label>
            <input 
              type="email" 
              placeholder="parent@example.com" 
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-4">
              <span>{success}</span>
            </div>
          )}

          <div className="modal-action">
            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Send Invite'}
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

export default InviteMemberModal;