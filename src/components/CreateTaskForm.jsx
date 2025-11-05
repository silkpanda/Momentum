// src/components/CreateTaskForm.jsx

import React from 'react';

export default function CreateTaskForm({
  householdId,
  profiles,
  creatorProfile,
}) {
  return (
    <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">
        Create New Task
      </h3>
      <p className="text-text-secondary">
        (Task Creation Form placeholder.)
      </p>
    </div>
  );
}