import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, User, AtSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import { useSettingsStore } from "../store/useSettingsStore";
import toast from "react-hot-toast";
import SnowEffect from "../components/effects/SnowEffect";
import ChatBackground from "../components/effects/ChatBackground";
import "../styles/login-interaction-fix.css"; // ✅ Added CSS Fix
import { motion } from "framer-motion";
const SignUpPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const { signup, isSigningUp } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();

  // ✅ MEMOIZED: Prevent particle flickering on re-render
  const floatingParticles = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      key: i,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 4 + 2}px`,
        height: `${Math.random() * 4 + 2}px`,
        animationDuration: `${Math.random() * 20 + 10}s`,
        animationDelay: `-${Math.random() * 20}s`,
      }
    }))
    , []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  // ✅ Enable proper scrolling for mobile
  useEffect(() => {
    // Enable smooth scrolling and proper mobile behavior
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
    document.body.style.touchAction = "pan-y"; // Allow vertical scrolling
    document.body.style.webkitOverflowScrolling = "touch"; // iOS momentum scrolling
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
      document.body.style.touchAction = "auto";
    };
  }, []);
  const validateForm = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.username.trim()) return toast.error("Username is required");
    if (formData.username.length < 3)
      return toast.error("Username must be at least 3 characters");
    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username))
      return toast.error(
        "Username can only contain letters, numbers, underscores, periods, and hyphens.",
      );
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (isValid === true) {
      const dataToSend = {
        ...formData,
        username: formData.username.toLowerCase(),
      };
      const success = await signup(dataToSend);
      if (success) navigate("/");
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-[100dvh] bg-base-100 grid lg:grid-cols-2 lg:h-screen overflow-y-auto auth-smooth-scroll"
    >
      {/* Left Side - Form with Scrolling */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-8 login-form-container relative min-h-[100dvh] auth-smooth-scroll">
        {/* ❄️ Seasonal Snow Effect */}
        {settings?.isSeasonalMode && <SnowEffect />}
        {/* 🚀 Premium Chat-Themed Background Animation */}
        <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
          {/* Gradient Mesh Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5" />
          {/* Floating Chat Bubbles */}
          <div
            className="absolute top-10 left-10 w-16 h-10 bg-primary/10 rounded-full animate-float-slow opacity-60"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-32 right-20 w-12 h-8 bg-secondary/10 rounded-full animate-float-slow opacity-50"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-40 left-16 w-20 h-12 bg-accent/10 rounded-full animate-float-slow opacity-40"
            style={{ animationDelay: "4s" }}
          />
          <div
            className="absolute bottom-20 right-12 w-14 h-9 bg-primary/8 rounded-full animate-float-slow opacity-55"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-8 w-10 h-6 bg-secondary/12 rounded-full animate-float-slow opacity-45"
            style={{ animationDelay: "3s" }}
          />
          {/* Animated Connection Lines */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20"
            viewBox="0 0 400 600"
          >
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M50,100 Q200,50 350,150 T300,400 Q150,450 100,300"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              className="animate-pulse text-primary"
              style={{ animationDuration: "4s" }}
            />
            <path
              d="M100,200 Q250,150 300,300 T200,500"
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              fill="none"
              className="animate-pulse text-secondary"
              style={{ animationDuration: "6s", animationDelay: "2s" }}
            />
          </svg>
          {/* Glowing Orbs */}
          <div
            className="absolute top-1/4 right-1/4 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse-slow"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute bottom-1/3 left-1/3 w-40 h-40 bg-secondary/4 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDuration: "10s", animationDelay: "3s" }}
          />
          {/* Message Icons */}
          <div
            className="absolute top-20 right-1/3 text-primary/20 animate-bounce-slow"
            style={{ animationDelay: "1s" }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
          </div>
          <div
            className="absolute bottom-1/4 left-1/4 text-secondary/20 animate-bounce-slow"
            style={{ animationDelay: "3s" }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div
            className="absolute top-1/3 left-1/5 text-accent/20 animate-bounce-slow"
            style={{ animationDelay: "5s" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          {/* Particle System */}
          {/* Particle System - Theme Adaptive & Always Moving */}
          {/* Particle System - Theme Adaptive & Always Moving */}
          {floatingParticles.map((particle) => (
            <div
              key={particle.key}
              className="absolute rounded-full bg-base-content/10 animate-float-particle"
              style={particle.style}
            />
          ))}
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.primary/0.02)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.primary/0.02)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
        </div>
        {/* 🌟 Content Container with Zoom Out Effect */}
        <div className="w-full max-w-md space-y-6 relative z-10 transform scale-90 lg:scale-85 origin-center transition-transform">
          {/* Logo / Heading with Premium Dynamic Theme Glow & Shine Animation */}
          <div className="text-center mb-6">
            <div className="flex flex-col items-center gap-2 group">
              <div className="relative select-none">
                {/* Multi-layered Vibrant Theme Backglows (placed outside so they don't clip) */}
                <div className="absolute inset-0 bg-primary/25 rounded-2xl blur-2xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse-glow-theme"></div>
                <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition-all duration-500"></div>

                {/* Cohesive, beautiful premium logo container */}
                <div className="relative w-16 h-16 rounded-2xl bg-base-200/50 backdrop-blur-md border border-base-content/5 flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-105 group-hover:border-primary/25 overflow-hidden">
                  {/* Enhanced Gradient Shine Overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-base-100/40 to-transparent premium-shine-animation z-10 pointer-events-none"></div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-base-content/30 to-transparent premium-shine-animation-secondary z-10 pointer-events-none"></div>
                  
                  {/* Z symbol with raw 3D metallic detail and theme-adaptive glow */}
                  <img
                    src="/z-app-logo.png"
                    alt="Z App Logo"
                    className="w-10 h-10 object-contain relative z-20 transition-all duration-500"
                    style={{
                      filter: "drop-shadow(0 0 8px oklch(var(--p) / 0.65))",
                      willChange: "filter",
                    }}
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold mt-4 bg-gradient-to-r from-base-content to-base-content/80 bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="text-base-content/60">
                Get started with your free account
              </p>
            </div>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Group: Full Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Full Name */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium">Full Name</span>
                </label>
                <div className="relative">
                  <div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
                    <User className="w-5 h-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="Full Name"
                    value={formData.fullName}
                    autoComplete="name"
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>
              </div>
              {/* Username */}
              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-medium">Username</span>
                </label>
                <div className="relative">
                  <div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
                    <AtSign className="w-5 h-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10"
                    placeholder="username"
                    value={formData.username}
                    autoComplete="username"
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            {/* Email */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Email</span>
              </label>
              <div className="relative">
                <div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
                  <Mail className="w-5 h-5 text-base-content/40" />
                </div>
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  autoComplete="email"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
            {/* Password */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
                  <Lock className="w-5 h-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10"
                  placeholder="Password"
                  value={formData.password}
                  autoComplete="new-password"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="!absolute inset-y-0 right-0 pr-3 flex items-center !z-[102]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-base-content/40" />
                  ) : (
                    <Eye className="w-5 h-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>
            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full shadow-lg mt-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          {/* Already have account */}
          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right Side - Animation Background */}
      <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 h-full">
        <AuthImagePattern
          variant="signup"
          title="Join our community"
          subtitle="Connect with friends, share moments, and stay in touch."
          animationType={settings?.signupAnimation} // Pass dynamic animation
        />
      </div>

      {/* Dynamic Keyframes for Theme-Adaptive Logo Glow animations */}
      <style>{`
        @keyframes pulseGlowTheme {
          0%, 100% { opacity: 0.6; transform: scale(0.98); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
        .animate-pulse-glow-theme {
          animation: pulseGlowTheme 3s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  );
};
export default SignUpPage;
