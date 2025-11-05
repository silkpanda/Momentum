// src/components/ManageProfilesList.jsx (FIXED: "Managed Profiles" is now "Children")

import React from 'react';
import { Pencil } from 'lucide-react';

export default function ManageProfilesList({ profiles, onEditProfile }) {
  // We filter the profiles into two lists.
  // We do NOT re-sort them, so they respect the static 'created_at' order.
  const adminProfiles = profiles.filter((p) => p.is_admin);
  const managedProfiles = profiles.filter((p) => !p.is_admin);

  // Helper function to render the list item
  const renderProfileItem = (profile) => {
    const colorClass = profile?.color
      ? `bg-${profile.color}`
      : 'bg-managed-gray';
    const initial = profile?.display_name
      ? profile.display_name.charAt(0).toUpperCase()
      : '?';

    return (
      <div
        key={profile.id}
        className="flex items-center justify-between p-3 bg-bg-canvas rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
          >
            <span className="text-lg font-semibold text-white">{initial}</span>
          </div>
          <div>
            <span className="font-medium text-text-primary">
              {profile.display_name}
            </span>
            <span className="block text-xs text-text-secondary">
              {profile.is_admin ? 'Parent' : 'Child'}
            </span>
          </div>
        </div>
        <button
          onClick={() => onEditProfile(profile)}
          className="p-2 text-text-secondary rounded-md hover:bg-bg-surface-hover hover:text-action-primary"
          aria-label={`Edit ${profile.display_name}`}
        >
          <Pencil size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 bg-bg-surface-2 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">
        Manage Profiles
      </h3>

      {/* --- Render Parents Group --- */}
      <h4 className="text-sm font-medium text-text-secondary mt-4 mb-2 border-b border-border-muted pb-1">
        Parents
      </h4>
      <div className="space-y-3">
        {adminProfiles.length > 0 ? (
          adminProfiles.map(renderProfileItem)
        ) : (
          <p className="p-3 text-sm text-text-disabled">No admin profiles.</p>
        )}
      </div>

      {/* --- Render Children Group --- */}
      {/* --- THIS IS THE FIX --- */}
      <h4 className="text-sm font-medium text-text-secondary mt-6 mb-2 border-b border-border-muted pb-1">
        Children
      </h4>
      <div className="space-y-3">
        {managedProfiles.length > 0 ? (
          managedProfiles.map(renderProfileItem)
        ) : (
          <p className="p-3 text-sm text-text-disabled">
            No children added yet.
          </p>
          // -----------------------
        )}
      </div>
    </div>
  );
}