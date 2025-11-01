// src/components/TaskListItem.jsx

import React from 'react';

/**
 * Renders a single task as a list item in the dashboard.
 * * @param {object} task - The task object from the database.
 * @param {array} profiles - The array of all household profiles for lookup.
 * @param {string} currentProfileId - The ID of the currently ACTIVE profile (from ProfileContext).
 * @param {boolean} isAuthUserAdmin - Is the currently LOGGED IN user an Admin? (For approval)
 * @param {function} onComplete - Handler to mark the task as complete.
 * @param {function} onApprove - Handler to approve the task and award points.
 * @param {function} onReject - Handler to reject the task and set status to pending.
 */
function TaskListItem({ task, profiles, currentProfileId, isAuthUserAdmin, onComplete, onApprove, onReject }) { // <--- ADDED PROPS
    
    // Look up the assigned profile
    const assignedProfile = profiles.find(p => p.id === task.assigned_profile_id);
    
    // --- DECISION LOGIC ---
    // 1. Is the currently active profile the one assigned to the task?
    const isAssignedToCurrentActiveProfile = currentProfileId === task.assigned_profile_id;
    
    // 2. Should the member see the 'Mark Complete' button?
    const showCompleteButton = isAssignedToCurrentActiveProfile && task.status === 'pending';
    
    // 3. Should the Admin see the 'Approve/Reject' buttons?
    const showApprovalButtons = isAuthUserAdmin && task.status === 'completed';
    // --- END DECISION LOGIC ---
    
    
    // Default values if the profile can't be found (e.g., deleted member)
    const profileName = assignedProfile ? assignedProfile.display_name : 'Unknown Member';
    const profileColor = assignedProfile ? assignedProfile.profile_color : 'palette-gray-500'; 
    
    // --- Styling Logic (unchanged) ---
    const hasDynamicColor = assignedProfile && assignedProfile.profile_color;
    
    const borderColor = hasDynamicColor 
        ? `var(--color-${profileColor})` 
        : 'var(--color-border-primary)';

    // --- Due Date Formatting & Overdue Check (unchanged) ---
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    const isOverdue = dueDate && dueDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && task.status === 'pending';
    
    const dueDateDisplay = dueDate 
        ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No Due Date';

    // --- Status Styling ---
    let statusClass = 'bg-bg-muted text-text-secondary';
    if (task.status === 'pending') statusClass = 'bg-palette-warning-500 text-text-on-action';
    if (task.status === 'completed') statusClass = 'bg-palette-success-500 text-text-on-action'; // Yellow/Green for completed (waiting approval)
    if (task.status === 'approved') statusClass = 'bg-palette-success-500 text-text-on-action'; // Green for approved
    if (isOverdue) statusClass = 'bg-palette-danger-500 text-text-on-action';
    
    const statusText = isOverdue ? 'OVERDUE' : task.status.toUpperCase();
    
    // --- Render ---
    return (
        <div 
            className="flex items-center justify-between bg-bg-surface p-4 rounded-lg shadow-sm mb-3 border-l-4 transition duration-150 ease-in-out hover:shadow-md"
            style={{ borderColor: borderColor, backgroundColor: 'var(--color-bg-surface)' }}
        >
            {/* Left Section: Title and Points (unchanged) */}
            <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold truncate text-text-primary mb-1" title={task.title}>
                    {task.title}
                </p>
                <div className="flex items-center space-x-3 text-sm">
                    {/* Assigned To Badge */}
                    <span 
                        className={`px-2 py-0.5 rounded-full text-xs font-medium`}
                        style={{ 
                            backgroundColor: hasDynamicColor ? `var(--color-${profileColor})` : 'var(--color-bg-muted)', 
                            color: hasDynamicColor ? 'var(--color-text-inverted)' : 'var(--color-text-primary)' 
                        }}
                    >
                        {profileName}
                    </span>
                    {/* Points Value */}
                    <span className="text-action-primary font-bold">
                        +{task.point_value} Pts
                    </span>
                </div>
            </div>

            {/* Right Section: Due Date and Status/Actions */}
            <div className="flex items-center space-x-4 ml-4">
                {/* Due Date (unchanged) */}
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-text-secondary">Due</p>
                    <p className={`text-sm font-medium ${isOverdue ? 'text-signal-danger' : 'text-text-primary'}`}>
                        {dueDateDisplay}
                    </p>
                </div>
                
                {/* Status/Action Button Container */}
                <div className={`min-w-[100px] text-right ${showApprovalButtons ? 'flex space-x-2' : ''}`}>
                    
                    {/* OPTION 1: ADMIN APPROVAL BUTTONS */}
                    {showApprovalButtons ? (
                        <>
                            <button
                                onClick={() => onApprove(task.id, task.title)}
                                className="px-3 py-1 text-xs font-bold rounded-full bg-signal-success text-text-on-action hover:bg-palette-success-500/80 transition duration-150"
                                title="Approve and Award Points"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => onReject(task.id, task.title)}
                                className="px-3 py-1 text-xs font-bold rounded-full bg-signal-danger text-text-on-action hover:bg-palette-danger-500/80 transition duration-150"
                                title="Reject and send back to Pending"
                            >
                                Reject
                            </button>
                        </>
                    ) 
                    
                    /* OPTION 2: MEMBER COMPLETE BUTTON */
                    : showCompleteButton ? (
                        <button
                            onClick={() => onComplete(task.id, task.title)}
                            className="px-3 py-1 text-xs font-bold rounded-full bg-action-primary text-text-on-action hover:bg-action-primary-hover transition duration-150"
                        >
                            Mark Complete
                        </button>
                    ) 
                    
                    /* OPTION 3: STATIC STATUS BADGE */
                    : (
                        <span className={`px-3 py-1 text-xs font-bold rounded-full text-text-on-action ${statusClass}`}>
                            {statusText}
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
}

export default TaskListItem;