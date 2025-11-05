import { PencilSquareIcon } from '@heroicons/react/24/solid';

export default function ProfileCard({ profile, onEdit }) {
  // --- THIS IS THE FIX (Robustness) ---
  // We set defaults in case profile.color or profile.display_name are missing
  const colorClass = profile?.color ? `bg-${profile.color}` : 'bg-managed-gray';
  const initial = profile?.display_name
    ? profile.display_name.charAt(0).toUpperCase()
    : '?';
  // ------------------------------------

  return (
    <div className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow-md">
      <div className="flex items-center space-x-4">
        {/* --- This code replaces the icon and uses the safe variables --- */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}
        >
          <span className="text-xl font-semibold text-white">{initial}</span>
        </div>
        {/* --------------------------------------------------------------- */}

        <div>
          <h3 className="text-lg font-medium text-text-primary">
            {/* Also add a fallback here for safety */}
            {profile?.display_name || '...'}
          </h3>
          <p className="text-sm text-text-secondary">
            {profile?.is_admin ? 'Admin' : 'Member'}
          </p>
        </div>
      </div>
      <button
        onClick={() => onEdit(profile)}
        className="p-2 text-text-secondary hover:text-text-primary"
        aria-label={`Edit profile for ${profile?.display_name || 'member'}`}
      >
        <PencilSquareIcon className="w-5 h-5" />
      </button>
    </div>
  );
}