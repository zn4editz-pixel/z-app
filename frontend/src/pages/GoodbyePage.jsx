const GoodbyePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 text-center bg-base-200">
      <div className="max-w-md w-full bg-base-100 rounded-xl shadow-lg p-6 sm:p-8 space-y-4">
        <div className="text-6xl sm:text-7xl mb-4">👋</div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-error">Account Deleted</h1>
        <p className="text-sm sm:text-base md:text-lg text-base-content/70">
          Your account has been permanently deleted.
        </p>
        <p className="text-sm sm:text-base text-base-content/60">
          We're sorry to see you go.
        </p>
        <div className="pt-4">
          <a href="/signup" className="btn btn-primary btn-sm sm:btn-md">
            Create New Account
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoodbyePage;
