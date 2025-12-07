/**
 * Image Compression Utility
 * Compresses images before upload to reduce bandwidth and storage
 */

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<string>} Base64 encoded compressed image
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compress profile picture (smaller size)
 * @param {File} file - The image file
 * @returns {Promise<string>} Compressed base64 image
 */
export const compressProfilePicture = async (file) => {
  return compressImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.85,
    mimeType: 'image/jpeg'
  });
};

/**
 * Compress chat image (medium size)
 * @param {File} file - The image file
 * @returns {Promise<string>} Compressed base64 image
 */
export const compressChatImage = async (file) => {
  return compressImage(file, {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    mimeType: 'image/jpeg'
  });
};

/**
 * Get file size in KB
 * @param {string} base64 - Base64 encoded image
 * @returns {number} Size in KB
 */
export const getBase64Size = (base64) => {
  const stringLength = base64.length - 'data:image/png;base64,'.length;
  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
  return sizeInBytes / 1024;
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImage = (file, options = {}) => {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    errors.push(`File size ${sizeMB.toFixed(2)}MB exceeds maximum ${maxSizeMB}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
