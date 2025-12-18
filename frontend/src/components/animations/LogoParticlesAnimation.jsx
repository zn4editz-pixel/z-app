import { useRef } from "react";
import { motion } from "framer-motion";
const LogoParticlesAnimation = () => {
  // Generate random particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100, // %
    y: Math.random() * 100, // %
    size: Math.random() * 6 + 2,
    duration: Math.random() * 5 + 3,
    delay: Math.random() * 2,
  }));
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-base-300 to-base-100 overflow-hidden relative">
      {/* Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-primary rounded-full opacity-30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Glassmorphism Card with Logo */}
      <motion.div
        className="relative z-10 w-48 h-48 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/20 shadow-2xl"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin-slow" />
        <img
          src="/z-app-logo.png"
          alt="Logo"
          className="w-28 h-28 object-contain"
        />
      </motion.div>
    </div>
  );
};
export default LogoParticlesAnimation;
