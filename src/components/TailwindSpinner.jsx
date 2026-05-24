import React from 'react';

/**
 * Pure Tailwind CSS Spinner - No custom CSS conflicts
 */
const TailwindSpinner = ({ 
  size = 'w-8 h-8', 
  color = 'border-blue-600', 
  className = '' 
}) => {
  return (
    <div className={`${size} ${color} border-2 border-t-transparent rounded-full animate-spin ${className}`}></div>
  );
};

/**
 * Loading Modal with Pure Tailwind
 */
export const TailwindLoadingModal = ({ 
  show = true, 
  message = "Loading...", 
  progress = 0 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
        {/* Tailwind Spinner */}
        <TailwindSpinner size="w-16 h-16" color="border-blue-600" />
        
        {/* Message */}
        <div className="text-lg font-semibold text-gray-800 text-center">
          {message}
        </div>
        
        {/* Progress */}
        <div className="text-2xl font-bold text-blue-600">
          {Math.round(progress)}%
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Bouncing Dots */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TailwindSpinner;