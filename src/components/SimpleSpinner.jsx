import React from 'react';

const SimpleSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <div className={`simple-spinner ${sizeClasses[size]} ${className}`}></div>
  );
};

export default SimpleSpinner;