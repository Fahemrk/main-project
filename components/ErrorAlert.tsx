import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  title: string;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ title, message, onDismiss, onRetry }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-grow">
          <h3 className="font-bold text-red-800 mb-1">{title}</h3>
          <p className="text-red-700 text-sm mb-3">{message}</p>
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-sm font-semibold text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-900 flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;
