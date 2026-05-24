const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 h-screen fixed right-0 top-0 w-1/2 z-0 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-base-200 via-base-300 to-primary/5 animate-gradient-flow opacity-60 z-0 pointer-events-none" />

      <div className="max-w-md text-center p-12 relative z-10">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-2xl bg-primary/10 transition-all duration-500 hover:scale-105 hover:bg-primary/20 ${i % 2 === 0 ? "animate-pulse" : "animate-float-slow"
                }`}
              style={{
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        <h2 className="text-2xl font-bold mb-4 animate-slide-up">{title}</h2>
        <p className="text-base-content/60 animate-slide-up" style={{ animationDelay: '0.2s' }}>{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImagePattern;
