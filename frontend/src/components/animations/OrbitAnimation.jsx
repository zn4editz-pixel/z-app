import { Video, MessageSquare, Gamepad2, Users, Heart } from "lucide-react";
const OrbitAnimation = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 w-full h-full relative overflow-hidden font-sans">
      {/* 🌌 Cosmic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-base-200 via-base-300 to-base-100 opacity-50" />
      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse-slow" />
      {/* 💫 The Orbiting Social Hub - STANDARD SIZE (Fixed Zoom) */}
      <div className="relative w-full h-full flex items-center justify-center scale-100">
        {/* Core Glow */}
        <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute w-96 h-96 bg-secondary/10 rounded-full blur-[150px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        {/* 🌟 Central Core with Logo */}
        <div className="relative z-10 w-32 h-32 bg-base-100/50 backdrop-blur-xl rounded-[2rem] border-2 border-white/20 shadow-2xl flex items-center justify-center animate-float">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2rem] animate-pulse" />
          <img
            src="/z-app-logo.png"
            alt="Logo"
            className="relative z-10 w-24 h-24 object-contain drop-shadow-2xl animate-pulse"
          />
        </div>
        {/* 🪐 Orbit Ring 1 (Inner) */}
        <div className="absolute w-[50vh] h-[50vh] border border-base-content/5 rounded-full animate-spin-slow duration-[25s] border-dashed">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
            <MessageSquare className="w-8 h-8 text-secondary" />
          </div>
        </div>
        {/* 🪐 Orbit Ring 2 (Outer) */}
        <div className="absolute w-[80vh] h-[80vh] border border-base-content/5 rounded-full animate-spin-slow duration-[40s] flex items-center justify-center opacity-70">
          <div className="absolute top-1/4 -right-6 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
            <Gamepad2 className="w-8 h-8 text-accent" />
          </div>
          <div className="absolute bottom-1/4 -left-6 bg-base-100 p-4 rounded-3xl shadow-xl border border-base-content/10 animate-reverse-spin">
            <Users className="w-8 h-8 text-success" />
          </div>
          <div className="absolute top-1/2 right-[92%] bg-base-100 p-3 rounded-2xl shadow-xl border border-base-content/10 animate-reverse-spin">
            <Heart className="w-6 h-6 text-error" />
          </div>
        </div>
      </div>
      {/* 📜 Text Content */}
      <div className="absolute bottom-12 left-0 right-0 text-center px-8 z-20">
        <h2 className="text-4xl font-extrabold mb-3 text-base-content tracking-tight">
          {title}
        </h2>
        <p className="text-base-content/60 text-lg leading-relaxed max-w-md mx-auto">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
export default OrbitAnimation;
