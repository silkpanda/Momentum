// =========================================================
// silkpanda/momentum/app/components/family/FamilyTasksModal.tsx
// Modal for viewing/completing tasks as a specific family member.
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle, CheckSquare, Loader } from 'lucide-react';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';

interface FamilyTasksModalProps {
    member: IHouseholdMemberProfile;
    allTasks: ITask[];
    token: string;
    onClose: () => void;
}

// Reusable Task Row
const MemberTaskItem: React.FC<{
    task: ITask;
    onComplete: () => void;
    isCompleting: boolean;
}> = ({ task, onComplete, isCompleting }) => (
    <li className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-subtle">
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
            <div className="w-10 text-right">
                {isCompleting ? (
                    <Loader className="w-5 h-5 text-action-primary animate-spin" />
                ) : (
                    <button
                        onClick={onComplete}
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

// Main Modal
const FamilyTasksModal: React.FC<FamilyTasksModalProps> = ({ member, allTasks, token, onClose }) => {

    const [tasks, setTasks] = useState(allTasks);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMarkComplete = async (task: ITask) => {
        if (completingTaskId) return;

        setCompletingTaskId(task._id);
        setError(null);

        try {
            const response = await fetch(`/api/v1/tasks/${task._id}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ memberId: member.familyMemberId._id }), // <-- Pass selected member's ID
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to complete task.');
            }

            // Optimistically update UI
            setTasks(currentTasks =>
                currentTasks.map(t =>
                    t._id === task._id ? { ...t, isCompleted: true } : t
                )
            );

        } catch (e: any) {
            setError(e.message);
        } finally {
            setCompletingTaskId(null);
        }
    };

    // Filter tasks for this specific member
    const incompleteTasks = tasks.filter(task =>
        !task.isCompleted &&
        task.assignedToProfileIds.some(profile => profile._id === member.familyMemberId._id)
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg p-6 bg-bg-canvas rounded-xl shadow-xl border border-border-subtle max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center space-x-3 pb-4 mb-4 border-b border-border-subtle">
                    <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: member.profileColor || '#6B7280' }}
                    >
                        {member.displayName.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-xl font-medium text-text-primary">
                        {member.displayName}'s Tasks
                    </h3>
                </div>

                {/* Error Display */}
                {error && (
                    <p className="text-sm text-signal-alert mb-2 text-center">{error}</p>
                )}

                {/* Task List */}
                <div className="flex-1 overflow-y-auto">
                    {incompleteTasks.length > 0 ? (
                        <ul className="space-y-2">
                            {incompleteTasks.map(task => (
                                <MemberTaskItem
                                    key={task._id}
                                    task={task}
                                    onComplete={() => handleMarkComplete(task)}
                                    isCompleting={completingTaskId === task._id}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-text-secondary text-center p-8">
                            No assigned tasks.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyTasksModal;