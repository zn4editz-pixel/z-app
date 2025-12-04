const BlockedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 text-center bg-base-200">
      <div className="max-w-md w-full bg-base-100 rounded-xl shadow-lg p-6 sm:p-8 space-y-4">
        <div className="text-6xl sm:text-7xl mb-4">🚫</div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-error">Access Blocked</h1>
        <p className="text-sm sm:text-base md:text-lg text-base-content/70">
          You have been blocked by an administrator.
        </p>
        <p className="text-sm sm:text-base text-base-content/60">
          You can no longer access this service.
        </p>
        <div className="pt-4">
          <a href="mailto:support@z-app.com" className="btn btn-ghost btn-sm sm:btn-md">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlockedPage;
