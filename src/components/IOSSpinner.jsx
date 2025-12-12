import React from 'react';

const IOSSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <div className={`ios-spinner ${sizeClasses[size]} ${className} relative`}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="ios-spinner-bar"
          style={{
            transform: `rotate(${i * 30}deg)`,
            opacity: 1 - (i * 0.08) // Gradient opacity effect
          }}
        />
      ))}
    </div>
  );
};

export default IOSSpinner;