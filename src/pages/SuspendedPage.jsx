const SuspendedPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-md w-full bg-base-100 rounded-xl shadow-lg p-6 sm:p-8 text-center space-y-4">
        <div className="text-6xl sm:text-7xl mb-4">⛔</div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-warning">Account Suspended</h1>
        <p className="text-sm sm:text-base md:text-lg text-base-content/70">
          Your account has been temporarily suspended.
        </p>
        <p className="text-sm sm:text-base text-base-content/60">
          Please contact support for more information.
        </p>
        <div className="pt-4 space-y-2">
          <a href="mailto:support@z-app.com" className="btn btn-primary btn-sm sm:btn-md w-full">
            Contact Support
          </a>
          <a href="/login" className="btn btn-ghost btn-sm sm:btn-md w-full">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default SuspendedPage;
