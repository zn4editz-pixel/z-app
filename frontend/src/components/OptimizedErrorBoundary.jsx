import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class OptimizedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // ✅ PERFORMANCE: Log error without blocking UI
    console.error('🚨 Error Boundary Caught:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // ✅ PERFORMANCE: Report to error tracking service (if available)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    // ✅ PERFORMANCE: Limit retry attempts to prevent infinite loops
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Force page reload after 3 failed retries
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // ✅ PERFORMANCE: Lightweight error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-error mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-base-content mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-base-content/70 mb-6">
                {this.props.fallbackMessage || 
                 "We're sorry, but something unexpected happened. Please try again."}
              </p>
            </div>

            <div className="space-y-3">
              {this.state.retryCount < 3 ? (
                <button
                  onClick={this.handleRetry}
                  className="btn btn-primary w-full"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({3 - this.state.retryCount} attempts left)
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="btn btn-outline w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </div>

            {/* ✅ PERFORMANCE: Show error details only in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-base-content/50 hover:text-base-content">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 p-3 bg-base-200 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ PERFORMANCE: Functional wrapper for easier usage
export const withErrorBoundary = (Component, fallbackMessage) => {
  return function WrappedComponent(props) {
    return (
      <OptimizedErrorBoundary fallbackMessage={fallbackMessage}>
        <Component {...props} />
      </OptimizedErrorBoundary>
    );
  };
};

export default OptimizedErrorBoundary;