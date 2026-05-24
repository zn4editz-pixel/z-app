import ChatBackground from "./effects/ChatBackground";

const NoChatSelected = () => {
  return (
    // Hidden on small screens, block on medium (desktop) screens
    <div className="hidden md:flex w-full flex-1 flex-col items-center justify-center p-6 bg-base-100/30 relative overflow-hidden select-none">
      
      {/* 🔮 Subtle Ambient Glow Backdrops (Borderless & Integrated) */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-primary/4 blur-[100px] pointer-events-none animate-orb-drift-1"></div>
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] rounded-full bg-secondary/3 blur-[90px] pointer-events-none animate-orb-drift-2"></div>

      {/* Subtle theme-adaptive grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--p)/0.015)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--p)/0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-35 pointer-events-none" />

      {/* Soft, premium background animation featuring app characters */}
      <ChatBackground count={10} opacity={0.12} />

      <div className="max-w-md text-center space-y-6 z-10 relative">
        <div className="flex justify-center gap-4 mb-4">
          {/* Theme-adaptive glowing logo container - clean and simple */}
          <div className="w-32 h-32 rounded-3xl bg-primary/10 flex items-center justify-center animate-bounce relative group">
            {/* Soft, simple theme-adaptive backglow */}
            <div className="absolute inset-0 bg-primary/15 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <img 
              src="/z-app-logo.png" 
              alt="Z-APP Logo" 
              className="w-20 h-20 object-contain relative z-10 transition-transform duration-300 group-hover:scale-105" 
            />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-base-content">Welcome to Z-APP!</h2>
        <p className="text-base-content/60 text-base max-w-xs mx-auto leading-relaxed">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>

      {/* Internal Custom CSS Styles for Subtle Background Animations */}
      <style>{`
        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.05); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0px, 0px) scale(1.05); }
          50% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes particleFloat {
          0% { transform: translateY(105vh) scale(0.8); opacity: 0; }
          15% { opacity: 0.35; }
          85% { opacity: 0.35; }
          100% { transform: translateY(-5vh) scale(1.2); opacity: 0; }
        }
        .animate-orb-drift-1 {
          animation: orbDrift1 15s ease-in-out infinite;
        }
        .animate-orb-drift-2 {
          animation: orbDrift2 20s ease-in-out infinite;
        }
        .animate-particle-float {
          animation: particleFloat linear infinite;
        }
      `}</style>
    </div>
  );
};

export default NoChatSelected;
