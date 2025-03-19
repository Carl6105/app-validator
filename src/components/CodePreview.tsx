import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileWithContent } from '../types';
import { FileCode, Clipboard, Download, WrapText, Folder } from 'lucide-react';

interface CodePreviewProps {
  files: FileWithContent[];
}

export function CodePreview({ files }: CodePreviewProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [lineWrap, setLineWrap] = useState(true);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Group files by folders using useMemo
  const filesByFolder = useMemo(() => {
    const grouped: Record<string, FileWithContent[]> = {};
    files.forEach((file) => {
      const folderName = file.path.split('/').slice(0, -1).join('/') || 'Root';
      if (!grouped[folderName]) {
        grouped[folderName] = [];
      }
      grouped[folderName].push(file);
    });
    return grouped;
  }, [files]);

  // Set default folder and file on mount
  useEffect(() => {
    const firstFolder = Object.keys(filesByFolder)[0] || null;
    setSelectedFolder(firstFolder);
    if (firstFolder) {
      setSelectedFile(filesByFolder[firstFolder][0]);
    }
  }, [filesByFolder]);

  // Scroll to top when switching files
  useEffect(() => {
    if (codeContainerRef.current) {
      codeContainerRef.current.scrollTop = 0;
    }
  }, [selectedFile]);

  // Copy to clipboard function
  const copyToClipboard = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [selectedFile]);

  // Download file function
  const downloadFile = useCallback(() => {
    if (selectedFile) {
      const blob = new Blob([selectedFile.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [selectedFile]);

  // Handle folder selection
  const handleFolderSelect = useCallback((folder: string) => {
    setSelectedFolder(folder);
    setSelectedFile(filesByFolder[folder][0]);
  }, [filesByFolder]);

  // Handle file selection
  const handleFileSelect = useCallback((file: FileWithContent) => {
    setSelectedFile(file);
  }, []);

  // Toggle line wrap
  const toggleLineWrap = useCallback(() => {
    setLineWrap(prev => !prev);
  }, []);

  return (
    <div className="space-y-4 bg-[#121212] dark:bg-[#121212] light:bg-white rounded-xl p-4 border border-gray-800 dark:border-gray-800 light:border-gray-200 hover:border-gray-700 dark:hover:border-gray-700 light:hover:border-gray-300 transition-all duration-300">
      
      {/* Folder Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-dark">
        {Object.keys(filesByFolder).map((folder) => (
          <button
            key={folder}
            onClick={() => handleFolderSelect(folder)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              selectedFolder === folder
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 border border-gray-800 dark:border-gray-800 light:border-gray-200 hover:border-gray-700 dark:hover:border-gray-700 light:hover:border-gray-300 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-gray-800'
            }`}
          >
            <Folder className="w-4 h-4 inline-block mr-1.5" />
            {folder}
          </button>
        ))}
      </div>

      {/* File Tabs within the Selected Folder */}
      {selectedFolder && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-dark">
          {filesByFolder[selectedFolder].map((file) => (
            <button
              key={file.path}
              onClick={() => handleFileSelect(file)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                selectedFile?.path === file.path
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 border border-gray-800 dark:border-gray-800 light:border-gray-200 hover:border-gray-700 dark:hover:border-gray-700 light:hover:border-gray-300 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-gray-800'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}

      {/* File Name Header */}
      {selectedFile && (
        <div className="flex items-center justify-between p-2.5 bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 rounded-lg border border-gray-800 dark:border-gray-800 light:border-gray-200">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-medium text-gray-100 dark:text-gray-100 light:text-gray-800">{selectedFile.name}</h3>
            <span className="text-gray-400 dark:text-gray-400 light:text-gray-500 text-xs">
              ({(new Blob([selectedFile.content]).size / 1024).toFixed(2)} KB)
            </span>
          </div>
          <div className="flex gap-1.5">
            {/* Copy Button */}
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/30 light:bg-blue-100 light:text-blue-600 light:border-blue-200 light:hover:bg-blue-200"
            >
              {copied ? 'Copied!' : 'Copy'}
              <Clipboard className="w-3.5 h-3.5" />
            </button>

            {/* Download Button */}
            <button
              onClick={downloadFile}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/30 light:bg-green-100 light:text-green-600 light:border-green-200 light:hover:bg-green-200"
            >
              Download
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Line Wrap Toggle */}
            <button
              onClick={toggleLineWrap}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${lineWrap ? 'bg-gray-500/20 light:bg-gray-200 text-gray-400 light:text-gray-600' : 'bg-red-500/20 light:bg-red-100 text-red-400 light:text-red-600'} border border-gray-500/30 light:border-gray-300 hover:bg-gray-500/30 light:hover:bg-gray-300 transition-all`}
            >
              {lineWrap ? 'Wrap On' : 'Wrap Off'}
              <WrapText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Code Display */}
      {selectedFile && (
        <div
          ref={codeContainerRef}
          className="rounded-lg overflow-hidden shadow-lg max-h-[500px] overflow-y-auto bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 border border-gray-800 dark:border-gray-800 light:border-gray-200 scrollbar-dark"
        >
          <SyntaxHighlighter
            language={selectedFile.extension || 'text'}
            style={vscDarkPlus}
            showLineNumbers
            wrapLines={lineWrap}
            wrapLongLines={lineWrap}
            customStyle={{
              margin: 0,
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: document.documentElement.classList.contains('light') ? '#f3f4f6' : '#1a1a1a',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: document.documentElement.classList.contains('light') ? '#1f2937' : '#e5e7eb'
            }}
          >
            {selectedFile.content}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}