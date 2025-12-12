import { useEffect, useState } from 'react';
import '../../styles/admin-particles-animation.css';

const GoldenParticles = ({ particleCount = 15, intensity = 'low' }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      const count = intensity === 'minimal' ? 6 : intensity === 'low' ? 10 : intensity === 'high' ? 20 : particleCount;
      
      for (let i = 0; i < count; i++) {
        const particle = {
          id: i,
          size: getRandomSize(),
          type: getRandomType(),
          delay: Math.random() * 25, // Spread out delays more
          left: Math.random() * 100,
        };
        newParticles.push(particle);
      }
      
      setParticles(newParticles);
    };

    generateParticles();
  }, [particleCount, intensity]);

  const getRandomSize = () => {
    const sizes = ['small', 'medium', 'large', 'extra-large'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // More small particles
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < sizes.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return sizes[i];
      }
    }
    
    return 'small';
  };

  const getRandomType = () => {
    const types = ['', 'glow', 'sparkle']; // Simplified for performance
    const weights = [0.5, 0.3, 0.2]; // More basic particles
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return types[i];
      }
    }
    
    return '';
  };

  return (
    <div className="particles-container">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle particle-${particle.size} ${particle.type ? `particle-${particle.type}` : ''}`}
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default GoldenParticles;