import { useEffect, useRef, useState, useCallback } from 'react';
import { throttle } from '../utils/performance';

const OptimizedMessageList = ({ messages, renderMessage }) => {
	const containerRef = useRef(null);
	const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
	const itemHeight = 80; // Approximate height of each message
	const overscan = 5; // Number of items to render outside viewport
	
	const updateVisibleRange = useCallback(
		throttle(() => {
			if (!containerRef.current) return;
			
			const scrollTop = containerRef.current.scrollTop;
			const containerHeight = containerRef.current.clientHeight;
			
			const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
			const end = Math.min(
				messages.length,
				Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
			);
			
			setVisibleRange({ start, end });
		}, 100),
		[messages.length]
	);
	
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		
		container.addEventListener('scroll', updateVisibleRange);
		updateVisibleRange();
		
		return () => container.removeEventListener('scroll', updateVisibleRange);
	}, [updateVisibleRange]);
	
	const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
	const offsetY = visibleRange.start * itemHeight;
	const totalHeight = messages.length * itemHeight;
	
	return (
		<div 
			ref={containerRef}
			className="overflow-y-auto h-full"
			style={{ position: 'relative' }}
		>
			<div style={{ height: `${totalHeight}px`, position: 'relative' }}>
				<div style={{ transform: `translateY(${offsetY}px)` }}>
					{visibleMessages.map((message, index) => 
						renderMessage(message, visibleRange.start + index)
					)}
				</div>
			</div>
		</div>
	);
};

export default OptimizedMessageList;
