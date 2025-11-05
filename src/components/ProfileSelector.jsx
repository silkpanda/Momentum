// src/components/ProfileSelector.jsx (Logs added)

import React from 'react';

export default function ProfileSelector({
  profiles,
  selectedProfile,
  onSelectProfile,
  userProfile,
}) {
  const sortLogic = (a, b) => {
    if (a.id === userProfile.id) return -1;
    if (b.id === userProfile.id) return 1;
    return a.display_name.localeCompare(b.display_name);
  };

  const adminProfiles = profiles.filter((p) => p.is_admin).sort(sortLogic);
  const managedProfiles = profiles.filter((p) => !p.is_admin).sort(sortLogic);

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <h3 className="w-full text-lg font-semibold text-text-primary mb-2">
        Who is completing tasks?
      </h3>

      {/* --- Render Parents Group --- */}
      {adminProfiles.length > 0 && (
        <div className="w-full contents">
          <h4 className="w-full text-base font-medium text-text-secondary mb-2">
            Parents
          </h4>
          {adminProfiles.map((profile) => {
            // FIX: Refactored to define only the color, using the fallback.
            const color = profile?.color || 'managed-gray';
            const initial = profile?.display_name
              ? profile.display_name.charAt(0).toUpperCase()
              : '?';

            // --- ADDED LOG ---
            // FIX: Updated log to reflect the new `color` variable name.
            console.log(
              `ProfileSelector: Rendering '${profile.display_name}' with color '${color}'. Applying class: 'bg-${color}'`
            );
            // -----------------

            return (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg w-28 h-32 transition-all duration-150
                ${
                  selectedProfile && selectedProfile.id === profile.id
                    ? 'bg-action-primary text-text-on-primary shadow-lg ring-2 ring-action-primary-hover'
                    : 'bg-bg-surface-2 hover:bg-bg-surface-hover'
                }`}
              >
                <div
                  // FIX: Concatenating the full class string in the JSX for best static analysis.
                  className={`w-16 h-16 rounded-full flex items-center justify-center bg-${color} mb-2`}
                >
                  <span className="text-2xl font-semibold text-white">
                    {initial}
                  </span>
                </div>
                <span className="font-medium text-sm truncate">
                  {profile.display_name}
                </span>
                <span className="text-xs text-text-secondary mt-1">
                  (Parent)
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* --- Render Children Group --- */}
      {managedProfiles.length > 0 && (
        <div className="w-full contents">
          <h4 className="w-full text-base font-medium text-text-secondary mb-2 mt-4">
            Children
          </h4>
          {managedProfiles.map((profile) => {
            // FIX: Refactored to define only the color, using the fallback.
            const color = profile?.color || 'managed-gray';
            const initial = profile?.display_name
              ? profile.display_name.charAt(0).toUpperCase()
              : '?';

            // --- ADDED LOG ---
            // FIX: Updated log to reflect the new `color` variable name.
            console.log(
              `ProfileSelector: Rendering '${profile.display_name}' with color '${color}'. Applying class: 'bg-${color}'`
            );
            // -----------------

            return (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg w-28 h-32 transition-all duration-150
                ${
                  selectedProfile && selectedProfile.id === profile.id
                    ? 'bg-action-primary text-text-on-primary shadow-lg ring-2 ring-action-primary-hover'
                    : 'bg-bg-surface-2 hover:bg-bg-surface-hover'
                }`}
              >
                <div
                  // FIX: Concatenating the full class string in the JSX for best static analysis.
                  className={`w-16 h-16 rounded-full flex items-center justify-center bg-${color} mb-2`}
                >
                  <span className="text-2xl font-semibold text-white">
                    {initial}
                  </span>
                </div>
                <span className="font-medium text-sm truncate">
                  {profile.display_name}
                </span>
                <span className="text-xs text-text-secondary mt-1">
                  (Child)
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}