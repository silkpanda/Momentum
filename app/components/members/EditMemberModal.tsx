// =========================================================
// silkpanda/momentum/momentum-fac69d659346d6b7b01871d803baa24f6dfaccee/app/components/members/EditMemberModal.tsx
// REFACTORED for Unified Membership Model (API v3)
// =========================================================
'use client';

import React, { useState, useEffect } from 'react';
import { User, Loader, X, AlertTriangle, Check, Palette, Mail } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from './MemberList';

interface EditMemberModalProps {
    member: IHouseholdMemberProfile;
    householdId: string;
    onClose: () => void;
    onMemberUpdated: () => void;
    usedColors: string[];
}

// Profile colors from Governance Doc
const PROFILE_COLORS = [
    { name: 'Blueberry', hex: '#4285F4' }, { name: 'Celtic Blue', hex: '#1967D2' },
    { name: 'Selective Yellow', hex: '#FBBC04' }, { name: 'Pigment Red', hex: '#F72A25' },
    { name: 'Sea Green', hex: '#34A853' }, { name: 'Dark Spring Green', hex: '#188038' },
    { name: 'Tangerine', hex: '#FF8C00' }, { name: 'Grape', hex: '#8E24AA' },
    { name: 'Flamingo', hex: '#E67C73' }, { name: 'Peacock', hex: '#039BE5' },
];

const EditMemberModal: React.FC<EditMemberModalProps> = ({
    member, householdId, onClose, onMemberUpdated, usedColors
}) => {
    const [displayName, setDisplayName] = useState(member.displayName);
    const [selectedColor, setSelectedColor] = useState(member.profileColor || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    // Colors available are any not used OR the one currently used by this member
    const availableColors = PROFILE_COLORS.filter(
        c => !usedColors.includes(c.hex) || c.hex === member.profileColor
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (displayName.trim() === '') {
            setError('Display Name is required.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // PATCH to the 'updateMemberProfile' endpoint
            // The API endpoint uses the sub-document _id
            //
            const response = await fetch(`/api/v1/households/members/${member._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // Build conditional request body
                body: JSON.stringify(
                    member.role === 'Parent'
                        ? { displayName: displayName } // Parents can only update displayName
                        : { displayName: displayName, profileColor: selectedColor } // Children can update both
                ),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update member.');
            }

            // Call the refresh function passed from the parent
            onMemberUpdated();
            onClose(); // Close the modal on success

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle"
                >
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <h3 className="text-xl font-medium text-text-primary">
                        Edit {member.role === 'Parent' ? 'Your Profile' : 'Member Profile'}
                    </h3>

                    {/* Display Name Input */}
                    <div className="space-y-1">
                        <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary">
                            Display Name
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-5 w-5 text-text-secondary" />
                            </div>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                            />
                        </div>
                    </div>

                    {/* Conditionally show Email (read-only) for Parents */}
                    {member.role === 'Parent' && (
                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                                Email (Cannot be changed)
                            </label>
                            <div className="relative rounded-md">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Mail className="h-5 w-5 text-text-secondary/70" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={member.familyMemberId.email || 'N/A'}
                                    disabled
                                    className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-secondary bg-bg-canvas"
                                />
                            </div>
                        </div>
                    )}

                    {/* Conditionally show Color Picker for Children */}
                    {member.role === 'Child' && (
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-text-secondary">
                                Profile Color
                            </label>
                            <div className="flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border border-border-subtle">
                                {availableColors.map((color) => (
                                    <button
                                        type="button"
                                        key={color.hex}
                                        title={color.name}
                                        onClick={() => setSelectedColor(color.hex)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all
                              ${selectedColor === color.hex ? 'border-action-primary ring-2 ring-action-primary/50 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        style={{ backgroundColor: color.hex }}
                                    >
                                        {selectedColor === color.hex && <Check className="w-5 h-5 text-white m-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center text-sm text-signal-alert">
                            <AlertTriangle className="w-4 h-4 mr-1.5" /> {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-colors
                        ${isLoading ? 'bg-action-primary/60' : 'bg-action-primary hover:bg-action-hover'}`}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditMemberModal;