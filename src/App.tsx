import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { DocumentProcessor } from './services/DocumentProcessor';
import { ContractEditor } from './services/ContractEditor';
import { FileUploader } from './components/FileUploader';
import { ProcessingStatus } from './components/ProcessingStatus';
import { DownloadButton } from './components/DownloadButton';

interface ProcessedFile {
  name: string;
  originalFile: File;
  processedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

function App() {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((uploadedFiles: File[]) => {
    const newFiles = uploadedFiles.map(file => ({
      name: file.name,
      originalFile: file,
      status: 'pending' as const
    }));
    setFiles(newFiles);
  }, []);

  const processDocuments = async () => {
    setIsProcessing(true);
    
    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      const file = updatedFiles[i];
      
      try {
        updatedFiles[i] = { ...file, status: 'processing' };
        setFiles([...updatedFiles]);
        
        const processor = new DocumentProcessor();
        const editor = new ContractEditor();
        
        // Determine which contract this is and get the appropriate editing instructions
        let editingResult;
        
        if (file.name.toLowerCase().includes('contract1') || file.name.toLowerCase().includes('contract 1')) {
          editingResult = await editor.editContract1(file.originalFile);
        } else if (file.name.toLowerCase().includes('contract2') || file.name.toLowerCase().includes('contract 2')) {
          editingResult = await editor.editContract2(file.originalFile);
        } else if (file.name.toLowerCase().includes('contract3') || file.name.toLowerCase().includes('contract 3')) {
          editingResult = await editor.editContract3(file.originalFile);
        } else {
          // If we can't determine from filename, try to analyze content
          editingResult = await editor.analyzeAndEdit(file.originalFile);
        }
        
        updatedFiles[i] = { 
          ...file, 
          status: 'completed',
          processedBlob: editingResult
        };
        
      } catch (error) {
        updatedFiles[i] = { 
          ...file, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Processing failed'
        };
      }
      
      setFiles([...updatedFiles]);
    }
    
    setIsProcessing(false);
  };

  const downloadFile = (file: ProcessedFile) => {
    if (!file.processedBlob) return;
    
    const url = URL.createObjectURL(file.processedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.processedBlob);
    completedFiles.forEach(file => downloadFile(file));
  };

  const reset = () => {
    setFiles([]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              DOCX Contract Editor
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatically parse and edit contract documents with precise clause insertion and formatting
          </p>
        </div>

        {/* Instructions Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            Contract Editing Instructions
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Contract 1</h3>
              <p className="text-gray-700">
                Inserts "Affiliate" definition as section 1A after the "Definitions" heading with matching document style.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Contract 2</h3>
              <p className="text-gray-700">
                Adds disclaimer text between the first and second sentence in Section 11 with matching font.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Contract 3</h3>
              <p className="text-gray-700">
                Creates new section 11 "Residuals" after section 10 with bold and underlined heading.
              </p>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        {files.length === 0 && (
          <FileUploader 
            onFileUpload={handleFileUpload}
            acceptedTypes=".docx"
            maxFiles={3}
          />
        )}

        {/* File Processing Status */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Processing Status
            </h2>
            <div className="space-y-3">
              {files.map((file, index) => (
                <ProcessingStatus 
                  key={index}
                  file={file}
                  onDownload={() => downloadFile(file)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center">
            {!isProcessing && files.every(f => f.status === 'pending') && (
              <button
                onClick={processDocuments}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5 mr-2" />
                Process Documents
              </button>
            )}

            {files.some(f => f.status === 'completed') && (
              <button
                onClick={downloadAll}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5 mr-2" />
                Download All Edited Files
              </button>
            )}

            <button
              onClick={reset}
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Start Over
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            Upload your contract documents and let our intelligent system handle precise clause insertion with perfect formatting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;