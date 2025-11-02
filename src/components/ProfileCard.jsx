// src/components/ProfileCard.jsx (FIXED: Uses display_name and profile_color)

import React from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import { useProfile } from '../context/ProfileContext';

function ProfileCard({ profile, isImpersonating = false, onClick }) {
  const { openUpdateModal } = useProfile();

  // 🛠️ FIX: Use 'display_name' and 'profile_color'
  const name = profile?.display_name || 'Loading...';
  const color = profile?.profile_color || 'bg-base-300';
  
  const avatarText = (name && name.length > 0) ? name.charAt(0).toUpperCase() : '?';

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (profile?.id) {
      if (profile.auth_user_id) {
        openUpdateModal(profile.id);
      } else {
        console.log('FPO: Open Edit Managed Profile Modal');
        // FPO: openEditManagedModal(profile.id);
      }
    }
  };

  return (
    <div 
      className={`flex items-center p-2 rounded-lg shadow-md cursor-pointer ${color} text-base-100`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-black bg-opacity-20 text-lg font-bold">
          {avatarText}
        </div>
      </div>

      {/* Name and Status */}
      <div className="flex-grow mx-2">
        <p className="font-bold">{name}</p>
        <p className="text-xs font-light opacity-80">
          {isImpersonating ? 'Viewing as Child (Click to return)' : 'Active Profile'}
        </p>
      </div>

      {/* Edit Button */}
      <div className="flex-shrink-0">
        <button 
          className="btn btn-ghost btn-circle btn-sm"
          onClick={handleEdit}
          aria-label="Edit profile"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;