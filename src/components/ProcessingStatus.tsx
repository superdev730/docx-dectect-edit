import React from 'react';
import { FileText, CheckCircle, AlertCircle, Loader, Download } from 'lucide-react';

interface ProcessedFile {
  name: string;
  originalFile: File;
  processedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ProcessingStatusProps {
  file: ProcessedFile;
  onDownload: () => void;
}

export function ProcessingStatus({ file, onDownload }: ProcessingStatusProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'pending':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'pending':
        return 'Ready to process';
      case 'processing':
        return 'Processing document...';
      case 'completed':
        return 'Successfully processed';
      case 'error':
        return file.error || 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'pending':
        return 'border-gray-200 bg-gray-50';
      case 'processing':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor()} transition-all duration-200`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <p className="font-medium text-gray-800">{file.name}</p>
          <p className="text-sm text-gray-600">{getStatusText()}</p>
        </div>
      </div>
      
      {file.status === 'completed' && (
        <button
          onClick={onDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>
      )}
      
      {file.status === 'processing' && (
        <div className="text-blue-600 text-sm font-medium">
          Please wait...
        </div>
      )}
    </div>
  );
}