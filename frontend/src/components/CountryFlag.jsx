/**
 * CountryFlag Component
 * Displays country flag emoji from country code
 */

const CountryFlag = ({ countryCode, size = "md", showName = false, countryName = "" }) => {
  // Convert country code to flag emoji
  const getCountryFlag = (code) => {
    if (!code || code === 'XX' || code === 'Unknown') {
      return '🌍'; // Globe emoji for unknown
    }
    
    // Convert country code to flag emoji
    // Each letter is converted to its regional indicator symbol
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  const flag = getCountryFlag(countryCode);

  if (showName && countryName) {
    return (
      <span className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}>
        <span>{flag}</span>
        <span className="text-xs text-base-content/70">{countryName}</span>
      </span>
    );
  }

  return (
    <span 
      className={sizeClasses[size]} 
      title={countryName || countryCode}
      role="img"
      aria-label={`Flag of ${countryName || countryCode}`}
    >
      {flag}
    </span>
  );
};

export default CountryFlag;
