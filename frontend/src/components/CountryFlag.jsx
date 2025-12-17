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
    
    // Clean up the country code - handle edge cases
    let cleanCode = code.toString().trim().toUpperCase();
    
    // Handle cases like "US United States" or "IN IN" - extract just the 2-letter code
    if (cleanCode.length > 2) {
      // If it starts with a 2-letter code followed by space, extract just the code
      const match = cleanCode.match(/^([A-Z]{2})\s/);
      if (match) {
        cleanCode = match[1];
      } else {
        // If it's a repeated code like "IN IN", take the first part
        const parts = cleanCode.split(' ');
        if (parts.length > 1 && parts[0] === parts[1] && parts[0].length === 2) {
          cleanCode = parts[0];
        } else {
          // Take first 2 characters if it's a longer string
          cleanCode = cleanCode.substring(0, 2);
        }
      }
    }
    
    // Validate it's exactly 2 letters
    if (!/^[A-Z]{2}$/.test(cleanCode)) {
      console.warn(`Invalid country code format: "${code}" -> "${cleanCode}"`);
      return '🌍'; // Globe emoji for invalid codes
    }
    
    // Convert country code to flag emoji
    // Each letter is converted to its regional indicator symbol
    const codePoints = cleanCode
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
