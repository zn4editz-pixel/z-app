import React from 'react';

const ProfessionalSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10', 
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`professional-spinner ${sizeClasses[size]} ${className}`}>
      <div className="professional-spinner-ring"></div>
      <div className="professional-spinner-ring"></div>
      <div className="professional-spinner-ring"></div>
    </div>
  );
};

export default ProfessionalSpinner;