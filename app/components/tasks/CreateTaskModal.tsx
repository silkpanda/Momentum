// =========================================================
// silkpanda/momentum/momentum-e07d696d5dc5be6d5d5681cef733d2cb80fb1772/app/components/tasks/CreateTaskModal.tsx
// REFACTORED for Unified Task Assignment Model (API v3)
// =========================================================
'use client';

import React, { useState } from 'react';
import { Award, Check, Loader, Type, X, AlertTriangle, UserCheck } from 'lucide-react';
import { ITask } from './TaskList';
import { IHouseholdMemberProfile } from '../members/MemberList';

// Define the props the modal will accept
interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: (newTask: ITask) => void;
    householdMembers: IHouseholdMemberProfile[]; // Accept the list of members
}

// Define the state for the form data
interface TaskFormState {
    taskName: string;
    description: string;
    pointsValue: number;
    assignedToProfileIds: string[]; // Use new field name
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated, householdMembers }) => {
    const [formData, setFormData] = useState<TaskFormState>({
        taskName: '',
        description: '',
        pointsValue: 10, // Default points
        assignedToProfileIds: [], // Use new field name
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Add taskName validation
        if (formData.taskName.trim() === '') {
            setError('Task Name is a mandatory field.');
            return;
        }
        if (formData.pointsValue < 1) {
            setError('Points must be at least 1.');
            return;
        }

        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('momentum_token');

        try {
            // POST to the 'createTask' endpoint
            //
            const response = await fetch('/api/v1/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    taskName: formData.taskName,
                    description: formData.description,
                    pointsValue: formData.pointsValue,
                    assignedToProfileIds: formData.assignedToProfileIds, // Send new field
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create task.');
            }

            // Pass the new task (data.data.task) back to the parent list
            onTaskCreated(data.data.task);
            onClose(); // Close the modal on success

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to toggle member assignment
    const toggleAssignment = (profileId: string) => { // Use profileId
        setFormData(prevData => {
            const currentAssigned = prevData.assignedToProfileIds;
            if (currentAssigned.includes(profileId)) {
                // Remove ID
                return { ...prevData, assignedToProfileIds: currentAssigned.filter(id => id !== profileId) };
            } else {
                // Add ID
                return { ...prevData, assignedToProfileIds: [...currentAssigned, profileId] };
            }
        });
    };

    return (
        // Modal Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal Content */}
            <div
                className="relative w-full max-w-lg p-6 bg-bg-surface rounded-xl shadow-xl border border-border-subtle"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle"
                >
                    <X className="w-5 h-5" />
                </button>

                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">

                    <h3 className="text-xl font-medium text-text-primary">Create a New Task</h3>
                    <p className="text-sm text-text-secondary pb-2">
                        Fill in the details for the new task.
                    </p>

                    {/* Task Name Input */}
                    <div className="space-y-1">
                        <label htmlFor="taskName" className="block text-sm font-medium text-text-secondary">
                            Task Name (Mandatory)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Type className="h-5 w-5 text-text-secondary" />
                            </div>
                            <input
                                id="taskName"
                                name="taskName"
                                type="text"
                                value={formData.taskName}
                                onChange={(e) => {
                                    setFormData({ ...formData, taskName: e.target.value });
                                    if (error) setError(null);
                                }}
                                placeholder="e.g., 'Empty the dishwasher'"
                                className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface"
                            />
                        </div>
                    </div>

                    {/* Points Value Input */}
                    <div className="space-y-1">
                        <label htmlFor="pointsValue" className="block text-sm font-medium text-text-secondary">
                            Points Value (Mandatory)
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
                                value={formData.pointsValue}
                                onChange={(e) => setFormData({ ...formData, pointsValue: parseInt(e.target.value, 10) || 1 })}
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
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                    key={member._id} // Use sub-document _id
                                    title={`Assign to ${member.displayName}`}
                                    onClick={() => toggleAssignment(member._id)} // Use sub-document _id
                                    className={`flex items-center space-x-2 p-2 pr-3 rounded-full border transition-all
                            ${formData.assignedToProfileIds.includes(member._id) // Check new field
                                            ? 'bg-action-primary/10 border-action-primary text-action-primary'
                                            : 'bg-bg-surface border-border-subtle text-text-secondary hover:bg-border-subtle'}`}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                        style={{ backgroundColor: member.profileColor || '#808080' }} // Add fallback
                                    >
                                        {member.displayName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium">{member.displayName}</span>
                                    {formData.assignedToProfileIds.includes(member._id) && ( // Check new field
                                        <UserCheck className="w-4 h-4" />
                                    )}
                                </button>
                            )) : (
                                <p className="text-sm text-text-secondary p-2">No members available to assign.</p>
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
                        Create Task
                    </button>

                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;