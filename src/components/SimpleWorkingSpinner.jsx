import React from 'react';
import JavaScriptSpinner from './JavaScriptSpinner';

/**
 * Simple Working Spinner - JavaScript Powered
 * Uses JavaScript animation to bypass ALL CSS conflicts
 */
const SimpleWorkingSpinner = ({ 
  show = true, 
  progress = 0, 
  message = "Loading...",
  onComplete = null 
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
        {/* JavaScript Spinner - GUARANTEED TO WORK */}
        <JavaScriptSpinner size={64} color="#3b82f6" />
        
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
        
        {/* Multiple Small JS Spinners */}
        <div className="flex space-x-4">
          <JavaScriptSpinner size={16} color="#ef4444" />
          <JavaScriptSpinner size={16} color="#10b981" />
          <JavaScriptSpinner size={16} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
};

export default SimpleWorkingSpinner;