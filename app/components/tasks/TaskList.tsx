// =========================================================
// silkpanda/momentum/momentum-fac69d659346d6b7b01871d803baa24f6dfaccee/app/components/tasks/TaskList.tsx
// REFACTORED for Unified Task Assignment Model (API v3)
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS FIX: Synchronized ITask interface with API model.
// TELA CODICIS CLEANUP: Removed local CollapsibleTaskSection
// and imported from ../layout/CollapsibleSection
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Award, Plus, Loader, AlertTriangle, Trash, Edit, CheckSquare, ChevronDown, UserCheck, UserX } from 'lucide-react';
import CreateTaskModal from './CreateTaskModal';
import { useSession } from '../layout/SessionContext';
import EditTaskModal from './EditTaskModal';
import DeleteTaskModal from './DeleteTaskModal';
import { IHouseholdMemberProfile } from '../members/MemberList'; // Use new unified interface
import CollapsibleSection from '../layout/CollapsibleSection'; // TELA CODICIS: Import component

// --- Task Interface ---
//
export interface ITask {
    _id: string;
    taskName: string;
    description: string;
    pointsValue: number;
    isCompleted: boolean;
    //
    // TELA CODICIS FIX: Renamed 'assignedToProfileIds' to 'assignedToRefs' to match API model.
    //
    assignedToRefs: { // FIX: Renamed from assignedToProfileIds
        _id: string; // This is the FamilyMember ID
        firstName: string; // FIX: API populates firstName, not displayName
        profileColor?: string;
    }[];
    householdRefId: string;
}

// --- Task Item Component ---
const TaskItem: React.FC<{
    task: ITask;
    onEdit: () => void;
    onDelete: () => void;
    onMarkComplete: () => void; // New prop for completion
    isCompleting: boolean; // New prop for loading state
}> = ({ task, onEdit, onDelete, onMarkComplete, isCompleting }) => {

    // Helper to get initials
    const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <li className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
            <div className="flex items-center space-x-4">
                {/* Icon uses semantic color role */}
                <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                    <Award className="w-5 h-5 text-action-primary" />
                </div>
                <div>
                    <p className="text-base font-medium text-text-primary">{task.taskName}</p>
                    <p className="text-sm text-text-secondary">{task.description || 'No description'}</p>

                    {/* Display assigned member avatars */}
                    {task.assignedToRefs && task.assignedToRefs.length > 0 && ( // FIX: Use assignedToRefs
                        <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-text-secondary mr-1">Assigned:</span>
                            {task.assignedToRefs.map(member => ( // FIX: Use assignedToRefs
                                <div
                                    key={member._id} // Use the FamilyMember ID
                                    title={member.firstName} // FIX: Use firstName
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                    style={{ backgroundColor: member.profileColor || '#808080' }} // Add fallback
                                >
                                    {getInitials(member.firstName)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {/* Points Value uses signal color */}
                <div className="text-center">
                    <p className="text-lg font-semibold text-signal-success">+{task.pointsValue}</p>
                    <p className="text-xs text-text-secondary">Points</p>
                </div>

                {/* --- Task Actions & Status --- */}

                {/* State 1: Loading */}
                {isCompleting && (
                    <div className="flex items-center justify-center w-24">
                        <Loader className="w-5 h-5 text-action-primary animate-spin" />
                    </div>
                )}

                {/* State 2: Already Completed */}
                {task.isCompleted && !isCompleting && (
                    <div className="flex items-center text-signal-success">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Done</span>
                    </div>
                )}

                {/* State 3: Ready to be Completed */}
                {!task.isCompleted && !isCompleting && (
                    <button
                        onClick={onMarkComplete}
                        disabled={task.assignedToRefs.length === 0} // FIX: Use assignedToRefs
                        title={
                            task.assignedToRefs.length > 0 // FIX: Use assignedToRefs
                                ? `Mark '${task.taskName}' complete`
                                : 'Task must be assigned to award points'
                        }
                        className="p-2 text-text-secondary hover:text-signal-success transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <CheckSquare className="w-5 h-5" />
                    </button>
                )}

                <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Task" disabled={task.isCompleted || isCompleting}>
                    <Edit className="w-4 h-4" />
                </button>
                <button onClick={onDelete} className="p-2 text-text-secondary hover:text-signal-alert transition-colors" title="Delete Task" disabled={isCompleting}>
                    <Trash className="w-4 h-4" />
                </button>
            </div>
        </li>
    );
};

// TELA CODICIS: Removed local CollapsibleTaskSection
// component definition. Now importing from /layout.

// --- Main Task List Component ---
const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<ITask[]>([]);
    // State to hold the list of members for assignment
    const [householdMembers, setHouseholdMembers] = useState<IHouseholdMemberProfile[]>([]); // Use new interface
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null); // For loading state

    // Get session context for API calls
    const { token, householdId } = useSession(); // Get householdId

    // This function now fetches BOTH tasks and household members
    const fetchData = useCallback(async () => {
        if (!token || !householdId) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            // REFACTORED (v4): Call the single Embedded BFF aggregation endpoint
            const response = await fetch('/web-bff/tasks/page-data', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch task page data from BFF.');
            }

            const data = await response.json();

            if (data.tasks && data.householdMembers) {
                setTasks(data.tasks);
                setHouseholdMembers(data.householdMembers);
            } else {
                throw new Error('BFF returned malformed data.');
            }

            setError(null); // Clear error on success

        } catch (e: any) {
            // FIX: Use a combined, more descriptive error message
            setError(`Failed to load tasks or members for assignment: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [token, householdId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // Call fetch on initial load

    const handleTaskCreated = () => {
        fetchData(); // Re-fetch for consistency
    };

    const handleTaskUpdated = () => {
        fetchData(); // Re-fetch to get updated data
    };

    const handleTaskDeleted = () => {
        fetchData(); // Re-fetch to get updated list
    };

    // New Handler for Marking Task Complete
    const handleMarkComplete = async (task: ITask) => {
        // Prevent multiple clicks
        if (completingTaskId) return;

        // Safety checks
        if (task.isCompleted) {
            setError("Task is already complete.");
            return;
        }
        if (task.assignedToRefs.length === 0) { // FIX: Use assignedToRefs
            setError("Task must be assigned to a member to award points.");
            return;
        }

        // Get the first assigned member's ID
        const memberIdToAward = task.assignedToRefs[0]._id; // FIX: Use assignedToRefs

        setCompletingTaskId(task._id);
        setError(null);

        try {
            // REFACTORED (v4): Call the Embedded BFF endpoint
            const response = await fetch(`/web-bff/tasks/${task._id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ memberId: memberIdToAward }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to complete task.');
            }

            fetchData(); // Refresh the list on success
        } catch (e: any) {
            setError(e.message);
        } finally {
            setCompletingTaskId(null); // Clear loading state
        }
    };

    // Click Handlers for opening modals
    const openEditModal = (task: ITask) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (task: ITask) => {
        setSelectedTask(task);
        setIsDeleteModalOpen(true);
    };

    // Render Loading state
    if (loading && tasks.length === 0) { // Only show full load on init
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading tasks...</p>
            </div>
        );
    }

    // Render Error state
    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    // Render Main Content
    return (
        <div className="w-full">
            {/* Header and Add Task Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Configured
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                {/* Mandated Button: Icon + Text Label */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Task
                </button>
            </div>

            {/* --- NEW: Filter tasks into sections --- */}
            {(() => {
                const completedTasks = tasks.filter(t => t.isCompleted);
                const incompleteTasks = tasks.filter(t => !t.isCompleted);
                const assignedIncompleteTasks = incompleteTasks.filter(
                    t => !t.isCompleted && t.assignedToRefs && t.assignedToRefs.length > 0 // FIX: Use assignedToRefs
                );
                const unassignedIncompleteTasks = incompleteTasks.filter(
                    t => !t.isCompleted && (!t.assignedToRefs || t.assignedToRefs.length === 0) // FIX: Use assignedToRefs
                );

                return (
                    tasks.length > 0 ? (
                        <div className="space-y-4">
                            <CollapsibleSection
                                Icon={UserCheck}
                                title="Assigned (Incomplete)"
                                count={assignedIncompleteTasks.length}
                                defaultOpen={true}
                                emptyMessage="No assigned (incomplete) tasks."
                            >
                                {assignedIncompleteTasks.map((task) => (
                                    <TaskItem key={task._id} task={task} onEdit={() => openEditModal(task)} onDelete={() => openDeleteModal(task)} onMarkComplete={() => handleMarkComplete(task)} isCompleting={completingTaskId === task._id} />
                                ))}
                            </CollapsibleSection>

                            <CollapsibleSection
                                Icon={UserX}
                                title="Unassigned"
                                count={unassignedIncompleteTasks.length}
                                emptyMessage="No unassigned tasks."
                            >
                                {unassignedIncompleteTasks.map((task) => (
                                    <TaskItem key={task._id} task={task} onEdit={() => openEditModal(task)} onDelete={() => openDeleteModal(task)} onMarkComplete={() => handleMarkComplete(task)} isCompleting={completingTaskId === task._id} />
                                ))}
                            </CollapsibleSection>

                            <CollapsibleSection
                                Icon={CheckSquare}
                                title="Complete"
                                count={completedTasks.length}
                                emptyMessage="No completed tasks."
                            >
                                {completedTasks.map((task) => (
                                    <TaskItem key={task._id} task={task} onEdit={() => openEditModal(task)} onDelete={() => openDeleteModal(task)} onMarkComplete={() => handleMarkComplete(task)} isCompleting={completingTaskId === task._id} />
                                ))}
                            </CollapsibleSection>
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                            <p className="text-text-secondary">No tasks found. Click "Add New Task" to get started.</p>
                        </div>
                    )
                );
            })()}

            {/* Conditionally render the modal */}
            {isCreateModalOpen && (
                <CreateTaskModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={handleTaskCreated}
                    householdMembers={householdMembers} // Pass members
                />
            )}

            {/* Conditionally render Edit Modal */}
            {isEditModalOpen && selectedTask && (
                <EditTaskModal
                    task={selectedTask}
                    onClose={() => setIsEditModalOpen(false)}
                    onTaskUpdated={handleTaskUpdated}
                    householdMembers={householdMembers} // Pass members
                />
            )}

            {/* Conditionally render Delete Modal */}
            {isDeleteModalOpen && selectedTask && (
                <DeleteTaskModal
                    task={selectedTask}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onTaskDeleted={handleTaskDeleted}
                />
            )}
        </div>
    );
};

export default TaskList;