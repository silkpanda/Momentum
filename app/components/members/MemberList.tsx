// =========================================================
// silkpanda/momentum-web/app/components/members/MemberList.tsx
// Renders the list of family members (Phase 2.2)
// NOW INCLUDES EDIT AND DELETE FUNCTIONALITY
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertTriangle, UserPlus, Trash, Edit, User } from 'lucide-react';
import { useSession } from '../layout/SessionContext'; // Import our new hook
import AddMemberModal from './AddMemberModal'; // Import the new modal
import EditMemberModal from './EditMemberModal';   // Import Edit Modal
import DeleteMemberModal from './DeleteMemberModal'; // Import Delete Modal

// --- Interfaces ---
// Based on API Model
export interface IChildProfile { // Export interface for use in modals
    memberRefId: {
        _id: string;
        firstName: string;
    };
    profileColor: string;
    pointsTotal: number;
    _id: string; // Sub-document ID
}

interface IParentRef {
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

// --- Member Item Component ---
const MemberItem: React.FC<{
    member: IChildProfile;
    onEdit: () => void;      // Add onEdit handler
    onDelete: () => void;    // Add onDelete handler
}> = ({ member, onEdit, onDelete }) => (
    <li className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
        <div className="flex items-center space-x-4">
            {/* Profile Color from Governance Doc */}
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: member.profileColor }}
            >
                {member.memberRefId.firstName.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="text-base font-medium text-text-primary">{member.memberRefId.firstName}</p>
                <p className="text-sm text-text-secondary">Child Profile</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            {/* Points Total */}
            <div className="text-center">
                <p className="text-lg font-semibold text-action-primary">{member.pointsTotal}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>

            {/* Actions */}
            <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Member">
                <Edit className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-text-secondary hover:text-signal-alert transition-colors" title="Remove Member">
                <Trash className="w-4 h-4" />
            </button>
        </div>
    </li>
);

// --- Main Member List Component ---
const MemberList: React.FC = () => {
    const [household, setHousehold] = useState<IHousehold | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Renamed state

    // Add state for Edit and Delete Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<IChildProfile | null>(null);

    // Use the session context to get the householdId and token
    const { householdId, token } = useSession();

    // Wrap fetch in useCallback so it can be reused
    const fetchHouseholdData = useCallback(async () => {
        if (!householdId || !token) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }

        setLoading(true); // Set loading true on re-fetch
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
                // API returns populated data on GET
                setHousehold(data.data.household);
                setError(null); // Clear previous errors
            } else {
                throw new Error(data.message || 'Could not retrieve data.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [householdId, token]);

    useEffect(() => {
        fetchHouseholdData(); // Call fetch on initial load
    }, [fetchHouseholdData]);

    // Handler to add the new member to the list instantly
    // Modified to trigger a full re-fetch to ensure data is correct
    const handleMemberAdded = () => {
        fetchHouseholdData();
    };

    // Handler for when an edit is successful
    const handleMemberUpdated = () => {
        fetchHouseholdData(); // Re-fetch to get updated, populated data
    };

    // Handler for when a delete is successful
    const handleMemberDeleted = () => {
        fetchHouseholdData(); // Re-fetch to get updated list
    };

    // Click Handlers for opening modals
    const openEditModal = (member: IChildProfile) => {
        setSelectedMember(member);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (member: IChildProfile) => {
        setSelectedMember(member);
        setIsDeleteModalOpen(true);
    };

    if (loading && !household) { // Only show full load if no household data exists yet
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

    if (!household) return null; // Should be covered by loading/error

    return (
        <div className="w-full">
            {/* Header and "Add Member" Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {household.childProfiles.length} Child Profile(s)
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

            {/* Member List */}
            {household.childProfiles.length > 0 ? (
                <ul className="space-y-4">
                    {household.childProfiles.map((member) => (
                        <MemberItem
                            key={member.memberRefId._id}
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
                    householdId={householdId}
                    onClose={() => setIsAddModalOpen(false)}
                    onMemberAdded={handleMemberAdded}
                    // Pass the list of already used colors
                    usedColors={household.childProfiles.map(p => p.profileColor)}
                />
            )}

            {/* Conditionally render Edit Modal */}
            {isEditModalOpen && selectedMember && (
                <EditMemberModal
                    member={selectedMember}
                    householdId={householdId}
                    onClose={() => setIsEditModalOpen(false)}
                    onMemberUpdated={handleMemberUpdated}
                    usedColors={household.childProfiles.map(p => p.profileColor)}
                />
            )}

            {/* Conditionally render Delete Modal */}
            {isDeleteModalOpen && selectedMember && (
                <DeleteMemberModal
                    member={selectedMember}
                    householdId={householdId}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onMemberDeleted={handleMemberDeleted}
                />
            )}
        </div>
    );
};

export default MemberList;