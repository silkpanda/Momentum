// src/components/NotificationBanner.jsx

import React, { useEffect, useState } from 'react';

/**
 * A floating, fixed-position notification banner that appears at the top center of the screen.
 * This component solves the "jarring" movement issue by using CSS 'fixed' positioning.
 *
 * @param {string | null} message - The notification message to display. Set to null to hide.
 * @param {string} [type='success'] - 'success' or 'error' to determine colors.
 */
function NotificationBanner({ message, type = 'success' }) {
  const [isVisible, setIsVisible] = useState(false);

  // Determine the color classes based on the type prop
  const bgColor = type === 'error' ? 'bg-signal-danger' : 'bg-signal-success';
  const shadowColor = type === 'error' ? 'shadow-red-700/50' : 'shadow-green-700/50';

  useEffect(() => {
    if (message) {
      setIsVisible(true);
    } else {
      // Small delay to allow the slide-up transition to run
      setTimeout(() => setIsVisible(false), 300); 
    }
  }, [message]);

  // If the message is null and the slide-up transition has finished, don't render anything.
  if (!isVisible && !message) {
    return null;
  }

  return (
    <div
      // Fixed positioning centers the banner over the content
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
                  max-w-md w-full p-4 rounded-md shadow-xl transition-all duration-300 ease-in-out`}
      // The transform property is used for the slide-down animation
      style={{
        transform: `translate(-50%, ${message ? '0' : '-150%'})`, // Slides down when message is present
        opacity: message ? 1 : 0,
      }}
    >
      <div className={`text-sm font-medium text-text-on-action ${bgColor} rounded-md p-2`}>
        {/* We use a ternary check on the message for safety */}
        {message ? message : ''}
      </div>
    </div>
  );
}

export default NotificationBanner;