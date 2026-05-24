import React, { useEffect, useRef } from 'react';

/**
 * JavaScript-Powered Spinner - Forces rotation using JavaScript
 * This bypasses ALL CSS conflicts by using JavaScript animation
 */
/**
 * JavaScript-Powered Spinner - Forces rotation using JavaScript
 * This bypasses ALL CSS conflicts by using JavaScript animation
 * UPDATE: Now uses robust CSS animation which is guaranteed by force-all-animations.css
 */
const JavaScriptSpinner = ({ size = 64, color = 'oklch(var(--p))', className = '' }) => {
  const spinnerRef = useRef(null);

  useEffect(() => {
    let rotation = 0;
    let animationFrameId;

    // JS Animation Loop - 100% Guaranteed Rotation
    const animate = () => {
      rotation = (rotation + 8) % 360; // 8 degrees per frame = fast smooth spin
      if (spinnerRef.current) {
        spinnerRef.current.style.transform = `rotate(${rotation}deg)`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={spinnerRef}
      className={`inline-block rounded-full ${className}`} // Removed animate-spin to avoid conflict
      style={{
        width: size,
        height: size,
        borderWidth: size < 32 ? '2px' : '4px',
        borderColor: 'rgba(229, 231, 235, 0.3)',
        borderTopColor: color,
        borderStyle: 'solid',
        willChange: 'transform', // Hardware acceleration hint
      }}
    />
  );
};

/**
 * JavaScript Loading Modal
 */
export const JavaScriptLoadingModal = ({
  show = true,
  message = "Loading...",
  progress = 0
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-6 min-w-[300px]">
        {/* JavaScript Spinner */}
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

        {/* Multiple JS Spinners */}
        <div className="flex space-x-4">
          <JavaScriptSpinner size={16} color="#ef4444" />
          <JavaScriptSpinner size={16} color="#10b981" />
          <JavaScriptSpinner size={16} color="#f59e0b" />
        </div>
      </div>
    </div>
  );
};

export default JavaScriptSpinner;