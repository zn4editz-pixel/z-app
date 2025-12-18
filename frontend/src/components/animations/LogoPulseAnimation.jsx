import { motion } from "framer-motion";
const LogoPulseAnimation = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-base-100 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-base-100 to-base-100" />
      {/* Ripples */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute border border-primary/30 rounded-full"
          initial={{ width: "100px", height: "100px", opacity: 0.8 }}
          animate={{
            width: ["100px", "600px"],
            height: ["100px", "600px"],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut",
          }}
        />
      ))}
      {/* Central Logo Container */}
      <motion.div
        className="relative z-10 w-32 h-32 flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <img
          src="/z-app-logo.png"
          alt="Logo"
          className="w-24 h-24 object-contain relative z-20"
        />
      </motion.div>
    </div>
  );
};
export default LogoPulseAnimation;
