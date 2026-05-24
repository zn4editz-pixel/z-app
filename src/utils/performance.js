// Performance optimization utilities

// Debounce function for expensive operations
export const debounce = (func, wait) => {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

// Throttle function for scroll/resize events
export const throttle = (func, limit) => {
	let inThrottle;
	return function(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	};
};

// Lazy load images
export const lazyLoadImage = (img) => {
	const src = img.dataset.src;
	if (!src) return;
	
	img.src = src;
	img.removeAttribute('data-src');
};

// Intersection Observer for lazy loading
export const createLazyLoadObserver = (callback) => {
	const options = {
		root: null,
		rootMargin: '50px',
		threshold: 0.01
	};
	
	return new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				callback(entry.target);
			}
		});
	}, options);
};

// Compress image before upload
export const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (event) => {
			const img = new Image();
			img.src = event.target.result;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;
				
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}
				
				canvas.width = width;
				canvas.height = height;
				
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, width, height);
				
				canvas.toBlob((blob) => {
					resolve(new File([blob], file.name, {
						type: 'image/jpeg',
						lastModified: Date.now(),
					}));
				}, 'image/jpeg', quality);
			};
		};
	});
};

// Request Animation Frame throttle
export const rafThrottle = (callback) => {
	let requestId = null;
	
	return function(...args) {
		if (requestId === null) {
			requestId = requestAnimationFrame(() => {
				callback.apply(this, args);
				requestId = null;
			});
		}
	};
};

// Batch DOM updates
export const batchDOMUpdates = (updates) => {
	requestAnimationFrame(() => {
		updates.forEach(update => update());
	});
};

// Preload critical resources
export const preloadResource = (url, as = 'fetch') => {
	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = as;
	link.href = url;
	document.head.appendChild(link);
};

// Memory cleanup
export const cleanupMemory = () => {
	// Clear any cached data that's not needed
	if (window.gc) {
		window.gc(); // Only available in dev mode
	}
};

// Check if user is on slow connection
export const isSlowConnection = () => {
	const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
	if (!connection) return false;
	
	return connection.effectiveType === 'slow-2g' || 
	       connection.effectiveType === '2g' ||
	       connection.saveData === true;
};

// Adaptive loading based on connection
export const getAdaptiveQuality = () => {
	if (isSlowConnection()) {
		return {
			imageQuality: 0.6,
			videoQuality: 'low',
			enableAnimations: false,
			prefetch: false
		};
	}
	
	return {
		imageQuality: 0.8,
		videoQuality: 'high',
		enableAnimations: true,
		prefetch: true
	};
};

// Virtual scrolling for large lists
export class VirtualScroller {
	constructor(container, itemHeight, renderItem) {
		this.container = container;
		this.itemHeight = itemHeight;
		this.renderItem = renderItem;
		this.items = [];
		this.visibleStart = 0;
		this.visibleEnd = 0;
	}
	
	setItems(items) {
		this.items = items;
		this.update();
	}
	
	update() {
		const scrollTop = this.container.scrollTop;
		const containerHeight = this.container.clientHeight;
		
		this.visibleStart = Math.floor(scrollTop / this.itemHeight);
		this.visibleEnd = Math.ceil((scrollTop + containerHeight) / this.itemHeight);
		
		this.render();
	}
	
	render() {
		const fragment = document.createDocumentFragment();
		
		for (let i = this.visibleStart; i < this.visibleEnd && i < this.items.length; i++) {
			const item = this.renderItem(this.items[i], i);
			fragment.appendChild(item);
		}
		
		this.container.innerHTML = '';
		this.container.appendChild(fragment);
	}
}
