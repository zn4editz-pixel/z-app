import { useEffect, useState, memo } from "react";

const ChatBackground = ({ opacity = 0.05, count = 10 }) => {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    // Generate parameters once to ensure stable rendering without flickering
    const newElements = Array.from({ length: count }).map((_, i) => {
      const type = i % 3; // 0: Sleek Z Outline, 1: Tech-Ring Z, 2: Minimal Sparkle
      const left = Math.random() * 90 + 5; // Keep away from strict edges
      const delay = Math.random() * -30; // Distribute across the screen immediately
      const duration = 25 + Math.random() * 25; // Super slow and smooth movement (25s to 50s)
      const size = type === 2 ? 12 + Math.random() * 12 : 28 + Math.random() * 24; // Small, elegant sizing
      const drift = Math.random() * 60 - 30; // Gentle sway
      const rotation = Math.random() * 180 + 90; // Subtle rotation
      
      return {
        id: i,
        type,
        left,
        delay,
        duration,
        size,
        drift,
        rotation,
      };
    });

    setElements(newElements);
  }, [count]);

  const renderMinimalSVG = (type) => {
    switch (type) {
      case 0: // Sleek Z Outline (Thin glowing vector strokes)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary/15 select-none pointer-events-none">
            <path
              d="M 30 30 H 70 L 30 70 H 70"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 1: // Tech-Ring Z (Orbit ring with micro-Z inside)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full text-secondary/15 select-none pointer-events-none">
            <circle 
              cx="50" 
              cy="50" 
              r="42" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeDasharray="4 6" 
              className="opacity-60"
            />
            <path
              d="M 40 40 H 60 L 40 60 H 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 2: // Minimal Sparkle (4-point star accent)
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full text-primary/20 select-none pointer-events-none">
            <path
              d="M12 2 Q12 12 2 12 Q12 12 12 22 Q12 12 22 12 Q12 12 12 2"
              fill="currentColor"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      style={{ opacity }}
    >
      <style>
        {`
          @keyframes minimal-float-up {
            0% {
              transform: translateY(115vh) translateX(0px) rotate(0deg);
              opacity: 0;
            }
            15% {
              opacity: 0.8;
            }
            85% {
              opacity: 0.8;
            }
            100% {
              transform: translateY(-20vh) translateX(var(--drift)) rotate(var(--rot));
              opacity: 0;
            }
          }
          .minimal-char-container {
            will-change: transform, opacity;
            transform: translateY(115vh);
          }
        `}
      </style>
      
      {elements.map((el) => (
        <div
          key={el.id}
          className="absolute minimal-char-container"
          style={{
            left: `${el.left}%`,
            width: `${el.size}px`,
            height: `${el.size}px`,
            animation: `minimal-float-up ${el.duration}s linear infinite`,
            animationDelay: `${el.delay}s`,
            "--drift": `${el.drift}px`,
            "--rot": `${el.rotation}deg`,
          }}
        >
          {renderMinimalSVG(el.type)}
        </div>
      ))}
    </div>
  );
};

export default memo(ChatBackground);
