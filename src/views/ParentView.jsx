// src/views/ParentView.jsx (FIXED: Import paths)

import React from 'react';
// --- THIS IS THE FIX ---
// Added .jsx to all component imports
import InviteMemberForm from '../components/InviteMemberForm.jsx';
import ManageProfilesList from '../components/ManageProfilesList.jsx';
import CreateTaskForm from '../components/CreateTaskForm.jsx';
// -----------------------

// We'll add this component placeholder for the admin task list
const AdminTaskList = () => (
  <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">
      All Household Tasks
    </h3>
    <p className="text-text-secondary">(Admin Task List placeholder)</p>
  </div>
);

export default function ParentView({
  householdId,
  profiles,
  userProfile,
  onEditProfile,
}) {
  return (
    <>
      {/* Left Column (Admin Actions) */}
      <div className="lg:col-span-2 space-y-8">
        <CreateTaskForm
          householdId={householdId}
          profiles={profiles}
          creatorProfile={userProfile}
        />
        <AdminTaskList />
      </div>

      {/* Right Column (Admin Tools) */}
      <div className="lg:col-span-1 space-y-8">
        <InviteMemberForm householdId={householdId} />
        <ManageProfilesList
          profiles={profiles}
          onEditProfile={onEditProfile}
        />
      </div>
    </>
  );
}