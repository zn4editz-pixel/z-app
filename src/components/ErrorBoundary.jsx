import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    if (import.meta.env.DEV) console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // TODO: Send error to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
          <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-error" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
            <p className="text-base-content/70 mb-6">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-error mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-base-200 p-4 rounded-lg text-xs overflow-auto max-h-40">
                  <p className="font-mono text-error mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-base-content/60 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="btn btn-primary flex-1 gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn btn-ghost flex-1 gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-base-content/50 mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
