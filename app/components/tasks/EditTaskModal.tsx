// =========================================================
// silkpanda/momentum-web/app/components/tasks/EditTaskModal.tsx
// Modal for editing an existing task (Phase 2.4)
// NOW INCLUDES TASK ASSIGNMENT
// =========================================================
'use client';

import React, { useState } from 'react';
import { Award, Check, Loader, Type, X, AlertTriangle, UserCheck } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { ITask } from './TaskList'; // Import interface from TaskList
import { IChildProfile } from '../members/MemberList'; // Import member interface

interface EditTaskModalProps {
    task: ITask; // The task being edited
    onClose: () => void;
    onTaskUpdated: () => void; // Function to trigger a re-fetch
    householdMembers: IChildProfile[]; // Accept the list of members
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({
    task, onClose, onTaskUpdated, householdMembers
}) => {
    // Pre-fill state from the task prop
    const [taskName, setTaskName] = useState(task.taskName);
    const [description, setDescription] = useState(task.description);
    const [pointsValue, setPointsValue] = useState(task.pointsValue);
    // Pre-fill assigned IDs from the populated task object
    const [assignedIds, setAssignedIds] = useState<string[]>(
        () => task.assignedToRefs.map(member => member._id)
    );

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useSession();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (taskName.trim() === '') {
            setError('Task Name is required.');
            return;
        }
        if (pointsValue < 1) {
            setError('Points must be at least 1.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // PATCH to the 'updateTask' endpoint
            //
            const response = await fetch(`/api/v1/tasks/${task._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    taskName,
                    description,
                    pointsValue,
                    assignedToRefs: assignedIds, // Send the updated array
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update task.');
            }

            // Call the refresh function passed from the parent
            onTaskUpdated();
            onClose(); // Close the modal on success

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to toggle member assignment
    const toggleAssignment = (memberId: string) => {
        setAssignedIds(prevIds => {
            if (prevIds.includes(memberId)) {
                return prevIds.filter(id => id !== memberId); // Remove ID
            } else {
                return [...prevIds, memberId]; // Add ID
            }
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle"
                onClick={(e) => e.stopPropagation()} // Prevent closing
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle"
                >
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <h3 className="text-xl font-medium text-text-primary">Edit Task</h3>

                    {/* Task Name Input */}
                    <div className="space-y-1">
                        <label htmlFor="taskName" className="block text-sm font-medium text-text-secondary">
                            Task Name
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Type className="h-5 w-5 text-text-secondary" />
                            </div>
                            <input
                                id="taskName"
                                name="taskName"
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                            />
                        </div>
                    </div>

                    {/* Points Value Input */}
                    <div className="space-y-1">
                        <label htmlFor="pointsValue" className="block text-sm font-medium text-text-secondary">
                            Points Value
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Award className="h-5 w-5 text-text-secondary" />
                            </div>
                            <input
                                id="pointsValue"
                                name="pointsValue"
                                type="number"
                                min="1"
                                value={pointsValue}
                                onChange={(e) => setPointsValue(parseInt(e.target.value, 10) || 1)}
                                className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                            />
                        </div>
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1">
                        <label htmlFor="description" className="block text-sm font-medium text-text-secondary">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., 'Make sure all dishes are put away correctly.'"
                            className="block w-full rounded-md border border-border-subtle p-3 text-text-primary bg-bg-surface"
                        />
                    </div>

                    {/* Assign Members (Optional) */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-text-secondary">
                            Assign to (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border border-border-subtle">
                            {householdMembers.length > 0 ? householdMembers.map((member) => (
                                <button
                                    type="button"
                                    key={member.memberRefId._id}
                                    title={`Assign to ${member.memberRefId.firstName}`}
                                    onClick={() => toggleAssignment(member.memberRefId._id)}
                                    className={`flex items-center space-x-2 p-2 pr-3 rounded-full border transition-all
                            ${assignedIds.includes(member.memberRefId._id)
                                            ? 'bg-action-primary/10 border-action-primary text-action-primary'
                                            : 'bg-bg-surface border-border-subtle text-text-secondary hover:bg-border-subtle'}`}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                        style={{ backgroundColor: member.profileColor }}
                                    >
                                        {member.memberRefId.firstName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium">{member.memberRefId.firstName}</span>
                                    {assignedIds.includes(member.memberRefId._id) && (
                                        <UserCheck className="w-4 h-4" />
                                    )}
                                </button>
                            )) : (
                                <p className="text-sm text-text-secondary p-2">No child profiles available to assign.</p>
                            )}
                        </div>
                    </div>

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

export default EditTaskModal;