// src/components/CreateOrJoinModal.jsx (NEW COMPONENT)

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import LoadingSpinner from './LoadingSpinner';

function CreateOrJoinModal({ isOpen, onClose, onJoinSuccess, onShowCreate }) {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleJoin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Sanity check for code length before hitting the network
        if (inviteCode.length !== 6) {
            setError('The invite code must be exactly 6 digits.');
            setLoading(false);
            return;
        }

        try {
            console.log(`Attempting to join with code: ${inviteCode}`);
            
            // CRITICAL RPC CALL: Attempt to join the household
            const { data: householdId, error: rpcError } = await supabase.rpc('join_household_by_code', { target_code: inviteCode });

            if (rpcError) {
                // If the RPC throws an error (e.g., "Invalid code"), display it
                throw rpcError;
            }

            console.log(`Successfully joined household: ${householdId}`);
            
            // Success: Close the modal and trigger the dashboard redirect via the handler
            onJoinSuccess(householdId); 

        } catch (err) {
            console.error('Join by Code Failed:', err);
            // The RPC message (P0001) will be displayed here, e.g., "Invalid, expired..."
            setError(err.message || 'Join failed. Check code validity.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // Backdrop and Modal Shell
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-bg-surface p-8 rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-text-primary">Welcome! Set Up Your Household</h2>
                <p className="text-text-secondary mb-6">You need to be part of a household to continue.</p>

                {error && <div className="bg-signal-error-bg text-signal-error p-3 rounded-md mb-4 text-sm">{error}</div>}

                {/* --- 1. Join Existing Household --- */}
                <form onSubmit={handleJoin} className="mb-8 p-4 border border-border-primary rounded-md">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Join Existing Household</h3>
                    <label htmlFor="inviteCode" className="block text-sm font-medium text-text-secondary mb-2">
                        Enter 6-Digit Invite Code
                    </label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            id="inviteCode"
                            // CRITICAL: Ensure input is capitalized/trimmed to match RPC expectations
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                            maxLength="6"
                            className="flex-grow px-3 py-2 bg-bg-muted border border-border-primary rounded-md text-xl tracking-widest text-center"
                            disabled={loading}
                            required
                        />
                        <button
                            type="submit"
                            // Button is disabled until 6 characters are entered
                            disabled={loading || inviteCode.length !== 6}
                            className="py-2 px-4 bg-action-primary text-on-action font-semibold rounded-md hover:bg-action-primary-hover disabled:opacity-50 transition duration-150"
                        >
                            {loading ? 'Joining...' : 'Join'}
                        </button>
                    </div>
                </form>

                {/* --- 2. Create New Household --- */}
                <div className="text-center">
                    <p className="text-text-secondary mb-3">
                        — OR —
                    </p>
                    <button
                        onClick={onShowCreate}
                        className="w-full py-2 px-4 bg-bg-muted text-text-primary font-semibold rounded-md border border-border-primary hover:bg-palette-gray-100 transition duration-150"
                        disabled={loading}
                    >
                        Create New Household
                    </button>
                </div>

                {loading && <LoadingSpinner text="Checking Code..." />}
            </div>
        </div>
    );
}

export default CreateOrJoinModal;