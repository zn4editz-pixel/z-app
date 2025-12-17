import { memo, useState, useCallback } from 'react';
import { getOptimizedAvatar, optimizeImage } from '../utils/imageOptimizer';

/**
 * OptimizedImage - A performance-optimized image component
 * Features:
 * - Native lazy loading
 * - Cloudinary optimization
 * - Blur-up loading effect
 * - Fallback handling
 */
const OptimizedImage = memo(({
    src,
    alt = '',
    className = '',
    width,
    height,
    fallback = '/avatar.png',
    isAvatar = false,
    avatarSize = 80,
    loading = 'lazy',
    ...props
}) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const handleError = useCallback(() => {
        setHasError(true);
    }, []);

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    // Optimize the image URL
    const optimizedSrc = hasError
        ? fallback
        : isAvatar
            ? getOptimizedAvatar(src, avatarSize)
            : optimizeImage(src, { width, height });

    return (
        <img
            src={optimizedSrc || fallback}
            alt={alt}
            className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading={loading}
            decoding="async"
            onError={handleError}
            onLoad={handleLoad}
            width={width}
            height={height}
            {...props}
        />
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
