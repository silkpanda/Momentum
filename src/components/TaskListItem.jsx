// src/components/TaskListItem.jsx (FIXED: Used correct 'text-base-content' class)

import React from 'react';

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
  
  const profileColor = assignedProfile?.profile_color || 'bg-base-300';
  const profileName = assignedProfile?.display_name || 'Unassigned';

  const handleComplete = () => {
    console.log(`FPO: Complete task ${task.id}`);
  };

  const handleUndo = () => {
    console.log(`FPO: Undo task ${task.id}`);
  };

  const renderTaskAction = () => {
    if (task.status === 'completed') {
      return (
        <button 
          className="btn btn-ghost btn-circle btn-sm"
          onClick={handleUndo}
        >
          {/* 🛠️ FIX: Replaced 'text-content-secondary' with 'text-base-content' + opacity */}
          <ArrowUturnDownIcon className="h-5 w-5 text-base-content opacity-60" />
        </button>
      );
    }

    if (task.status === 'pending') {
      return (
        <button 
          className="btn btn-ghost btn-circle btn-sm"
          onClick={handleComplete}
        >
          {/* 🛠️ FIX: Replaced 'text-content-secondary' with 'text-base-content' + opacity */}
          <CheckCircleIconOutline className="h-6 w-6 text-base-content opacity-60 hover:text-success" />
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
        {/* 🛠️ FIX: Replaced 'text-content-secondary' with 'text-base-content' + opacity */}
        <span className="ml-2 text-xs font-medium text-base-content opacity-80 w-16 truncate">
          {profileName}
        </span>
      </div>

      {/* Task Title + Points */}
      <div className="flex-grow mx-2">
        {/* 🛠️ FIX: Added 'text-base-content' and handled completed state */}
        <p className={`font-medium text-base-content ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </p>
        {/* 🛠️ FIX: Replaced 'text-content-secondary' with 'text-base-content' + opacity */}
        <span className="text-sm font-light text-base-content opacity-80">
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