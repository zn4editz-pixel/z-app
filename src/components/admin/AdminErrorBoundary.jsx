import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class AdminErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null, errorInfo: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true };
	}

	componentDidCatch(error, errorInfo) {
		this.setState({
			error: error,
			errorInfo: errorInfo
		});
		
		// Log error to console in development
		if (process.env.NODE_ENV === 'development') {
			console.error('Admin Dashboard Error:', error, errorInfo);
		}
	}

	handleRetry = () => {
		this.setState({ hasError: false, error: null, errorInfo: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-base-200">
					<div className="max-w-md mx-auto text-center p-8">
						<div className="bg-base-100 rounded-2xl p-8 shadow-xl border border-base-300">
							<AlertTriangle className="w-16 h-16 mx-auto mb-4 text-error" />
							<h2 className="text-2xl font-bold text-base-content mb-4">
								Admin Dashboard Error
							</h2>
							<p className="text-base-content/70 mb-6">
								Something went wrong with the admin dashboard. Please try refreshing the page.
							</p>
							
							{process.env.NODE_ENV === 'development' && this.state.error && (
								<details className="text-left mb-6 p-4 bg-base-200 rounded-lg">
									<summary className="cursor-pointer font-semibold text-error mb-2">
										Error Details (Development)
									</summary>
									<pre className="text-xs text-base-content/70 overflow-auto">
										{this.state.error.toString()}
										{this.state.errorInfo.componentStack}
									</pre>
								</details>
							)}
							
							<div className="flex gap-3 justify-center">
								<button
									onClick={this.handleRetry}
									className="btn btn-primary"
								>
									<RefreshCw className="w-4 h-4 mr-2" />
									Try Again
								</button>
								<button
									onClick={() => window.location.reload()}
									className="btn btn-outline"
								>
									Refresh Page
								</button>
							</div>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default AdminErrorBoundary;