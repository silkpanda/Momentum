// =========================================================
// silkpanda/momentum/app/components/dashboard/DashboardHome.tsx
// New component for the main dashboard content (Phase 3.5)
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../layout/SessionContext';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';
import { IStoreItem } from '../store/StoreItemList';
import { Loader, AlertTriangle, Users, Award, ShoppingCart, User, UserCheck, UserX, Gift } from 'lucide-react';
import { CheckSquare, CalendarDays } from 'lucide-react'; // Import new icons

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
const MyTaskItem: React.FC<{ task: ITask }> = ({ task }) => (
    <li className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg border border-border-subtle">
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Award className="w-4 h-4 text-action-primary" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary">{task.taskName}</p>
                <p className="text-xs text-text-secondary">{task.description || 'No description'}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-semibold text-signal-success">+{task.pointsValue}</p>
            <p className="text-xs text-text-secondary">Points</p>
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
            const [householdResponse, taskResponse, storeResponse] = await Promise.all([
                fetch('/api/v1/households', {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch('/api/v1/tasks', {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch('/api/v1/store-items', {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ]);

            if (!householdResponse.ok) throw new Error('Failed to fetch household members.');
            if (!taskResponse.ok) throw new Error('Failed to fetch tasks.');
            if (!storeResponse.ok) throw new Error('Failed to fetch store items.');

            const householdData = await householdResponse.json();
            const taskData = await taskResponse.json();
            const storeData = await storeResponse.json();

            if (householdData.status === 'success') {
                setMembers(householdData.data.household.memberProfiles || []);
            } else {
                throw new Error(householdData.message || 'Could not retrieve members.');
            }

            if (taskData.status === 'success') {
                setTasks(taskData.data.tasks || []);
            } else {
                throw new Error(taskData.message || 'Could not retrieve tasks.');
            }

            if (storeData.status === 'success') {
                setStoreItems(storeData.data.storeItems || []);
            } else {
                throw new Error(storeData.message || 'Could not retrieve store items.');
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
    const storeItemCount = storeItems.length;

    // New Task Stat Calculations
    const completeCount = tasks.filter(t => t.isCompleted).length;
    const incompleteTasks = tasks.filter(t => !t.isCompleted);
    const assignedIncompleteCount = incompleteTasks.filter(t => t.assignedToProfileIds && t.assignedToProfileIds.length > 0).length;
    const unassignedIncompleteCount = incompleteTasks.filter(t => !t.assignedToProfileIds || t.assignedToProfileIds.length === 0).length;

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

                                {/* Show points for all members */}
                                <div className="text-right">
                                    <p className="text-base font-semibold text-action-primary">{member.pointsTotal}</p>
                                    <p className="text-xs text-text-secondary">Points</p>
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
                <div className="flex items-center space-x-3">
                    <Gift className="w-8 h-8 text-action-primary" />
                    <div>
                        <p className="text-3xl font-semibold text-text-primary">{storeItemCount}</p>
                        <p className="text-sm text-text-secondary">Item(s) in store</p>
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
                                <MyTaskItem key={task._id} task={task} />
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