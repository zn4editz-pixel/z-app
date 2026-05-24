import { gsap } from 'gsap';

// Check if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Initialize GSAP with performance settings
gsap.config({
	force3D: true,
	nullTargetWarn: false,
});

// Helper to respect reduced motion preference
const getAnimationDuration = (duration) => prefersReducedMotion ? 0 : duration;

// Fade in animation
export const fadeIn = (element, duration = 0.5, delay = 0) => {
	return gsap.from(element, {
		opacity: 0,
		duration: getAnimationDuration(duration),
		delay: getAnimationDuration(delay),
		ease: 'power2.out',
	});
};

// Fade out animation
export const fadeOut = (element, duration = 0.5) => {
	return gsap.to(element, {
		opacity: 0,
		duration,
		ease: 'power2.in',
	});
};

// Slide in from bottom
export const slideInUp = (element, duration = 0.6, delay = 0) => {
	return gsap.from(element, {
		y: 50,
		opacity: 0,
		duration,
		delay,
		ease: 'power3.out',
	});
};

// Slide in from top
export const slideInDown = (element, duration = 0.6, delay = 0) => {
	return gsap.from(element, {
		y: -50,
		opacity: 0,
		duration,
		delay,
		ease: 'power3.out',
	});
};

// Slide in from left
export const slideInLeft = (element, duration = 0.6, delay = 0) => {
	return gsap.from(element, {
		x: -50,
		opacity: 0,
		duration,
		delay,
		ease: 'power3.out',
	});
};

// Slide in from right
export const slideInRight = (element, duration = 0.6, delay = 0) => {
	return gsap.from(element, {
		x: 50,
		opacity: 0,
		duration,
		delay,
		ease: 'power3.out',
	});
};

// Scale in animation
export const scaleIn = (element, duration = 0.5, delay = 0) => {
	return gsap.from(element, {
		scale: 0.8,
		opacity: 0,
		duration,
		delay,
		ease: 'back.out(1.7)',
	});
};

// Stagger animation for lists
export const staggerIn = (elements, duration = 0.5, stagger = 0.1) => {
	return gsap.from(elements, {
		y: 30,
		opacity: 0,
		duration,
		stagger,
		ease: 'power2.out',
	});
};

// Smooth hover scale
export const hoverScale = (element, scale = 1.05) => {
	element.addEventListener('mouseenter', () => {
		gsap.to(element, {
			scale,
			duration: 0.3,
			ease: 'power2.out',
		});
	});
	
	element.addEventListener('mouseleave', () => {
		gsap.to(element, {
			scale: 1,
			duration: 0.3,
			ease: 'power2.out',
		});
	});
};

// Parallax effect
export const parallax = (element, speed = 0.5) => {
	const handleScroll = () => {
		const scrolled = window.pageYOffset;
		gsap.to(element, {
			y: scrolled * speed,
			ease: 'none',
			duration: 0,
		});
	};
	
	window.addEventListener('scroll', handleScroll);
	return () => window.removeEventListener('scroll', handleScroll);
};

// Smooth page transition
export const pageTransition = (onComplete) => {
	const tl = gsap.timeline({
		onComplete,
	});
	
	tl.to('.page-transition', {
		scaleY: 1,
		duration: 0.5,
		ease: 'power4.inOut',
		transformOrigin: 'bottom',
	})
	.to('.page-transition', {
		scaleY: 0,
		duration: 0.5,
		ease: 'power4.inOut',
		transformOrigin: 'top',
	}, '+=0.3');
	
	return tl;
};

// Smooth scroll to element
export const scrollToElement = (element, duration = 1) => {
	return gsap.to(window, {
		scrollTo: {
			y: element,
			offsetY: 100,
		},
		duration,
		ease: 'power3.inOut',
	});
};

// Counter animation
export const animateCounter = (element, endValue, duration = 2) => {
	const obj = { value: 0 };
	
	return gsap.to(obj, {
		value: endValue,
		duration,
		ease: 'power2.out',
		onUpdate: () => {
			element.textContent = Math.round(obj.value);
		},
	});
};

// Reveal text animation
export const revealText = (element, duration = 0.8) => {
	const text = element.textContent;
	element.innerHTML = text.split('').map(char => 
		`<span style="display:inline-block">${char === ' ' ? '&nbsp;' : char}</span>`
	).join('');
	
	return gsap.from(element.children, {
		y: 50,
		opacity: 0,
		duration: duration / text.length,
		stagger: 0.03,
		ease: 'power3.out',
	});
};

// Magnetic button effect
export const magneticButton = (button) => {
	const handleMouseMove = (e) => {
		const rect = button.getBoundingClientRect();
		const x = e.clientX - rect.left - rect.width / 2;
		const y = e.clientY - rect.top - rect.height / 2;
		
		gsap.to(button, {
			x: x * 0.3,
			y: y * 0.3,
			duration: 0.3,
			ease: 'power2.out',
		});
	};
	
	const handleMouseLeave = () => {
		gsap.to(button, {
			x: 0,
			y: 0,
			duration: 0.5,
			ease: 'elastic.out(1, 0.3)',
		});
	};
	
	button.addEventListener('mousemove', handleMouseMove);
	button.addEventListener('mouseleave', handleMouseLeave);
	
	return () => {
		button.removeEventListener('mousemove', handleMouseMove);
		button.removeEventListener('mouseleave', handleMouseLeave);
	};
};

// Loading animation
export const loadingAnimation = (element) => {
	return gsap.to(element, {
		rotation: 360,
		duration: 1,
		ease: 'none',
		repeat: -1,
	});
};

// Pulse animation
export const pulse = (element, scale = 1.1, duration = 0.8) => {
	return gsap.to(element, {
		scale,
		duration,
		ease: 'power1.inOut',
		yoyo: true,
		repeat: -1,
	});
};
