// src/components/EditProfileModal.jsx (NEW FILE)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

// Color palette from our Style Guide
const PROFILE_COLORS = [
  'managed-blue',
  'managed-green',
  'managed-yellow',
  'managed-purple',
  'managed-orange',
  'managed-teal',
  'managed-pink',
  'managed-indigo',
];

// Reusable color swatch component
const ColorSwatch = ({ color, isSelected, onClick }) => {
  const bgColorClass = `bg-${color}`;
  const ringColorClass = `ring-${color}`;

  return (
    <button
      type="button"
      onClick={() => onClick(color)}
      className={`w-10 h-10 rounded-full transition-all ${bgColorClass}
        ${
          isSelected
            ? `ring-4 ring-offset-2 ring-offset-bg-surface-2 ${ringColorClass}`
            : 'hover:scale-110'
        }`}
      aria-label={`Select ${color}`}
    />
  );
};

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  userProfile, // We need this to know what fields to show
  onProfileUpdated,
}) {
  // === State ===
  const [formData, setFormData] = useState({
    display_name: '',
    profile_color: '',
    auth_user_id: '', // Email field
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // === Logic ===
  const isEditingSelf = profile.id === userProfile.id;
  const isEditingManagedProfile = !profile.is_admin && !profile.auth_user_id;

  // Load profile data into form when modal opens
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        profile_color: profile.profile_color || 'managed-blue',
        auth_user_id: profile.auth_user_id || '', // (email)
      });
    }
  }, [profile, isOpen]);

  if (!isOpen || !profile) {
    return null;
  }

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setFormData((prev) => ({
      ...prev,
      profile_color: color,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 1. Prepare the data to update
    const updateData = {
      display_name: formData.display_name,
      profile_color: formData.profile_color,
    };

    // 2. Add 'auth_user_id' (email) to the update ONLY if:
    //    - We are NOT editing a managed (child) profile
    //    - AND the email has actually changed
    if (!isEditingManagedProfile && formData.auth_user_id !== profile.auth_user_id) {
       // We only allow this for other 'admin' (parent) profiles
       // or for managed profiles that *have* an email
      updateData.auth_user_id = formData.auth_user_id;
    }

    try {
      // 3. Run the Supabase update
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // 4. Success! Tell the dashboard to refresh
      onProfileUpdated();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // === Render ===
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-overlay"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg p-6 bg-bg-surface-2 rounded-lg shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-text-secondary rounded-full hover:bg-bg-surface-hover hover:text-text-primary"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <h2 id="modal-title" className="text-xl font-semibold text-text-primary mb-4">
          Edit Profile: {profile.display_name}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-text-secondary mb-1"
            >
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              required
              className="w-full p-2 bg-bg-canvas border border-border-default rounded-md text-text-primary"
            />
          </div>

          {/* Email (auth_user_id) Field */}
          {/* Show this field ONLY IF the profile is NOT a managed (child) profile */}
          {!isEditingManagedProfile && (
            <div>
              <label
                htmlFor="auth_user_id"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Email (Auth User)
              </label>
              <input
                type="email"
                id="auth_user_id"
                name="auth_user_id"
                value={formData.auth_user_id}
                onChange={handleChange}
                // Parents can't edit their own email, but can edit other parents'
                readOnly={isEditingSelf}
                disabled={isEditingSelf}
                className={`w-full p-2 bg-bg-canvas border border-border-default rounded-md text-text-primary
                  ${isEditingSelf ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              />
              {isEditingSelf && (
                 <p className="text-xs text-text-secondary mt-1">
                   Email addresses are tied to your login and cannot be changed here.
                 </p>
              )}
            </div>
          )}
          
          {/* Profile Color */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Profile Color
            </label>
            <div className="flex flex-wrap gap-3">
              {PROFILE_COLORS.map((color) => (
                <ColorSwatch
                  key={color}
                  color={color}
                  isSelected={formData.profile_color === color}
                  onClick={handleColorSelect}
                />
              ))}
            </div>
          </div>

          <hr className="border-border-default" />

          {/* Footer & Submit */}
          <div className="flex items-center justify-between">
            {error && <p className="text-sm text-signal-error">{error}</p>}
            
            <div className="flex gap-4 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-bg-surface-hover hover:bg-bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md text-text-on-primary bg-action-primary hover:bg-action-primary-hover flex items-center gap-2"
              >
                {isLoading ? <LoadingSpinner /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}