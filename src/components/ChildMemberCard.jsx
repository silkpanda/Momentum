import { PencilSquareIcon } from '@heroicons/react/24/solid';

export default function ChildMemberCard({ profile, onEdit }) {
  // --- THIS IS THE FIX (Robustness) ---
  // We set defaults in case profile.color or profile.display_name are missing
  const colorClass = profile?.color ? `bg-${profile.color}` : 'bg-managed-gray';
  const initial = profile?.display_name
    ? profile.display_name.charAt(0).toUpperCase()
    : '?';
  // ------------------------------------

  return (
    <div className="p-4 bg-bg-surface rounded-lg shadow-md flex flex-col items-center space-y-3">
      {/* --- This code replaces the icon and uses the safe variables --- */}
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClass}`}
      >
        <span className="text-2xl font-semibold text-white">{initial}</span>
      </div>
      {/* --------------------------------------------------------------- */}

      <h3 className="text-lg font-medium text-text-primary">
        {/* Also add a fallback here for safety */}
        {profile?.display_name || '...'}
      </h3>
      <div className="flex items-center space-x-2">
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-bg-muted text-text-secondary">
          Managed Profile
        </span>
        <button
          onClick={() => onEdit(profile)}
          className="p-1 text-text-secondary hover:text-text-primary"
          aria-label={`Edit profile for ${profile?.display_name || 'member'}`}
        >
          <PencilSquareIcon className="w-4 h-4" />
        </button>
      </div>
      <button className="w-full px-4 py-2 mt-2 text-sm font-medium rounded-md bg-bg-muted text-text-secondary hover:bg-border-primary hover:text-text-primary">
        View Tasks
      </button>
    </div>
  );
}