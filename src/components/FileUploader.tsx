import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCode, FolderOpen } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [uploadMode, setUploadMode] = useState<'file' | 'folder'>('file');
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; path: string }[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const fileEntries = acceptedFiles.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name, // Preserve folder structure
    }));
    setUploadedFiles(fileEntries);
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    noClick: false,
    noKeyboard: false,
    directory: uploadMode === 'folder', // Enables folder selection
  });

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-4">
        <button
          className={`px-4 py-2 rounded-lg transition-all ${
            uploadMode === 'file' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-800'
          }`}
          onClick={() => setUploadMode('file')}
        >
          Upload Files
        </button>
        <button
          className={`px-4 py-2 rounded-lg transition-all ${
            uploadMode === 'folder' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-300 text-gray-800'
          }`}
          onClick={() => setUploadMode('folder')}
        >
          Upload Folder
        </button>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center
          ${isDragActive ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
        `}
      >
        <input {...getInputProps()} webkitdirectory={uploadMode === 'folder' ? 'true' : undefined} />
        <div className="flex flex-col items-center text-gray-600">
          {uploadMode === 'folder' ? (
            <FolderOpen className={`w-12 h-12 mb-4 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          ) : (
            <Upload className={`w-12 h-12 mb-4 transition-colors ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          )}
          <p className="text-lg font-medium">{isDragActive ? 'Drop your files/folder here' : `Drag & drop a ${uploadMode} here`}</p>
          <p className="text-sm text-gray-500 mt-2">or click to select a {uploadMode}</p>
        </div>
      </div>

      {/* Uploaded Files Preview */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-md border">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h3>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <FileCode className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 truncate" title={file.path}>
                  {file.path}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
