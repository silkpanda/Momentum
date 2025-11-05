// src/views/FamilyView.jsx (FIXED: Import paths)

import React from 'react';
// --- THIS IS THE FIX ---
// Added .jsx to all component imports
import ProfileSelector from '../components/ProfileSelector.jsx';
import TaskList from '../components/TaskList.jsx';
// -----------------------

export default function FamilyView({
  profiles,
  selectedProfile,
  onSelectProfile,
  userProfile,
  householdId,
}) {
  return (
    <div className="lg-col-span-3">
      <ProfileSelector
        profiles={profiles}
        selectedProfile={selectedProfile}
        onSelectProfile={onSelectProfile}
        userProfile={userProfile}
      />

      {selectedProfile ? (
        <TaskList
          householdId={householdId}
          selectedProfile={selectedProfile}
        />
      ) : (
        <div className="p-6 bg-bg-surface-2 rounded-lg text-text-secondary">
          Please select a profile to view tasks.
        </div>
      )}
    </div>
  );
}