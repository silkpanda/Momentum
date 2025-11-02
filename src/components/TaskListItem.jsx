// src/components/TaskListItem.jsx (FIXED: Uses display_name and profile_color)

import React from 'react';
// (useProfile hook was already correctly removed from this file)

// Icons
import { 
  CheckCircleIcon,
  PlusCircleIcon,
  ArrowUturnDownIcon
} from '@heroicons/react/24/solid';
import { 
  CheckCircleIcon as CheckCircleIconOutline,
  NoSymbolIcon
} from '@heroicons/react/24/outline';


function TaskListItem({ task, profiles }) {

  const assignedProfile = profiles.find(p => p.id === task.assigned_profile_id);
  
  // 🛠️ FIX: Use 'profile_color' and 'display_name'
  const profileColor = assignedProfile?.profile_color || 'bg-base-300';
  const profileName = assignedProfile?.display_name || 'Unassigned';

  // FPO: Task action handlers
  const handleComplete = () => {
    console.log(`FPO: Complete task ${task.id}`);
  };

  const handleUndo = () => {
    console.log(`FPO: Undo task ${task.id}`);
  };

  const handleClaim = () => {
    console.log(`FPO: Claim task ${task.id}`);
  };

  const renderTaskAction = () => {
    if (task.status === 'completed') {
      return (
        <button 
          className="btn btn-ghost btn-circle btn-sm"
          onClick={handleUndo}
        >
          <ArrowUturnDownIcon className="h-5 w-5 text-content-secondary" />
        </button>
      );
    }

    if (task.status === 'pending') {
      return (
        <button 
          className="btn btn-ghost btn-circle btn-sm"
          onClick={handleComplete}
        >
          <CheckCircleIconOutline className="h-6 w-6 text-content-secondary hover:text-success" />
        </button>
      );
    }
    
    return null;
  };

  return (
    <div className="flex items-center p-2 mb-2 bg-base-100 rounded-lg shadow">
      {/* Profile Color + Name */}
      <div className="flex-shrink-0 flex items-center">
        <div className={`w-3 h-10 rounded-full ${profileColor}`}></div>
        <span className="ml-2 text-xs font-medium text-content-secondary w-16 truncate">
          {profileName}
        </span>
      </div>

      {/* Task Title + Points */}
      <div className="flex-grow mx-2">
        <p className={`font-medium ${task.status === 'completed' ? 'line-through text-content-secondary' : ''}`}>
          {task.title}
        </p>
        <span className="text-sm font-light text-content-secondary">
          {task.point_value} pts
        </span>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        {renderTaskAction()}
      </div>
    </div>
  );
}

export default TaskListItem;