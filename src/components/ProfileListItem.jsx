// src/components/ProfileListItem.jsx

import React from 'react';

/**
 * Renders a full, stylized list item for a household member profile.
 * This component is designed to be used within the HouseholdDashboard profiles grid.
 * It now correctly handles color contrast for all profile types (Admin and Managed).
 * * @param {object} profile - The profile object from the database.
 * @param {string} currentAuthUserId - The ID of the currently logged-in user for 'You' designation.
 * @param {function} handleEditProfile - Function to open the edit modal.
 * @param {function} handleDeleteProfile - Function to handle profile hard delete.
 */
function ProfileListItem({ profile, currentAuthUserId, handleEditProfile, handleDeleteProfile }) {
    
    const isAdmin = profile.is_admin;
    
    // The core text color rule: If the profile has *any* color set (meaning a dark background), 
    // the text must be light/inverted for contrast. Otherwise, use dark/primary text.
    const hasDynamicColor = !!profile.profile_color; 
    
    const textColorClass = hasDynamicColor ? 'text-text-inverted' : 'text-text-primary';
    const subTextColorClass = hasDynamicColor ? 'text-text-inverted opacity-80' : 'text-text-secondary';

    // The background color is dynamically set for ALL profiles using their profile_color.
    const dynamicStyle = {
        backgroundColor: profile.profile_color 
            ? `var(--color-${profile.profile_color})` 
            : 'var(--color-bg-muted)' 
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
                {isAdmin
                    ? (profile.auth_user_id === currentAuthUserId ? 'Admin (You)' : 'Co-Admin') 
                    : 'Managed User'}
            </p>
            <p className={`text-xs mt-2 ${subTextColorClass}`}>
                Points: {profile.points}
            </p>

            {/* EDIT/DELETE BUTTONS */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-solid border-opacity-30" 
                 // The divider line needs to adjust for contrast. Inverted for colored background, Primary for light background.
                 style={{ borderColor: hasDynamicColor ? 'var(--color-text-inverted)' : 'var(--color-border-primary)' }}>
                {/* EDIT BUTTON (Visible for ALL profiles) */}
                <button
                    onClick={() => handleEditProfile(profile)}
                    className={`text-xs ${hasDynamicColor ? 'text-text-inverted hover:text-white' : 'text-text-primary hover:text-action-primary'} font-medium underline-offset-2 hover:underline`}
                >
                    Edit Profile
                </button>

                {/* DELETE BUTTON (Visible only if NOT the current logged-in user) */}
                {profile.auth_user_id !== currentAuthUserId && (
                    <button
                        onClick={() => handleDeleteProfile(profile.id, profile.display_name)}
                        className={`text-xs ${hasDynamicColor ? 'text-text-inverted hover:text-signal-danger' : 'text-signal-danger hover:underline'} font-medium underline-offset-2 hover:underline`}
                    >
                        Hard Delete
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProfileListItem;