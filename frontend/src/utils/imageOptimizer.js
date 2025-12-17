/**
 * Image Optimization Utility
 * Optimizes Cloudinary URLs for better performance
 */

/**
 * Optimize a Cloudinary image URL with transformations
 * @param {string} url - Original image URL
 * @param {object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const optimizeImage = (url, options = {}) => {
    if (!url || typeof url !== 'string') return url;

    const {
        width = 400,
        height,
        quality = 'auto:good',
        format = 'auto',
        crop = 'fill',
        gravity = 'face'
    } = options;

    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
        return url;
    }

    // Extract base URL and file path
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const baseUrl = url.substring(0, uploadIndex);
    const filePath = url.substring(uploadIndex + 8); // Skip '/upload/'

    // Build transformation string
    const transforms = [
        `w_${width}`,
        height ? `h_${height}` : null,
        `c_${crop}`,
        `g_${gravity}`,
        `q_${quality}`,
        `f_${format}`,
        'dpr_auto'
    ].filter(Boolean).join(',');

    return `${baseUrl}/upload/${transforms}/${filePath}`;
};

/**
 * Get optimized avatar URL
 */
export const getOptimizedAvatar = (url, size = 80) => {
    if (!url) return '/avatar.png';
    return optimizeImage(url, {
        width: size,
        height: size,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto:low'
    });
};

/**
 * Get optimized thumbnail URL
 */
export const getOptimizedThumbnail = (url) => {
    return optimizeImage(url, {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto:eco'
    });
};

/**
 * Get optimized chat image URL
 */
export const getOptimizedChatImage = (url) => {
    return optimizeImage(url, {
        width: 600,
        quality: 'auto:good',
        format: 'webp'
    });
};

/**
 * Preload critical images
 */
export const preloadImages = (urls) => {
    urls.forEach(url => {
        if (url) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
        }
    });
};

export default {
    optimizeImage,
    getOptimizedAvatar,
    getOptimizedThumbnail,
    getOptimizedChatImage,
    preloadImages
};
