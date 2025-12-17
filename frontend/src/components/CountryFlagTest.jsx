import CountryFlag from './CountryFlag';

const CountryFlagTest = () => {
  // Test cases that might be causing issues
  const testCases = [
    { code: 'US', name: 'United States', expected: '🇺🇸' },
    { code: 'IN', name: 'India', expected: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom', expected: '🇬🇧' },
    { code: 'CA', name: 'Canada', expected: '🇨🇦' },
    { code: 'AU', name: 'Australia', expected: '🇦🇺' },
    // Problematic cases that might exist in the database
    { code: 'US United States', name: 'United States', expected: '🇺🇸' },
    { code: 'IN IN', name: 'India', expected: '🇮🇳' },
    { code: 'XX', name: 'Unknown', expected: '🌍' },
    { code: '', name: 'Empty', expected: '🌍' },
    { code: null, name: 'Null', expected: '🌍' },
    { code: undefined, name: 'Undefined', expected: '🌍' },
  ];

  return (
    <div className="p-6 bg-base-100 rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4">Country Flag Test</h3>
      <div className="space-y-2">
        {testCases.map((test, index) => (
          <div key={index} className="flex items-center gap-4 p-2 bg-base-200 rounded">
            <div className="w-8 text-center">
              <CountryFlag countryCode={test.code} size="lg" />
            </div>
            <div className="flex-1">
              <span className="font-mono text-sm">
                Code: "{test.code}" → Expected: {test.expected}
              </span>
            </div>
            <div className="text-sm text-base-content/70">
              {test.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountryFlagTest;