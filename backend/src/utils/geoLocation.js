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
 * Detect country and VPN status from IP address
 * Uses ipapi.co free tier (1,000 requests/day)
 * @param {string} ip - IP address to check
 * @returns {Promise<Object>} Location and VPN data
 */
export const detectCountry = async (ip) => {
  try {
    // Skip detection for localhost/private IPs
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log(`⚠️ Skipping geolocation for localhost/private IP: ${ip}`);
      return {
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
        isVPN: false,
        ip: ip
      };
    }

    console.log(`🌍 Detecting location for IP: ${ip}`);
    
    // Use ipapi.co for geolocation (free tier: 1,000 requests/day)
    const data = await httpsGet(`https://ipapi.co/${ip}/json/`);

    // Check if response indicates an error
    if (data.error) {
      console.error(`❌ IP API error for ${ip}:`, data.reason);
      return {
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
        isVPN: false,
        ip: ip
      };
    }

    console.log(`✅ Location detected for ${ip}: ${data.city}, ${data.country_name}`);

    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'XX',
      city: data.city || 'Unknown',
      region: data.region || '',
      timezone: data.timezone || '',
      isVPN: false, // ipapi.co free tier doesn't include VPN detection
      ip: ip
    };
  } catch (error) {
    console.error(`❌ Geolocation detection error for ${ip}:`, error.message);
    
    // Return default values on error
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
 * Handles various proxy headers
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export const getClientIP = (req) => {
  // Check various headers for real IP (in case of proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  return req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
};
