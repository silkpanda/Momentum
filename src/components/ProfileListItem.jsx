// src/components/ProfileListItem.jsx

import React from 'react';

/**
 * Renders a full, styled list item for a household member profile.
 * This component is designed to be used within the HouseholdDashboard profiles grid.
 * It contains the bug fix for dynamic profile color application (BUG-029).
 * * @param {object} profile - The profile object from the database.
 * @param {string} currentAuthUserId - The ID of the currently logged-in user for 'You' designation.
 * @param {function} handleEditProfile - Function to open the edit modal.
 * @param {function} handleDeleteProfile - Function to handle profile hard delete.
 */
function ProfileListItem({ profile, currentAuthUserId, handleEditProfile, handleDeleteProfile }) {
    // Determine the text color based on whether the background is colored (Managed User) or not (Admin).
    const isManagedUser = !profile.is_admin;
    const textColorClass = isManagedUser ? 'text-text-inverted' : 'text-text-primary';
    const subTextColorClass = isManagedUser ? 'text-text-inverted opacity-80' : 'text-text-secondary';

    // The core fix for BUG-029: The background color is set dynamically using the CSS variable pattern
    // defined in theme.css (e.g., var(--color-managed-green)).
    const dynamicStyle = {
        backgroundColor: isManagedUser 
            ? `var(--color-${profile.profile_color})` 
            : 'var(--color-bg-muted)' // Admins get the muted gray background
    };

    return (
        <div 
            key={profile.id} 
            className={`p-4 rounded-md shadow-sm border border-border-primary transition duration-150 ease-in-out hover:shadow-lg`}
            style={dynamicStyle}
        >
            <p className={`font-medium text-lg ${textColorClass}`}>
                {profile.display_name}
            </p>
            <p className={`text-sm ${subTextColorClass}`}>
                {profile.is_admin 
                    ? (profile.auth_user_id === currentAuthUserId ? 'Admin (You)' : 'Co-Admin') 
                    : 'Managed User'}
            </p>
            <p className={`text-xs mt-2 ${subTextColorClass}`}>
                Points: {profile.points}
            </p>

            {/* EDIT/DELETE BUTTONS */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-solid border-opacity-30" 
                 style={{ borderColor: isManagedUser ? 'var(--color-text-inverted)' : 'var(--color-border-primary)' }}>
                {/* EDIT BUTTON (Visible for ALL profiles) */}
                <button
                    onClick={() => handleEditProfile(profile)}
                    className={`text-xs ${isManagedUser ? 'text-text-inverted hover:text-white' : 'text-gray-900 hover:text-action-primary'} font-medium underline-offset-2 hover:underline`}
                >
                    Edit Profile
                </button>

                {/* DELETE BUTTON (Visible only if NOT the current logged-in user) */}
                {profile.auth_user_id !== currentAuthUserId && (
                    <button
                        onClick={() => handleDeleteProfile(profile.id, profile.display_name)}
                        className={`text-xs ${isManagedUser ? 'text-text-inverted hover:text-signal-danger' : 'text-signal-danger hover:underline'} font-medium underline-offset-2 hover:underline`}
                    >
                        Hard Delete
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProfileListItem;