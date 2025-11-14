// =========================================================
// silkpanda/momentum/app/components/dashboard/DashboardHome.tsx
// Main component for the main dashboard content (Phase 3.5)
// REFACTORED (v4) to call Embedded Web BFF
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';
import { IStoreItem } from '../store/StoreItemList';
import { Loader, AlertTriangle, Users, Award, ShoppingCart, User, UserCheck, UserX, Gift } from 'lucide-react';
import { CheckSquare, CalendarDays, Package } from 'lucide-react'; // Import new icons

// --- Reusable Stat Card Component ---
interface StatCardProps {
    Icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ Icon, title, children }) => (
    <div className="bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle">
        <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Icon className="w-5 h-5 text-action-primary" />
            </div>
            <h2 className="text-xl font-medium text-text-primary">{title}</h2>
        </div>
        <div>{children}</div>
    </div>
);

// --- Reusable Task Item for "My Tasks" ---
const MyTaskItem: React.FC<{
    task: ITask;
    onMarkComplete: () => void;
    isCompleting: boolean;
}> = ({ task, onMarkComplete, isCompleting }) => (
    <li className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg border border-border-subtle min-h-[68px]">
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Award className="w-4 h-4 text-action-primary" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary">{task.taskName}</p>
                <p className="text-xs text-text-secondary">{task.description || 'No description'}</p>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="text-right">
                <p className="text-sm font-semibold text-signal-success">+{task.pointsValue}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>

            {/* Completion Button/Status */}
            <div className="w-10 text-right">
                {isCompleting ? (
                    <Loader className="w-5 h-5 text-action-primary animate-spin" />
                ) : (
                    <button
                        onClick={onMarkComplete}
                        title={`Mark '${task.taskName}' complete`}
                        className="p-2 text-text-secondary hover:text-signal-success transition-colors"
                    >
                        <CheckSquare className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </li>
);


// --- Main Dashboard Component ---
const DashboardHome: React.FC = () => {
    const { token, householdId, user } = useSession(); // Get current user
    const [members, setMembers] = useState<IHouseholdMemberProfile[]>([]);
    const [tasks, setTasks] = useState<ITask[]>([]);
    const [storeItems, setStoreItems] = useState<IStoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null); // New state
    const [error, setError] = useState<string | null>(null);

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
            const response = await fetch('/web-bff/dashboard/data', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data from BFF');
            }

            const data = await response.json();

            if (data.members && data.tasks && data.storeItems) {
                setMembers(data.members);
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

    if (loading) {
        // Use the standard dashboard loading component for the initial fetch
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle min-h-[150px] flex items-center justify-center">
                    <Loader className="w-6 h-6 text-action-primary animate-spin" />
                </div>
                <div className="bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle min-h-[150px] flex items-center justify-center">
                    <Loader className="w-6 h-6 text-action-primary animate-spin" />
                </div>
                <div className="bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle min-h-[150px] flex items-center justify-center">
                    <Loader className="w-6 h-6 text-action-primary animate-spin" />
                </div>
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

    // --- Calculate Stats ---

    // New Task Stat Calculations
    const completeCount = tasks.filter(t => t.isCompleted).length;
    const incompleteTasks = tasks.filter(t => !t.isCompleted);
    const assignedIncompleteCount = incompleteTasks.filter(t => t.assignedToProfileIds && t.assignedToProfileIds.length > 0).length;
    const unassignedIncompleteCount = incompleteTasks.filter(t => !t.assignedToProfileIds || t.assignedToProfileIds.length === 0).length;

    // Find current user's profile to get their points
    const currentUserProfile = members.find(m => m.familyMemberId._id === user?._id);
    const currentUserPoints = currentUserProfile?.pointsTotal ?? 0;

    // New Store Stat Calculations
    const availableRewardsCount = storeItems.filter(item => item.cost <= currentUserPoints).length;
    const futureRewardsCount = storeItems.filter(item => item.cost > currentUserPoints).length;


    /**
     * Helper to count assigned, incomplete tasks for a member.
     * We use the familyMemberId for matching.
     */
    const getAssignedTaskCount = (memberFamilyId: string) => {
        return tasks.filter(task =>
            !task.isCompleted &&
            task.assignedToProfileIds.some(profile => profile._id === memberFamilyId)
        ).length;
    };

    // Handler for completing a task
    const handleMarkComplete = async (task: ITask) => {
        if (completingTaskId || !user) return; // Prevent multiple clicks or action if user is null

        setCompletingTaskId(task._id);
        setError(null);

        try {
            // REFACTORED (v4): Call the Embedded Web BFF endpoint
            const response = await fetch(`/web-bff/tasks/${task._id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                // Pass the current logged-in user's ID as the member to award points
                body: JSON.stringify({ memberId: user._id }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to complete task.');
            }

            fetchData(); // Refresh all dashboard data
        } catch (e: any) {
            setError(e.message);
            // Don't clear loading state on error, so user doesn't retry
        } finally {
            setCompletingTaskId(null); // Clear loading state on success or error
        }
    };

    // Filter for the current user's *incomplete* tasks
    const myTasks = tasks.filter(
        (task) =>
            !task.isCompleted &&
            task.assignedToProfileIds.some((profile) => profile._id === user?._id)
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* --- Row 1: Summary Cards --- */}

            {/* Family Members Card */}
            <StatCard Icon={Users} title="Family Members">
                <ul className="space-y-3">
                    {members
                        .sort((a, b) => {
                            if (a.role === 'Parent' && b.role !== 'Parent') return -1;
                            if (a.role !== 'Parent' && b.role === 'Parent') return 1;
                            return a.displayName.localeCompare(b.displayName);
                        })
                        .map((member) => (
                            <li key={member._id} className="flex items-center justify-between space-x-3">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-medium text-sm"
                                        style={{ backgroundColor: member.profileColor || '#6B7280' }} // gray fallback
                                    >
                                        {/* Show User icon for Parents, Initials for Children */}
                                        {member.role === 'Parent' ? <User className="w-4 h-4" /> : member.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{member.displayName}</p>
                                        <p className="text-xs text-text-secondary">{member.role}</p>
                                    </div>
                                </div>

                                {/* Right Side: Stats (Tasks + Points) */}
                                <div className="flex items-center space-x-4">
                                    {/* Assigned Task Count */}
                                    <div className="text-center w-12">
                                        <p className="text-lg font-semibold text-text-primary">
                                            {getAssignedTaskCount(member.familyMemberId._id)}
                                        </p>
                                        <p className="text-xs text-text-secondary">Tasks</p>
                                    </div>

                                    {/* Points Total */}
                                    <div className="text-center w-12">
                                        <p className="text-lg font-semibold text-action-primary">{member.pointsTotal}</p>
                                        <p className="text-xs text-text-secondary">Points</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                </ul>
            </StatCard>

            {/* Task Status Card */}
            <StatCard Icon={Award} title="Task Status">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <UserCheck className="w-6 h-6 text-action-primary" />
                        <div>
                            <p className="text-3xl font-semibold text-text-primary">{assignedIncompleteCount}</p>
                            <p className="text-sm text-text-secondary">Assigned (Incomplete)</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <UserX className="w-6 h-6 text-text-secondary" />
                        <div>
                            <p className="text-3xl font-semibold text-text-primary">{unassignedIncompleteCount}</p>
                            <p className="text-sm text-text-secondary">Unassigned</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <CheckSquare className="w-6 h-6 text-signal-success" />
                        <div>
                            <p className="text-3xl font-semibold text-text-primary">{completeCount}</p>
                            <p className="text-sm text-text-secondary">Complete</p>
                        </div>
                    </div>
                </div>
            </StatCard>

            {/* Store Items Card */}
            <StatCard Icon={ShoppingCart} title="Reward Store">
                <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                        <Gift className="w-6 h-6 text-signal-success" />
                        <div>
                            <p className="text-3xl font-semibold text-text-primary">{availableRewardsCount}</p>
                            <p className="text-sm text-text-secondary">Available Rewards</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Package className="w-6 h-6 text-text-secondary" />
                        <div>
                            <p className="text-3xl font-semibold text-text-primary">{futureRewardsCount}</p>
                            <p className="text-sm text-text-secondary">Future Rewards</p>
                        </div>
                    </div>
                </div>
            </StatCard>

            {/* --- Row 2: User-Specific Content --- */}

            {/* My Tasks Card */}
            <div className="lg:col-span-2">
                <StatCard Icon={CheckSquare} title="My Tasks">
                    {myTasks.length > 0 ? (
                        <ul className="space-y-2">
                            {myTasks.map((task) => (
                                <MyTaskItem
                                    key={task._id}
                                    task={task}
                                    onMarkComplete={() => handleMarkComplete(task)}
                                    isCompleting={completingTaskId === task._id} />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-text-secondary text-center p-4">
                            You have no assigned tasks.
                        </p>
                    )}
                </StatCard>
            </div>

            {/* Calendar Placeholder Card */}
            <div className="lg:col-span-1">
                <StatCard Icon={CalendarDays} title="Calendar">
                    <div className="flex items-center justify-center min-h-[150px] bg-bg-canvas rounded-lg">
                        <p className="text-sm text-text-secondary">Calendar view coming soon.</p>
                    </div>
                </StatCard>
            </div>
        </div>
    );
};

export default DashboardHome;