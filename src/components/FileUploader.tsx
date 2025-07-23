import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
  acceptedTypes: string;
  maxFiles: number;
}

export function FileUploader({ onFileUpload, acceptedTypes, maxFiles }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.name.toLowerCase().endsWith('.docx')
      ).slice(0, maxFiles);
      
      setSelectedFiles(files);
    }
  }, [maxFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files).filter(file => 
        file.name.toLowerCase().endsWith('.docx')
      ).slice(0, maxFiles);
      
      setSelectedFiles(files);
    }
  }, [maxFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFileUpload(selectedFiles);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors duration-200">
      <div
        className={`text-center ${dragActive ? 'bg-blue-50' : ''} p-8 rounded-lg transition-colors duration-200`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Upload Contract Documents
        </h3>
        <p className="text-gray-500 mb-6">
          Drag and drop your .docx files here, or click to select files
        </p>
        
        <button
          onClick={openFileDialog}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center"
        >
          <FileText className="w-5 h-5 mr-2" />
          Choose Files
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
        />
        
        <p className="text-sm text-gray-400 mt-4">
          Maximum {maxFiles} files • .docx format only
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-700 mb-4">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleUpload}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Upload & Prepare for Processing
          </button>
        </div>
      )}
    </div>
  );
}