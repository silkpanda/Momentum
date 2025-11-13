// =========================================================
// silkpanda/momentum/app/components/family/FamilyDashboard.tsx
// Main component for the "Family View" page.
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';
import { IStoreItem } from '../store/StoreItemList';
import { Loader, AlertTriangle, User, Award, ShoppingCart } from 'lucide-react';
import FamilyTasksModal from './FamilyTasksModal';
import FamilyStoreModal from './FamilyStoreModal';

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
        task.assignedToProfileIds.some(profile => profile._id === member.familyMemberId._id)
    ).length;

    return (
        <button
            onClick={onSelect}
            className="flex flex-col items-center justify-center p-6 bg-bg-surface rounded-lg shadow-md border border-border-subtle 
                       hover:border-action-primary hover:shadow-lg transition-all transform hover:-translate-y-1"
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
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for managing modals
    const [selectedMember, setSelectedMember] = useState<IHouseholdMemberProfile | null>(null);
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

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
            const [householdResponse, taskResponse, storeResponse] = await Promise.all([
                fetch('/api/v1/households', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/v1/tasks', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/v1/store-items', { headers: { 'Authorization': `Bearer ${token}` } }),
            ]);

            if (!householdResponse.ok) throw new Error('Failed to fetch household members.');
            if (!taskResponse.ok) throw new Error('Failed to fetch tasks.');
            if (!storeResponse.ok) throw new Error('Failed to fetch store items.');

            const householdData = await householdResponse.json();
            const taskData = await taskResponse.json();
            const storeData = await storeResponse.json();

            setMembers(householdData.data.household.memberProfiles || []);
            setTasks(taskData.data.tasks || []);
            setStoreItems(storeData.data.storeItems || []);

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
    const handleSelectMember = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        // This is a placeholder; you could open a specific modal here,
        // but the prompt implies clicking the member card is the main selection.
        // For now, we'll make the buttons below open the modals.
    };

    const openTasks = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsTasksModalOpen(true);
    };

    const openStore = (member: IHouseholdMemberProfile) => {
        setSelectedMember(member);
        setIsStoreModalOpen(true);
    };

    const handleModalClose = () => {
        setIsTasksModalOpen(false);
        setIsStoreModalOpen(false);
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
                {members
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map((member) => (
                        <div key={member._id} className="flex flex-col space-y-2">
                            <MemberCard
                                member={member}
                                tasks={tasks}
                                onSelect={() => handleSelectMember(member)}
                            />
                            {/* Action buttons for this member */}
                            <button
                                onClick={() => openTasks(member)}
                                className="w-full inline-flex items-center justify-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                                             bg-bg-surface border border-border-subtle text-text-primary 
                                             hover:bg-border-subtle"
                            >
                                <Award className="w-4 h-4 mr-1.5" />
                                View Tasks
                            </button>
                            <button
                                onClick={() => openStore(member)}
                                className="w-full inline-flex items-center justify-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                                             bg-bg-surface border border-border-subtle text-text-primary 
                                             hover:bg-border-subtle"
                            >
                                <ShoppingCart className="w-4 h-4 mr-1.5" />
                                View Store
                            </button>
                        </div>
                    ))}
            </div>

            {/* --- Modals --- */}
            {isTasksModalOpen && selectedMember && (
                <FamilyTasksModal
                    member={selectedMember}
                    allTasks={tasks}
                    token={token!}
                    onClose={handleModalClose}
                />
            )}

            {isStoreModalOpen && selectedMember && (
                <FamilyStoreModal
                    member={selectedMember}
                    allItems={storeItems}
                    token={token!}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default FamilyDashboard;