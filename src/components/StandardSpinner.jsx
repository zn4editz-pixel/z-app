const StandardSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`standard-spinner ${sizeClasses[size]} ${className}`}>
      <div className="standard-spinner-circle"></div>
    </div>
  );
};

export default StandardSpinner;