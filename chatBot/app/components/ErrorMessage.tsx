'use client';

import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
      <AlertCircle size={20} className="flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 font-bold text-sm"
        >
          ✕
        </button>
      )}
    </div>
  );
}
