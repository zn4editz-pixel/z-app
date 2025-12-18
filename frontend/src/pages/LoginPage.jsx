import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import toast from "react-hot-toast"; // ✅ FIXED: Import toast
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import SnowEffect from "../components/effects/SnowEffect";
import ChatBackground from "../components/effects/ChatBackground";
import "../styles/login-interaction-fix.css";
import { motion } from "framer-motion";
const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  // ✅ CHANGED: Renamed 'email' to 'emailOrUsername'
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const { login, isLoggingIn } = useAuthStore();
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
  // ✅ FIXED: Add form validation
  const validateForm = () => {
    if (!formData.emailOrUsername.trim()) {
      toast.error("Email or username is required");
      return false;
    }
    if (!formData.password) {
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate before submitting
    if (!validateForm()) return;
    login(formData);
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-[100dvh] bg-base-100 grid lg:grid-cols-2 lg:h-screen overflow-x-hidden auth-smooth-scroll"
    >
      {/* Left Side - Form with Scrolling */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 login-form-container relative overflow-y-auto max-h-[100dvh] auth-smooth-scroll">
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
        <div className="w-full max-w-md space-y-6 relative z-10">
          {/* Logo with Premium Gradient Shine Animation */}
          <div className="text-center mb-6">
            <div className="flex flex-col items-center gap-2 group">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-base-content/20 via-base-content/10 to-base-content/20 flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg premium-logo-container overflow-hidden">
                {/* Enhanced Gradient Shine Overlay - Multiple layers for better visibility */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-base-100/40 to-transparent premium-shine-animation"></div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-base-content/30 to-transparent premium-shine-animation-secondary"></div>
                {/* Logo with original colors */}
                <img
                  src="/z-app-logo.png"
                  alt="Z App Logo"
                  className="w-12 h-12 relative z-20 object-contain"
                />
                {/* Enhanced inner glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-base-content/70 to-base-content/70 blur-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                {/* Medium glow layer */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-base-content/50 to-base-content/50 blur-xl opacity-70 group-hover:opacity-90 transition-opacity duration-300 z-0"></div>
                {/* Outer glow for maximum visibility */}
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-base-content/40 to-base-content/40 blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 -z-10"></div>
                {/* Ultra-wide glow for desktop visibility */}
                <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-base-content/25 to-base-content/25 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-300 -z-20 hidden lg:block"></div>
              </div>
              <h1 className="text-2xl font-bold mt-4 bg-gradient-to-r from-base-content to-base-content/80 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✅ CHANGED: Email field is now Email/Username field */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Email or Username
                </span>
              </label>
              <div className="relative">
                <div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
                  {/* Replaced Mail icon with User icon */}
                  <User className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="text" // Changed from 'email' to 'text'
                  className={`input input-bordered w-full pl-10`}
                  placeholder="Email or Username" // Updated placeholder
                  value={formData.emailOrUsername} // Updated value
                  autoComplete="username"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailOrUsername: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            {/* ✅ END OF CHANGES */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="!absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none !z-[102]">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="Password"
                  value={formData.password}
                  autoComplete="current-password"
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
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full shadow-lg"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary font-medium">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right Side - Animation Background */}
      <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 h-full">
        <AuthImagePattern
          variant="login"
          title={"Welcome Back!"}
          subtitle={
            "Sign in to continue your conversations and catch up with your messages."
          }
          animationType={settings?.loginAnimation} // Pass dynamic animation
        />
      </div>
    </motion.div>
  );
};
export default LoginPage;
