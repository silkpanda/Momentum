// src/components/ProfileListItem.jsx (FIXED: Uses display_name and profile_color)

import React from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import { useProfile } from '../context/ProfileContext';

function ProfileListItem({ profile, isActive, onClick }) {
  const { openUpdateModal } = useProfile();

  // 🛠️ FIX: Use 'display_name' and 'profile_color'
  const name = profile?.display_name || '...';
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
  
  const itemClasses = isActive
    ? 'border-primary'
    : 'border-transparent hover:border-base-content opacity-60 hover:opacity-100';

  return (
    <div 
      className={`flex flex-col items-center cursor-pointer p-1 border-b-2 transition-all ${itemClasses}`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 relative ${profile.auth_user_id ? 'group' : ''}`}>
        <div className={`flex items-center justify-center h-12 w-12 rounded-full font-bold ${color} text-base-100`}>
          {avatarText}
        </div>
        
        {profile.auth_user_id && (
          <button 
            className="absolute -top-1 -right-1 btn btn-xs btn-circle btn-ghost bg-base-100 text-content-primary opacity-0 group-hover:opacity-100"
            onClick={handleEdit}
            aria-label="Edit profile"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Name */}
      <span className="mt-1 text-xs font-medium w-16 text-center truncate">
        {name}
      </span>
    </div>
  );
}

export default ProfileListItem;