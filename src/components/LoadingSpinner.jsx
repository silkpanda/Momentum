// src/components/LoadingSpinner.jsx

import React from 'react';

/**
 * A simple, centered loading indicator for the application.
 * @param {string} text - Optional text to display below the spinner.
 */
function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-canvas text-text-secondary">
      {/* Basic spinner animation using Tailwind CSS classes */}
      <div 
        className="animate-spin rounded-full h-12 w-12 border-4 border-t-action-primary border-b-action-primary border-gray-200"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      
      {/* Optional loading text */}
      <p className="mt-4 text-lg font-medium">
        {text}
      </p>
    </div>
  );
}

export default LoadingSpinner;