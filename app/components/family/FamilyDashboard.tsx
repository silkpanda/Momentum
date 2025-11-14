// =========================================================
// silkpanda/momentum/app/components/family/FamilyDashboard.tsx
// Main component for the "Family View" page.
// REFACTORED to use a single "one-click" action modal.
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS CLEANUP: Removed token prop-drilling
// to FamilyMemberActionModal.
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';
import { IStoreItem } from '../store/StoreItemList';
import { Loader, AlertTriangle, User, Award, ShoppingCart } from 'lucide-react';
import FamilyMemberActionModal from './FamilyMemberActionModal'; // <-- NEW IMPORT

// --- Member Card Component ---
interface MemberCardProps {
    member: IHouseholdMemberProfile;
    tasks: ITask[];
    onSelect: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, tasks, onSelect }) => {

    // Get count of incomplete tasks assigned to this member
    const assignedTaskCount = tasks.filter(task =>
        !task.isCompleted &&
        task.assignedToRefs.some(profile => profile._id === member.familyMemberId._id) // FIX: Use assignedToRefs
    ).length;

    return (
        <button
            onClick={onSelect}
            className="flex flex-col items-center justify-center p-6 bg-bg-surface rounded-lg shadow-md border border-border-subtle 
                       hover:border-action-primary hover:shadow-lg transition-all transform hover:-translate-y-1 w-full"
        >
            <div
                className="w-24 h-24 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-4xl mb-4"
                style={{ backgroundColor: member.profileColor || '#6B7280' }}
            >
                {member.role === 'Parent' ? <User className="w-12 h-12" /> : member.displayName.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-semibold text-text-primary">{member.displayName}</h3>
            <p className="text-sm text-text-secondary mb-2">{member.role}</p>

            {/* Stats */}
            <div className="flex items-center space-x-4 mt-2">
                <div className="text-center">
                    <p className="text-lg font-semibold text-action-primary">{member.pointsTotal}</p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-semibold text-text-primary">{assignedTaskCount}</p>
                    <p className="text-xs text-text-secondary">Tasks</p>
                </div>
            </div>
        </button>
    );
};


// --- Main Family Dashboard Component ---
const FamilyDashboard: React.FC = () => {
    const { token, householdId } = useSession();
    const [memberProfiles, setMemberProfiles] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for managing modals
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    // Fetch all data
    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            setError('Authentication error. Please log in again.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // REFACTORED (v4): Call the single Embedded BFF aggregation endpoint
            const response = await fetch('/web-bff/family/page-data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch family page data from BFF');
            }

            const data = await response.json();

            if (data.memberProfiles && data.tasks && data.storeItems) {
                setMemberProfiles(data.memberProfiles);
                setTasks(data.tasks);
                setStoreItems(data.storeItems);
            } else {
                throw new Error('BFF returned malformed data');
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handlers to open modals
    const openActionModal = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsActionModalOpen(true);
    };

    const handleModalClose = () => {
        setIsActionModalOpen(false);
        setSelectedMember(null);
        fetchData(); // Re-fetch data on close to show updated points/tasks
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading family data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div>
            {/* Member Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {memberProfiles
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map((member) => (
                        <MemberCard
                            key={member._id}
                            member={member}
                            tasks={tasks}
                            onSelect={() => openActionModal(member)} // <-- MODIFIED
                        />
                    ))}
            </div>

            {/* --- Modals --- */}
            {isActionModalOpen && selectedMember && (
                <FamilyMemberActionModal
                    member={selectedMember}
                    allTasks={tasks}
                    allItems={storeItems}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default FamilyDashboard;