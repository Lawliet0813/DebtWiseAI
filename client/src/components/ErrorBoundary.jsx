import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './UI/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Here you could send error to logging service
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="w-12 h-12 text-error-500 mx-auto" />
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              糟糕！出現了錯誤
            </h1>
            
            <p className="text-gray-600 mb-6">
              應用程式遇到了意外錯誤。請重新整理頁面，或聯繫客服支援。
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                fullWidth
                variant="primary"
              >
                重新整理頁面
              </Button>
              
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.href = '/dashboard';
                }}
                fullWidth
                variant="outline"
              >
                返回首頁
              </Button>
            </div>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  錯誤詳細資訊 (開發模式)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-800 overflow-auto">
                  <div className="mb-2">
                    <strong>錯誤:</strong>
                    <pre className="whitespace-pre-wrap">{error && error.toString()}</pre>
                  </div>
                  <div>
                    <strong>堆疊追蹤:</strong>
                    <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;