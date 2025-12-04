import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 max-w-md w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Something Went Wrong</h1>
            </div>
            
            <p className="text-slate-600 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-mono text-red-700 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <button
              onClick={this.resetError}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="w-full mt-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
