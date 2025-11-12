// =========================================================
// silkpanda/momentum-web/app/components/tasks/CreateTaskModal.tsx
// Modal for creating a new task (Phase 2.4)
// NOW INCLUDES TASK ASSIGNMENT
// =========================================================
'use client';

import React, { useState } from 'react';
import { Award, Check, Loader, MoveLeft, Type, X, AlertTriangle, ArrowRight, UserCheck, Users } from 'lucide-react';
import { ITask } from './TaskList'; // We will export ITask from TaskList
import { IChildProfile } from '../members/MemberList'; // Import member interface

// Define the props the modal will accept
interface CreateTaskModalProps {
    onClose: () => void;
    onTaskCreated: (newTask: ITask) => void;
    householdMembers: IChildProfile[]; // Accept the list of members
}

// Define the state for the form data
interface TaskFormState {
    taskName: string;
    description: string;
    pointsValue: number;
    assignedToRefs: string[]; // Add state for assignments
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated, householdMembers }) => {
    // State for the form's multi-step "Progressive Disclosure"
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<TaskFormState>({
        taskName: '',
        description: '',
        pointsValue: 10, // Default points
        assignedToRefs: [], // Initialize as empty array
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNextStep = () => {
        if (formData.taskName.trim() === '') {
            setError('Task Name is a mandatory field.');
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.pointsValue < 1) {
            setError('Points must be at least 1.');
            return;
        }

        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('momentum_token');

        try {
            // POST to the 'createTask' endpoint
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
                    assignedToRefs: formData.assignedToRefs, // Send assigned IDs
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
    const toggleAssignment = (memberId: string) => {
        setFormData(prevData => {
            const currentAssigned = prevData.assignedToRefs;
            if (currentAssigned.includes(memberId)) {
                // Remove ID
                return { ...prevData, assignedToRefs: currentAssigned.filter(id => id !== memberId) };
            } else {
                // Add ID
                return { ...prevData, assignedToRefs: [...currentAssigned, memberId] };
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

                    {/* Step 1: Progressive Disclosure (Task Name) */}
                    {step === 1 && (
                        <>
                            <h3 className="text-xl font-medium text-text-primary">Create a New Task (1/2)</h3>
                            <p className="text-sm text-text-secondary pb-2">
                                Start with the task name. You can add more details on the next step.
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

                            {/* Step 1 Error */}
                            {error && (
                                <div className="flex items-center text-sm text-signal-alert">
                                    <AlertTriangle className="w-4 h-4 mr-1.5" /> {error}
                                </div>
                            )}

                            {/* Step 1 Navigation */}
                            <button
                                type="button"
                                onClick={handleNextStep}
                                className="w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                           text-white bg-action-primary hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                            >
                                Next
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </button>
                        </>
                    )}

                    {/* Step 2: Progressive Disclosure (Details) */}
                    {step === 2 && (
                        <>
                            <h3 className="text-xl font-medium text-text-primary">Task Details (2/2)</h3>

                            {/* Task Name (Read-only) */}
                            <div className="p-3 bg-border-subtle/50 rounded-md border border-border-subtle">
                                <p className="text-sm font-medium text-text-secondary">Task:</p>
                                <p className="text-base text-text-primary">{formData.taskName}</p>
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
                                            key={member.memberRefId._id}
                                            title={`Assign to ${member.memberRefId.firstName}`}
                                            onClick={() => toggleAssignment(member.memberRefId._id)}
                                            className={`flex items-center space-x-2 p-2 pr-3 rounded-full border transition-all
                                ${formData.assignedToRefs.includes(member.memberRefId._id)
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
                                            {formData.assignedToRefs.includes(member.memberRefId._id) && (
                                                <UserCheck className="w-4 h-4" />
                                            )}
                                        </button>
                                    )) : (
                                        <p className="text-sm text-text-secondary p-2">No child profiles available to assign.</p>
                                    )}
                                </div>
                            </div>

                            {/* Step 2 Error */}
                            {error && (
                                <div className="flex items-center text-sm text-signal-alert">
                                    <AlertTriangle className="w-4 h-4 mr-1.5" /> {error}
                                </div>
                            )}

                            {/* Step 2 Navigation */}
                            <div className="flex items-center space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                             text-text-secondary bg-border-subtle hover:bg-border-subtle/80"
                                >
                                    <MoveLeft className="w-5 h-5 mr-2" />
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`w-1/2 flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                              text-white transition-colors
                              ${isLoading ? 'bg-action-primary/60' : 'bg-action-primary hover:bg-action-hover'}`}
                                >
                                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 mr-2" />}
                                    Create Task
                                </button>
                            </div>
                        </>
                    )}

                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;