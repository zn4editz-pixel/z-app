/**
 * Geolocation and VPN Detection Utility
 * Uses free IP geolocation APIs to detect user location and VPN usage
 */

import https from 'https';

/**
 * Make HTTPS request
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} JSON response
 */
const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Failed to parse JSON response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Detect country and VPN status from IP address with multiple fallback APIs
 * @param {string} ip - IP address to check
 * @returns {Promise<Object>} Location and VPN data
 */
export const detectCountry = async (ip) => {
  try {
    // Skip detection for localhost/private IPs but provide test data for development
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log(`⚠️ Localhost/private IP detected: ${ip}, using test location data`);
      return {
        country: 'United States', // Default for development
        countryCode: 'US',
        city: 'New York',
        region: 'New York',
        timezone: 'America/New_York',
        isVPN: false,
        ip: ip,
        source: 'localhost-default'
      };
    }

    console.log(`🌍 Detecting location for IP: ${ip}`);
    
    // Try multiple APIs in order of preference
    const apis = [
      {
        name: 'ipapi.co',
        url: `https://ipapi.co/${ip}/json/`,
        parser: (data) => ({
          country: data.country_name,
          countryCode: data.country_code,
          city: data.city,
          region: data.region,
          timezone: data.timezone
        })
      },
      {
        name: 'ip-api.com',
        url: `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,timezone,query`,
        parser: (data) => ({
          country: data.country,
          countryCode: data.countryCode,
          city: data.city,
          region: data.regionName,
          timezone: data.timezone
        })
      },
      {
        name: 'ipinfo.io',
        url: `https://ipinfo.io/${ip}/json`,
        parser: (data) => ({
          country: data.country === 'US' ? 'United States' : data.country,
          countryCode: data.country,
          city: data.city,
          region: data.region,
          timezone: data.timezone
        })
      }
    ];

    let lastError = null;
    
    for (const api of apis) {
      try {
        console.log(`🔍 Trying ${api.name} for IP: ${ip}`);
        const data = await httpsGet(api.url);
        
        // Check for API-specific error responses
        if (data.error || data.status === 'fail') {
          console.warn(`⚠️ ${api.name} returned error:`, data.error || data.message);
          continue;
        }
        
        const parsed = api.parser(data);
        
        // Validate that we got meaningful data
        if (parsed.country && parsed.country !== 'Unknown' && parsed.countryCode) {
          console.log(`✅ Location detected via ${api.name} for ${ip}: ${parsed.city}, ${parsed.country}`);
          
          return {
            country: parsed.country || 'Unknown',
            countryCode: parsed.countryCode || 'XX',
            city: parsed.city || 'Unknown',
            region: parsed.region || '',
            timezone: parsed.timezone || '',
            isVPN: false,
            ip: ip,
            source: api.name
          };
        }
      } catch (error) {
        console.warn(`⚠️ ${api.name} failed for ${ip}:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all APIs failed, return default with error info
    console.error(`❌ All geolocation APIs failed for ${ip}. Last error:`, lastError?.message);
    
    return {
      country: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
      region: '',
      timezone: '',
      isVPN: false,
      ip: ip,
      error: `All APIs failed. Last error: ${lastError?.message}`,
      source: 'fallback'
    };
    
  } catch (error) {
    console.error(`❌ Geolocation detection error for ${ip}:`, error.message);
    
    return {
      country: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
      region: '',
      timezone: '',
      isVPN: false,
      ip: ip,
      error: error.message,
      source: 'error'
    };
  }
};

/**
 * Detect VPN usage (optional, requires separate API)
 * Uses vpnapi.io free tier (1,000 requests/day)
 * @param {string} ip - IP address to check
 * @returns {Promise<boolean>} True if VPN detected
 */
export const detectVPN = async (ip) => {
  try {
    // Skip detection for localhost/private IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return false;
    }

    // Use vpnapi.io for VPN detection (free tier: 1,000 requests/day)
    const data = await httpsGet(`https://vpnapi.io/api/${ip}?key=free`);
    
    return data.security?.vpn === true || data.security?.proxy === true || data.security?.tor === true;
  } catch (error) {
    console.error('VPN detection error:', error.message);
    return false;
  }
};

/**
 * Get comprehensive location and security data
 * Combines geolocation and VPN detection
 * @param {string} ip - IP address to check
 * @returns {Promise<Object>} Complete location and security data
 */
export const getLocationData = async (ip) => {
  try {
    // Get basic location data
    const locationData = await detectCountry(ip);
    
    // Optionally check for VPN (can be disabled to save API calls)
    // const isVPN = await detectVPN(ip);
    // locationData.isVPN = isVPN;
    
    return locationData;
  } catch (error) {
    console.error('Get location data error:', error.message);
    return {
      country: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
      isVPN: false,
      ip: ip,
      error: error.message
    };
  }
};

/**
 * Extract IP address from request object
 * Handles various proxy headers and deployment scenarios
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export const getClientIP = (req) => {
  // List of headers to check in order of preference
  const ipHeaders = [
    'cf-connecting-ip',     // Cloudflare
    'x-forwarded-for',      // Standard proxy header
    'x-real-ip',           // Nginx proxy
    'x-client-ip',         // Apache
    'x-cluster-client-ip', // Cluster
    'x-forwarded',         // General forwarded
    'forwarded-for',       // Alternative
    'forwarded'            // RFC 7239
  ];
  
  // Check each header
  for (const header of ipHeaders) {
    const value = req.headers[header];
    if (value) {
      // Handle comma-separated IPs (take the first one)
      const ip = value.split(',')[0].trim();
      
      // Validate IP format (basic check)
      if (ip && ip !== 'unknown' && !ip.includes('::ffff:')) {
        console.log(`🔍 IP found via ${header}: ${ip}`);
        return ip;
      }
    }
  }
  
  // Fallback to connection properties
  const fallbackIP = req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    req.ip || 
                    '127.0.0.1';
  
  // Clean up IPv6-mapped IPv4 addresses
  const cleanIP = fallbackIP.replace('::ffff:', '');
  
  console.log(`🔍 IP detected (fallback): ${cleanIP}`);
  return cleanIP;
};
