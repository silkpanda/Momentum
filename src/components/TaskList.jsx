// src/components/TaskList.jsx

import React from 'react';

export default function TaskList({ householdId, selectedProfile }) {
  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold mb-4 text-text-primary">
        Tasks for {selectedProfile.display_name}
      </h3>
      <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
        <p className="text-text-secondary">
          (Task List placeholder for {selectedProfile.display_name}.)
        </p>
      </div>
    </div>
  );
}