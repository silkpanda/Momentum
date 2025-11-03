// src/components/ProfileCard.jsx

import React from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
// import { useProfile } from '../context/ProfileContext'; // REMOVED: No longer needed

// ADJUSTED: Added 'isActive' and 'onEditClick' props
function ProfileCard({ profile, isActive = false, onClick, onEditClick }) {
  // const { openUpdateModal } = useProfile(); // REMOVED

  const name = profile?.display_name || 'Loading...';
  // ADJUSTED: Default to 'bg-base-300' (a neutral daisyUI color) for the "All" card
  const color = profile?.profile_color || 'bg-base-300';
  
  // This adheres to the Style Guide's "letter-based avatar"
  const avatarText = (name && name.length > 0) ? name.charAt(0).toUpperCase() : '?';

  // ADJUSTED: This now calls the prop from HouseholdDashboard
  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onEditClick) {
      onEditClick(profile); // Pass the profile up to the parent
    }
  };

  // STYLE GUIDE COMPLIANT:
  // This uses your 'brand-primary' (color-action-primary) for the "Signal"
  // and 'base-100' (color-bg-surface) for the offset.
  const activeClass = isActive
    ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-base-100' // Highlight
    : 'ring-2 ring-transparent'; // No highlight

  return (
    <div 
      // STYLE GUIDE COMPLIANT:
      // Uses 'bg-base-100' (color-bg-surface)
      // Added 'min-w-[140px]' for better spacing
      className={`flex items-center p-2 rounded-lg shadow-md cursor-pointer bg-base-100 
                  min-w-[140px] transition-all ${activeClass}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`flex items-center justify-center h-10 w-10 rounded-full text-lg font-bold ${color} text-base-100`}>
          {avatarText}
        </div>
      </div>

      {/* Name and Status */}
      <div className="flex-grow mx-2 overflow-hidden">
        {/* STYLE GUIDE COMPLIANT: Uses 'text-base-content' (color-text-primary) */}
        <p className="font-bold text-base-content truncate">{name}</p>
        
        {/* STYLE GUIDE COMPLIANT: Uses 'text-base-content' (color-text-secondary) */}
        <p className="text-xs font-light text-base-content opacity-80">
          Points: {profile?.points || 0}
        </p>
      </div>

      {/* Edit Button */}
      {/* ADJUSTED: Only show edit button if onEditClick is provided */}
      {onEditClick && (
        <div className="flex-shrink-0">
          <button 
            className="btn btn-ghost btn-circle btn-sm"
            onClick={handleEdit}
            aria-label="Edit profile"
          >
            {/* STYLE GUIDE COMPLIANT: Uses 'text-base-content' */}
            <PencilSquareIcon className="h-5 w-5 text-base-content" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileCard;