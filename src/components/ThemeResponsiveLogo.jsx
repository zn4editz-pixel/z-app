const ThemeResponsiveLogo = ({ 
  src = "/z-logo.png", 
  alt = "Z-APP Logo", 
  className = "w-20 h-20 object-contain relative z-10",
  ...props 
}) => {
  return (
    <img 
      src={src}
      alt={alt}
      className={`theme-logo no-animate ${className}`}
      {...props}
    />
  );
};

export default ThemeResponsiveLogo;