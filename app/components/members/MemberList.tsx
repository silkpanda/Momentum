// =========================================================
// silkpanda/momentum-web/app/components/members/MemberList.tsx
// Renders the list of family members (Phase 2.2)
// REFACTORED: Displays Parents and Children in a unified list
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertTriangle, UserPlus, Trash, Edit, User } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import DeleteMemberModal from './DeleteMemberModal';

// --- Interfaces ---
//
export interface IChildProfile {
    memberRefId: {
        _id: string;
        firstName: string;
    };
    profileColor: string;
    pointsTotal: number;
    _id: string; // Sub-document ID
}

export interface IParentRef {
    _id: string;
    firstName: string;
    email: string;
}

export interface IHousehold {
    _id: string;
    householdName: string;
    parentRefs: IParentRef[];
    childProfiles: IChildProfile[];
}

// --- Unified Member Display Interface ---
export interface IMemberDisplay {
    memberId: string;      // The FamilyMember _id
    firstName: string;
    role: 'Parent' | 'Child';
    email?: string;          // Only for parents
    profileColor?: string;   // Only for children
    pointsTotal?: number;    // Only for children
    isSelf: boolean;         // Is this the logged-in user?
}

// --- Unified Member Item Component ---
const MemberItem: React.FC<{
    member: IMemberDisplay;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ member, onEdit, onDelete }) => (
    <li className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
        <div className="flex items-center space-x-4">
            {/* Conditional Avatar: Color for child, icon for parent */}
            {member.profileColor ? (
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: member.profileColor }}
                >
                    {member.firstName.charAt(0).toUpperCase()}
                </div>
            ) : (
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-border-subtle text-text-secondary"
                >
                    <User className="w-5 h-5" />
                </div>
            )}
            <div>
                <p className="text-base font-medium text-text-primary">
                    {member.firstName} {member.isSelf && '(You)'}
                </p>
                <p className="text-sm text-text-secondary">
                    {member.role === 'Parent' ? member.email : 'Child Profile'}
                </p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            {/* Conditional Points: Only show for children */}
            {member.role === 'Child' && (
                <div className="text-center">
                    <p className="text-lg font-semibold text-action-primary">{member.pointsTotal}</p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>
            )}

            {/* Actions */}
            <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Member">
                <Edit className="w-4 h-4" />
            </button>
            {/* Disable delete button for parents (and self) */}
            <button
                onClick={onDelete}
                className="p-2 text-text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={member.role === 'Parent' ? 'Parents cannot be removed from this screen' : 'Remove Member'}
                disabled={member.role === 'Parent'}
            >
                <Trash className="w-4 h-4" />
            </button>
        </div>
    </li>
);

// --- Main Member List Component ---
const MemberList: React.FC = () => {
    // Store the normalized, combined list of members
    const [allMembers, setAllMembers] = useState<IMemberDisplay[]>([]);
    const [childMembers, setChildMembers] = useState<IChildProfile[]>([]); // Keep for color logic
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<IMemberDisplay | null>(null); // Unified state

    // Use the session context to get the householdId and token
    const { user, householdId, token } = useSession(); // Get logged-in user

    // Wrap fetch in useCallback so it can be reused
    const fetchHouseholdData = useCallback(async () => {
        if (!householdId || !token || !user) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch the full household data, which includes the list of members
            //
            const response = await fetch(`/api/v1/households/${householdId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch household data.');
            }
            const data = await response.json();
            if (data.status === 'success') {
                const household: IHousehold = data.data.household;

                // --- Normalize Data ---
                const parents: IMemberDisplay[] = household.parentRefs.map(p => ({
                    memberId: p._id,
                    firstName: p.firstName,
                    role: 'Parent',
                    email: p.email,
                    isSelf: p._id === user._id, // Check if this is the logged-in user
                }));

                const children: IMemberDisplay[] = household.childProfiles.map(c => ({
                    memberId: c.memberRefId._id,
                    firstName: c.memberRefId.firstName,
                    role: 'Child',
                    profileColor: c.profileColor,
                    pointsTotal: c.pointsTotal,
                    isSelf: false, // Children cannot be the logged-in user
                }));

                // Combine lists, putting "self" first
                setAllMembers([
                    ...parents.filter(p => p.isSelf),
                    ...parents.filter(p => !p.isSelf),
                    ...children,
                ]);
                setChildMembers(household.childProfiles); // Store for color logic
                setError(null);
            } else {
                throw new Error(data.message || 'Could not retrieve data.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [householdId, token, user]); // Add user dependency

    useEffect(() => {
        fetchHouseholdData(); // Call fetch on initial load
    }, [fetchHouseholdData]);

    const handleMemberAdded = () => {
        fetchHouseholdData();
    };

    const handleMemberUpdated = () => {
        fetchHouseholdData();
    };

    const handleMemberDeleted = () => {
        fetchHouseholdData();
    };

    // Click Handlers for opening modals
    const openEditModal = (member: IMemberDisplay) => {
        setSelectedMember(member);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (member: IMemberDisplay) => {
        setSelectedMember(member);
        setIsDeleteModalOpen(true);
    };

    if (loading && allMembers.length === 0) { // Update loading check
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading members...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header and "Add Member" Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {allMembers.length} Total Member(s)
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                {/* Mandated Button: Icon + Text Label */}
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Add New Member
                </button>
            </div>

            {/* Render Unified Member List */}
            {allMembers.length > 0 ? (
                <ul className="space-y-4">
                    {allMembers.map((member) => (
                        <MemberItem
                            key={member.memberId}
                            member={member}
                            onEdit={() => openEditModal(member)}
                            onDelete={() => openDeleteModal(member)}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                    <User className="w-12 h-12 mx-auto text-text-secondary/50" />
                    <p className="mt-4 text-text-secondary">No child profiles found.</p>
                    <p className="text-sm text-text-secondary/80">Click "Add New Member" to get started.</p>
                </div>
            )}

            {/* Conditionally render the modal */}
            {isAddModalOpen && (
                <AddMemberModal
                    householdId={householdId!} // householdId is guaranteed to exist here
                    onClose={() => setIsAddModalOpen(false)}
                    onMemberAdded={handleMemberAdded}
                    // Pass the list of already used colors
                    usedColors={childMembers.map(p => p.profileColor)}
                />
            )}

            {/* Conditionally render Edit Modal */}
            {isEditModalOpen && selectedMember && (
                <EditMemberModal
                    member={selectedMember}
                    householdId={householdId!}
                    onClose={() => setIsEditModalOpen(false)}
                    onMemberUpdated={handleMemberUpdated}
                    usedColors={childMembers.map(p => p.profileColor)}
                />
            )}

            {/* Conditionally render Delete Modal */}
            {isDeleteModalOpen && selectedMember && (
                <DeleteMemberModal
                    member={selectedMember}
                    householdId={householdId!}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onMemberDeleted={handleMemberDeleted}
                />
            )}
        </div>
    );
};

export default MemberList;