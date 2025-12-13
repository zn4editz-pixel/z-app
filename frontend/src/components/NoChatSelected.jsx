const NoChatSelected = () => {
  return (
    // Hidden on small screens, block on medium (desktop) screens
    <div className="hidden md:flex w-full flex-1 flex-col items-center justify-center p-6 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center gap-4 mb-4">
          <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center animate-bounce">
            {/* ✅ Animated Gradient Logo */}
            <div
              className="w-20 h-20 bg-gradient-to-r from-base-content via-base-content/50 to-base-content animate-gradient"
              style={{
                maskImage: 'url("/z-app-logo.png")',
                WebkitMaskImage: 'url("/z-app-logo.png")',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
              }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-base-content">Welcome to Z-APP!</h2>
        <p className="text-base-content/70 text-lg">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
