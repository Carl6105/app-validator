import React, { useState, useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { FileUploader } from './FileUploader';
import { FileWithContent } from '../types';
import { FileCode, Terminal as TerminalIcon, FolderOpen, ChevronDown, ChevronRight, Play, Settings, Search, Git, Debug, Extension, Split, X, Minimize2, Maximize2, Circle } from 'lucide-react';

interface CodeEditorProps {
  onFilesSelected?: (files: File[]) => void;
}

export function CodeEditor({ onFilesSelected }: CodeEditorProps) {
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileWithContent | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  const [isSplitView, setIsSplitView] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const editorRef = useRef<any>(null);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const fileContents = await Promise.all(
      selectedFiles.map(async (file) => ({
        name: file.name,
        path: (file as any).path || file.webkitRelativePath || file.name,
        content: await file.text(),
        extension: file.name.split('.').pop() || ''
      }))
    );

    setFiles(fileContents);
    if (onFilesSelected) {
      onFilesSelected(selectedFiles);
    }
  }, [onFilesSelected]);

  const toggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const filesByFolder = files.reduce((acc, file) => {
    const folderPath = file.path.split('/').slice(0, -1).join('/') || 'Root';
    if (!acc[folderPath]) {
      acc[folderPath] = [];
    }
    acc[folderPath].push(file);
    return acc;
  }, {} as Record<string, FileWithContent[]>);

  const handleRunCode = useCallback(async () => {
    if (!selectedFile) return;
    setTerminalOutput(`Running ${selectedFile.name}...\n> Executing code...`);

    try {
      const response = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions",
        { 
          source_code: selectedFile.content,
          language_id: 71, // Python
          stdin: "",
          wait: true
        },
        {
          headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": "f93374fe4fmsh608d5d902c40414p1d8441jsn39d1a5ee6e8e",
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from execution service");
      }

      const token = response.data.token;
      const resultResponse = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key": "f93374fe4fmsh608d5d902c40414p1d8441jsn39d1a5ee6e8e"
          }
        }
      );

      const { stdout, stderr, compile_output, status } = resultResponse.data;
      let output = "";

      if (status.id === 3) { // Accepted
        output = stdout || "Program executed successfully with no output";
      } else if (compile_output) {
        output = `Compilation Error:\n${compile_output}`;
      } else if (stderr) {
        output = `Runtime Error:\n${stderr}`;
      } else {
        output = `Execution Error: ${status.description}`;
      }

      setTerminalOutput(`Running ${selectedFile.name}...\n> ${output}`);
    } catch (error) {
      setTerminalOutput(`Error: ${error.message || "Failed to execute code"}`);
    }
  }, [selectedFile]);

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] dark:bg-[#1e1e1e] light:bg-gray-100">
      {/* Top Navigation Bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-[#252526] dark:bg-[#252526] light:bg-gray-200 border-b border-[#3c3c3c]">
        <div className="flex items-center gap-4">
          <FileUploader onFilesSelected={handleFilesSelected} />
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 text-gray-300 hover:text-white rounded-md hover:bg-[#2d2d2d]">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              <span>Files</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute left-0 top-full mt-1 w-64 bg-[#252526] rounded-md shadow-lg border border-[#3c3c3c] hidden group-hover:block z-10">
              {Object.entries(filesByFolder).map(([folder, folderFiles]) => (
                <div key={folder} className="py-1">
                  <div className="px-3 py-1.5 text-sm text-gray-400">{folder}</div>
                  {folderFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`flex items-center w-full px-3 py-1.5 text-sm ${selectedFile?.path === file.path ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-[#2d2d2d]'}`}
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      {file.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCode}
            className="flex items-center px-3 py-1.5 text-sm text-green-400 hover:bg-[#2d2d2d] rounded-md"
            disabled={!selectedFile}
          >
            <Play className="w-4 h-4 mr-2" />
            Run
          </button>
          <button
            onClick={() => setIsMinimapVisible(!isMinimapVisible)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded-md"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor and Terminal */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e] dark:bg-[#1e1e1e] light:bg-gray-100 px-4">
        {selectedFile ? (
          <>
            <div className="flex-1 overflow-hidden rounded-lg shadow-lg mt-4">
              <div className="h-10 flex items-center justify-between bg-[#252526] dark:bg-[#252526] light:bg-gray-200 border-b border-[#3c3c3c] px-4 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1.5">
                    <Circle className="w-3 h-3 text-red-500" />
                    <Circle className="w-3 h-3 text-yellow-500" />
                    <Circle className="w-3 h-3 text-green-500" />
                  </div>
                  <div className="flex items-center px-3 py-1 ml-4">
                    <FileCode className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-gray-200">{selectedFile.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunCode}
                    className="flex items-center px-3 py-1.5 text-sm text-green-400 hover:bg-[#2d2d2d] rounded-md transition-colors duration-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </button>
                </div>
              </div>
              <div className="flex h-full">
                <CodeMirror
                  ref={editorRef}
                  value={selectedFile.content}
                  height="calc(100% - 2.25rem)"
                  theme="dark"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLineGutter: true,
                    highlightActiveLine: true,
                    foldGutter: true,
                    bracketMatching: true,
                    autocompletion: true,
                    indentOnInput: true,
                    closeBrackets: true,
                    scrollPastEnd: true,
                    allowMultipleSelections: true,
                    indentationMarkers: true
                  }}
                  onChange={(value, viewUpdate) => {
                    const pos = viewUpdate.state.selection.main.head;
                    const line = viewUpdate.state.doc.lineAt(pos);
                    setCursorPosition({
                      line: line.number,
                      col: pos - line.from + 1
                    });
                  }}
                  className="flex-1"
                />
                {isMinimapVisible && (
                  <div className="w-[60px] border-l border-[#3c3c3c] overflow-hidden opacity-50 hover:opacity-100 transition-opacity">
                    <CodeMirror
                      value={selectedFile.content}
                      height="calc(100% - 2.25rem)"
                      theme="dark"
                      editable={false}
                      basicSetup={{
                        lineNumbers: false,
                        foldGutter: false,
                        dropCursor: false,
                        allowMultipleSelections: false,
                        indentOnInput: false
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={`mt-4 rounded-lg overflow-hidden shadow-lg ${isTerminalMaximized ? 'h-[calc(100%-2.25rem)]' : 'h-48'} border border-[#3c3c3c] transition-all duration-300`}>
              <div className="h-10 px-4 flex items-center justify-between bg-[#252526] dark:bg-[#252526] light:bg-gray-200 border-b border-[#3c3c3c]">
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1.5">
                    <Circle className="w-2.5 h-2.5 text-gray-500" />
                    <Circle className="w-2.5 h-2.5 text-gray-500" />
                    <Circle className="w-2.5 h-2.5 text-gray-500" />
                  </div>
                  <div className="flex items-center ml-4">
                    <TerminalIcon className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-gray-200">TERMINAL</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsTerminalMaximized(!isTerminalMaximized)} 
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded-md transition-colors duration-200">
                    {isTerminalMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    {isTerminalMaximized ? <Minimize2 className="w-4 h-4 text-gray-400" /> : <Maximize2 className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button className="p-1 hover:bg-[#3c3c3c] rounded">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-4 h-[calc(100%-2.25rem)] overflow-y-auto font-mono text-sm text-gray-300 bg-[#1e1e1e]">
                {terminalOutput || '> Terminal ready'}
              </div>
            </div>
            {/* Status Bar */}
            <div className="h-6 px-4 flex items-center justify-between bg-[#007acc] text-white text-xs">
              <div className="flex items-center gap-4">
                <span>UTF-8</span>
                <span>{selectedFile.extension.toUpperCase()}</span>
                <Circle className="w-2 h-2 text-green-400" />
                <span>Git: main</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setIsMinimapVisible(!isMinimapVisible)} className="hover:bg-[#3c3c3c] px-2 py-0.5 rounded">
                  {isMinimapVisible ? 'Hide Minimap' : 'Show Minimap'}
                </button>
                <button onClick={() => setIsSplitView(!isSplitView)} className="hover:bg-[#3c3c3c] px-2 py-0.5 rounded">
                  <Split className="w-4 h-4 inline-block mr-1" />
                  {isSplitView ? 'Merge Editor' : 'Split Editor'}
                </button>
                <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
                <span>Spaces: 2</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Select a file to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}