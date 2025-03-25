import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileWithContent } from "../types";
import { FileCode, Clipboard, Download, WrapText, Folder, Trash2 } from "lucide-react";

interface CodePreviewProps {
  files: FileWithContent[];
  onDeleteFile: (fileName: string) => void;
}

const getButtonStyles = (baseColor: string, hoverColor: string) =>
  `flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-${baseColor}-500/20 text-${baseColor}-400 border border-${baseColor}-500/30 hover:bg-${baseColor}-500/30 transition-all dark:bg-${baseColor}-500/20 dark:text-${baseColor}-400 dark:border-${baseColor}-500/30 dark:hover:bg-${baseColor}-500/30 light:bg-${baseColor}-100 light:text-${baseColor}-600 light:border-${baseColor}-200 light:hover:bg-${baseColor}-200`;

export function CodePreview({ files, onDeleteFile }: CodePreviewProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileWithContent | null>(null);
  const [copied, setCopied] = useState(false);
  const [lineWrap, setLineWrap] = useState(true);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Group files by folders
  const filesByFolder = useMemo(() => {
    const grouped: Record<string, FileWithContent[]> = {};
    files.forEach((file) => {
      const folderName = file.path.split("/").slice(0, -1).join("/") || "Root";
      grouped[folderName] = grouped[folderName] || [];
      grouped[folderName].push(file);
    });
    return grouped;
  }, [files]);

  // Synchronize selectedFolder and selectedFile when files change
  useEffect(() => {
    if (files.length === 0) {
      setSelectedFolder(null);
      setSelectedFile(null);
      return;
    }

    const folderNames = Object.keys(filesByFolder);
    const newSelectedFolder = folderNames.includes(selectedFolder ?? "")
      ? selectedFolder
      : folderNames[0] || null;

    setSelectedFolder(newSelectedFolder);

    if (newSelectedFolder) {
      const folderFiles = filesByFolder[newSelectedFolder];
      const fileStillExists = selectedFile && folderFiles.some((file) => file.path === selectedFile.path);
      setSelectedFile(fileStillExists ? selectedFile : folderFiles[0] || null);
    } else {
      setSelectedFile(null);
    }
  }, [filesByFolder, selectedFolder, selectedFile]);

  // Scroll to top when switching files
  useEffect(() => {
    codeContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedFile]);

  // Memoize file size
  const fileSize = useMemo(
    () => (selectedFile ? (new Blob([selectedFile.content]).size / 1024).toFixed(2) : "0"),
    [selectedFile]
  );

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selectedFile]);

  // Download file
  const downloadFile = useCallback(() => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedFile]);

  // Handle folder selection
  const handleFolderSelect = useCallback(
    (folder: string) => {
      setSelectedFolder(folder);
      setSelectedFile(filesByFolder[folder][0]);
    },
    [filesByFolder]
  );

  // Handle file selection
  const handleFileSelect = useCallback((file: FileWithContent) => {
    setSelectedFile(file);
  }, []);

  // Handle file deletion
  const handleDelete = useCallback(
    (file: FileWithContent) => {
      onDeleteFile(file.name);
    },
    [onDeleteFile]
  );

  // Toggle line wrap
  const toggleLineWrap = useCallback(() => {
    setLineWrap((prev) => !prev);
  }, []);

  if (files.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 light:text-gray-500 text-center p-4">
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl p-4 border transition-all duration-300 bg-[#121212] dark:bg-[#121212] light:bg-white border-gray-800 dark:border-gray-800 light:border-gray-200 hover:border-gray-700 dark:hover:border-gray-700 light:hover:border-gray-300">
      {/* Folder Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-dark">
        {Object.keys(filesByFolder).map((folder) => (
          <button
            key={folder}
            onClick={() => handleFolderSelect(folder)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              selectedFolder === folder
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 border border-gray-800 dark:border-gray-800 light:border-gray-200 hover:border-gray-700 dark:hover:border-gray-700 light:hover:border-gray-300 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-gray-800"
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
            <div key={file.path} className="flex items-center gap-1">
              <button
                onClick={() => handleFileSelect(file)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedFile?.path === file.path
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-600 border border-gray-800 dark:border-gray-800 light:border-gray-200 hover:border-gray-700 dark:hover:border-gray-700 light:hover:border-gray-300 hover:text-gray-200 dark:hover:text-gray-200 light:hover:text-gray-800"
                }`}
              >
                {file.name}
              </button>
              <button
                onClick={() => handleDelete(file)}
                className="p-1 text-red-400 hover:text-red-500 transition-all duration-300"
                aria-label={`Delete ${file.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Name Header */}
      {selectedFile && (
        <div className="flex items-center justify-between p-2.5 rounded-lg border bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 border-gray-800 dark:border-gray-800 light:border-gray-200">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-medium text-gray-100 dark:text-gray-100 light:text-gray-800">
              {selectedFile.name}
            </h3>
            <span className="text-gray-400 dark:text-gray-400 light:text-gray-500 text-xs">
              ({fileSize} KB)
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={copyToClipboard}
              className={getButtonStyles("blue", "blue")}
              aria-label="Copy code to clipboard"
            >
              {copied ? "Copied!" : "Copy"}
              <Clipboard className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={downloadFile}
              className={getButtonStyles("green", "green")}
              aria-label="Download file"
            >
              Download
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleLineWrap}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-all ${
                lineWrap
                  ? "bg-gray-500/20 light:bg-gray-200 text-gray-400 light:text-gray-600 border-gray-500/30 light:border-gray-300 hover:bg-gray-500/30 light:hover:bg-gray-300"
                  : "bg-red-500/20 light:bg-red-100 text-red-400 light:text-red-600 border-red-500/30 light:border-red-200 hover:bg-red-500/30 light:hover:bg-red-200"
              }`}
              aria-label={lineWrap ? "Turn off line wrap" : "Turn on line wrap"}
            >
              {lineWrap ? "Wrap On" : "Wrap Off"}
              <WrapText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Code Display */}
      {selectedFile && (
        <div
          ref={codeContainerRef}
          className="rounded-lg overflow-hidden shadow-lg max-h-[500px] overflow-y-auto border scrollbar-dark bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-gray-100 border-gray-800 dark:border-gray-800 light:border-gray-200"
        >
          <SyntaxHighlighter
            language={selectedFile.extension || "text"}
            style={vscDarkPlus}
            showLineNumbers
            wrapLines={lineWrap}
            wrapLongLines={lineWrap}
            customStyle={{
              margin: 0,
              padding: "1rem",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              lineHeight: "1.5",
              background: "transparent", // Rely on parent container for background
            }}
          >
            {selectedFile.content}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}