import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Check,
  X,
  User,
  Paintbrush, // We'll keep this for the label, but it's less important now
  ShieldCheck,
  UserMinus,
} from 'lucide-react';

// Color definitions (as they are in your safelist)
const profileColors = [
  'managed-red',
  'managed-orange',
  'managed-yellow',
  'managed-green',
  'managed-teal',
  'managed-blue',
  'managed-purple',
  'managed-gray',
];

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  userProfile,
  onProfileUpdated,
}) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isUserAdmin = userProfile?.is_admin || false;
  const isEditingSelf = userProfile?.id === profile?.id;

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || '');
      setSelectedColor(profile.color || 'managed-gray');
      setIsAdmin(profile.is_admin || false);
    }
  }, [profile]);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) {
      setError('Display name cannot be empty.');
      setLoading(false);
      return;
    }

    const updateData = {
      display_name: name,
      color: selectedColor,
    };

    if (isUserAdmin && !isEditingSelf) {
      updateData.is_admin = isAdmin;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Profile updated successfully:', data);
      onProfileUpdated(data);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to remove "${profile.display_name}" from the household? This cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: rpcError } = await supabase.rpc(
        'remove_profile_from_household',
        {
          profile_id_to_remove: profile.id,
        }
      );

      if (rpcError) throw rpcError;

      console.log('Profile removed successfully.');
      onProfileUpdated({ id: profile.id, deleted: true });
    } catch (err) {
      console.error('Error removing profile:', err);
      setError(
        `Failed to remove profile: ${err.message}. (You may need to create the 'remove_profile_from_household' RPC function in Supabase.)`
      );
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg-surface rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-muted">
            <h2 className="text-xl font-semibold text-text-primary">
              Edit Profile
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-text-secondary hover:bg-bg-muted"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Display Name */}
            <div className="space-y-2">
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-text-secondary"
              >
                Display Name
              </label>
              <div className="relative">
                <User className="absolute w-5 h-5 left-3 top-1/2 -translate-y-1/2 text-text-disabled" />
                <input
                  type="text"
                  id="displayName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-border-default bg-bg-input text-text-primary focus:ring-2 focus:ring-action-primary focus:border-action-primary"
                  required
                />
              </div>
            </div>

            {/* --- THIS IS THE FIX --- */}
            {/* Profile Color (Replaced dropdown with visual grid) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Profile Color
              </label>
              <div className="flex flex-wrap gap-3 p-3 rounded-md bg-bg-input border border-border-default">
                {profileColors.map((color) => (
                  <button
                    key={color}
                    type="button" // Prevent form submission
                    onClick={() => setSelectedColor(color)}
                    className={`w-9 h-9 rounded-full transition-all ${`bg-${color}`}`}
                    aria-label={color.replace('managed-', '')}
                  >
                    {/* Add a visual indicator for the selected color */}
                    {selectedColor === color && (
                      <div className="flex items-center justify-center w-full h-full rounded-full bg-black/30">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* ----------------------- */}

            {/* Admin Toggle */}
            {isUserAdmin && !isEditingSelf && (
              <div className="flex items-center justify-between p-4 rounded-md bg-bg-muted border border-border-muted">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-6 h-6 text-action-primary" />
                  <div>
                    <h4 className="font-medium text-text-primary">
                      Household Admin
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Admins can invite users and manage profiles.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="toggle toggle-primary"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between p-4 bg-bg-muted rounded-b-lg">
            {/* Delete Button (Admins only, not on self) */}
            {isUserAdmin && !isEditingSelf ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-signal-danger hover:bg-signal-error-bg disabled:opacity-50 sm:w-auto w-full mt-2 sm:mt-0"
              >
                <UserMinus className="w-4 h-4" />
                Remove from Household
              </button>
            ) : (
              <div /> // Empty div to maintain layout
            )}

            {/* Error and Save */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
              {error && (
                <p className="text-sm text-signal-error text-center sm:text-right mb-2 sm:mb-0">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2 font-semibold rounded-md text-text-on-action bg-action-primary hover:bg-action-primary-hover disabled:opacity-50"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}