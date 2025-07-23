import React from 'react';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  onDownload: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function DownloadButton({ onDownload, disabled = false, className = '', children }: DownloadButtonProps) {
  return (
    <button
      onClick={onDownload}
      disabled={disabled}
      className={`
        inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200
        ${disabled 
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
        }
        ${className}
      `}
    >
      <Download className="w-4 h-4 mr-2" />
      {children}
    </button>
  );
}