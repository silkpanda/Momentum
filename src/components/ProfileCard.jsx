// src/components/ProfileCard.jsx (FIXED: Used correct 'text-base-content' class)

import React from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import { useProfile } from '../context/ProfileContext';

function ProfileCard({ profile, isImpersonating = false, onClick }) {
  const { openUpdateModal } = useProfile();

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
      className={`flex items-center p-2 rounded-lg shadow-md cursor-pointer bg-base-100`}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`flex items-center justify-center h-10 w-10 rounded-full text-lg font-bold ${color} text-base-100`}>
          {avatarText}
        </div>
      </div>

      {/* Name and Status */}
      <div className="flex-grow mx-2">
        {/* 🛠️ FIX: Replaced 'text-content-primary' with 'text-base-content' */}
        <p className="font-bold text-base-content">{name}</p>
        
        {/* 🛠️ FIX: Replaced 'text-content-secondary' with 'text-base-content' and opacity */}
        <p className="text-xs font-light text-base-content opacity-80">
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
          {/* 🛠️ FIX: Added 'text-base-content' to the icon */}
          <PencilSquareIcon className="h-5 w-5 text-base-content" />
        </button>
      </div>
    </div>
  );
}

export default ProfileCard;