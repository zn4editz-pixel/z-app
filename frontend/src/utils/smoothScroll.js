// Lenis completely disabled - using native scrolling everywhere
// This provides better touch support and performance on all devices

let lenis = null;

export const initSmoothScroll = () => {
	// Return null - native scrolling only
	console.log('✅ Using native scrolling for better touch support');
	return null;
};

export const destroySmoothScroll = () => {
	// Nothing to destroy
	lenis = null;
};

export const getLenis = () => null;

export const scrollTo = (target, options = {}) => {
	// Use native scrollIntoView instead
	if (typeof target === 'string') {
		const element = document.querySelector(target);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', ...options });
		}
	} else if (target instanceof Element) {
		target.scrollIntoView({ behavior: 'smooth', ...options });
	}
};
