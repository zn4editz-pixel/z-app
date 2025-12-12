// Temporary debug page to check environment variables
const DebugPage = () => {
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-2xl mx-auto bg-base-100 rounded-lg shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-4">Environment Debug Info</h1>
        
        <div className="space-y-4">
          <div className="bg-base-200 p-4 rounded">
            <h2 className="font-semibold mb-2">API Configuration:</h2>
            <p className="text-sm">
              <strong>VITE_API_BASE_URL:</strong>{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                {import.meta.env.VITE_API_BASE_URL || "NOT SET"}
              </code>
            </p>
            <p className="text-sm mt-2">
              <strong>VITE_API_URL:</strong>{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                {import.meta.env.VITE_API_URL || "NOT SET"}
              </code>
            </p>
            <p className="text-sm mt-2">
              <strong>MODE:</strong>{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                {import.meta.env.MODE}
              </code>
            </p>
            <p className="text-sm mt-2">
              <strong>PROD:</strong>{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                {import.meta.env.PROD ? "true" : "false"}
              </code>
            </p>
          </div>

          <div className="bg-base-200 p-4 rounded">
            <h2 className="font-semibold mb-2">Current Location:</h2>
            <p className="text-sm">
              <strong>Origin:</strong>{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                {window.location.origin}
              </code>
            </p>
            <p className="text-sm mt-2">
              <strong>Hostname:</strong>{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                {window.location.hostname}
              </code>
            </p>
          </div>

          <div className="bg-base-200 p-4 rounded">
            <h2 className="font-semibold mb-2">Expected Backend URL:</h2>
            <p className="text-sm">
              Should be:{" "}
              <code className="bg-base-300 px-2 py-1 rounded">
                https://z-app-backend.onrender.com
              </code>
            </p>
          </div>

          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>
              If VITE_API_BASE_URL shows "NOT SET" or wrong URL, update it in Render dashboard and redeploy.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
