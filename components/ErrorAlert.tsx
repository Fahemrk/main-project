import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface ErrorAlertProps {
  title: string;
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ title, message, onDismiss, onRetry }) => {
  const { isDark } = useTheme();
  return (
    <div className={`border-l-4 border-red-500 p-4 rounded-lg shadow-md mb-4 ${isDark ? 'bg-red-950' : 'bg-red-50'}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} size={20} />
        <div className="flex-grow">
          <h3 className={`font-bold mb-1 ${isDark ? 'text-red-300' : 'text-red-800'}`}>{title}</h3>
          <p className={`text-sm mb-3 ${isDark ? 'text-red-400' : 'text-red-700'}`}>{message}</p>
          <div className="flex gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={`text-sm font-semibold px-3 py-1 rounded transition-colors ${
                  isDark 
                    ? 'text-red-300 hover:text-red-200 bg-red-950 hover:bg-red-900' 
                    : 'text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200'
                }`}
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className={`text-sm font-semibold px-3 py-1 rounded transition-colors ${
                isDark 
                  ? 'text-red-300 hover:text-red-200 bg-red-950 hover:bg-red-900' 
                  : 'text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200'
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close error alert"
          className={`flex-shrink-0 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}`}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;
