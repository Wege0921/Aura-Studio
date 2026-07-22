import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-aura-bark text-aura-cream p-6">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-aura-sand mb-6 text-center max-w-md">
            An unexpected error occurred. Try reloading the page.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-3 rounded-lg bg-aura-clay text-aura-ink font-semibold hover:bg-aura-sand transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
