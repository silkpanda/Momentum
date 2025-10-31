// src/components/ProfileCard.jsx

import React from 'react';

/**
 * Renders a small, stylized card for a household member.
 * This component dynamically applies the member's profile color.
 * * Props:
 * @param {string} name - The display name of the member (e.g., "Dad", "Emily").
 * @param {string} color - The member's chosen color key (e.g., 'forest', 'ruby', 'aqua'). 
 * This maps to the CSS variables in theme.css.
 */
function ProfileCard({ name, color }) {
  // We clean the color name and use it to construct the CSS variable name.
  // Example: 'forest' becomes 'var(--profile-color-forest)'
  const colorKey = `--profile-color-${color}`;

  // The first letter of the name is used for the simple avatar.
  const initial = name.charAt(0).toUpperCase();

  // We use the `style` prop to inject a custom CSS variable value into this component.
  // This allows the background to be set to the user's dynamic color.
  return (
    <div 
      className="p-3 w-40 rounded-lg shadow-md flex flex-col items-center justify-center transition-shadow duration-150 ease-in-out"
      style={{
        backgroundColor: `var(${colorKey}, var(--color-bg-muted))`, // Use the dynamic color, or fall back to muted gray
        color: 'var(--color-text-inverted)', // Text on the colored background should be white/inverted
      }}
    >
      <div 
        className="w-10 h-10 rounded-full bg-color-bg-surface flex items-center justify-center mb-2"
        style={{ color: 'var(--color-text-primary)', backgroundColor: 'var(--color-bg-surface)' }}
      >
        <span className="text-lg font-semibold">{initial}</span>
      </div>
      <p className="text-sm font-medium truncate w-full text-center" title={name}>
        {name}
      </p>
    </div>
  );
}

export default ProfileCard;