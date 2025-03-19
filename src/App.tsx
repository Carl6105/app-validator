import React, { useState, useCallback, useMemo, memo, Suspense } from "react";
import { FileUploader } from "./components/FileUploader";
import { ValidationResults } from "./components/ValidationResults";
import { CodePreview } from "./components/CodePreview";
import { Code2, Wand2, Play, Sun, Moon, Terminal } from "lucide-react";
import axios from "axios";
import type { FileWithContent, ValidationResult, StreamingState } from "./types";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">{this.state.error?.message || 'Please try refreshing the page'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_CONFIG = {
  url: "http://localhost:1234/v1/chat/completions",
  model: "deepseek-coder-7b-instruct",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer not-needed"
  }
};

const JUDGE0_CONFIG = {
  url: "https://judge0-ce.p.rapidapi.com/submissions",
  headers: {
    "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    "x-rapidapi-key": "f93374fe4fmsh608d5d902c40414p1d8441jsn39d1a5ee6e8e",
    "Content-Type": "application/json"
  }
};

const MemoizedFileUploader = memo(FileUploader);
const MemoizedValidationResults = memo(ValidationResults);
const MemoizedCodePreview = memo(CodePreview);

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isAnalyzing: false,
    currentFile: "",
    currentStep: ""
  });

  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codeToRun, setCodeToRun] = useState("");
  const [executionOutput, setExecutionOutput] = useState("");

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const fileContents = await Promise.all(
      selectedFiles.map(async (file) => ({
        name: file.name,
        path: (file as any).path || file.webkitRelativePath || file.name,
        content: await file.text(),
        extension: file.name.split(".").pop() || ""
      }))
    );

    setFiles(fileContents);
    setValidationResults([]);
  }, []);

  const validateCode = useCallback(async () => {
    if (files.length === 0) return;

    setStreamingState({ isAnalyzing: true, currentFile: "", currentStep: "Initializing..." });
    setValidationResults([]);

    try {
      await Promise.all(files.map(async (file) => {
        setStreamingState((prev) => ({ ...prev, currentFile: file.path, currentStep: "Analyzing code..." }));

        try {
          const response = await fetch(API_CONFIG.url, {
            method: "POST",
            headers: API_CONFIG.headers,
            body: JSON.stringify({
              model: API_CONFIG.model,
              messages: [
                {
                  role: "system",
                  content: "You are a code review assistant. Analyze the code for errors, improvements, and security vulnerabilities. Provide a score (0-100) in <SCORE:XX> format and suggest corrections in a code block."
                },
                { role: "user", content: `Analyze this ${file.extension} file:\n${file.content}` }
              ],
              temperature: 0.7,
              max_tokens: 2048
            })
          });

          if (!response.ok) throw new Error(`Server error: ${response.status}`);

          const data = await response.json();
          const aiResponse = data?.choices?.[0]?.message?.content || "No response received.";

          const scoreMatch = aiResponse.match(/<SCORE:(\d+)>/);
          const score = Math.min(Math.max(parseInt(scoreMatch?.[1] || "0"), 0), 100);

          const correctedCodeMatch = aiResponse.match(/```(?:\w+\n)?([\s\S]*?)```/);
          const correctedCode = correctedCodeMatch ? correctedCodeMatch[1].trim() : undefined;

          setValidationResults((prev) => [...prev, {
            fileName: file.name,
            path: file.path,
            code: file.content,
            result: aiResponse.replace(/```[\s\S]*?```/, "").trim(),
            score,
            correctedCode,
            hasCorrections: !!correctedCode
          }]);
        } catch (error) {
          setValidationResults((prev) => [...prev, {
            fileName: file.name,
            path: file.path,
            code: file.content,
            result: `Error: ${error instanceof Error ? error.message : "Failed to analyze code"}`,
            score: 0,
            hasCorrections: false
          }]);
        }
      }));
    } finally {
      setStreamingState({ isAnalyzing: false, currentFile: "", currentStep: "" });
    }
  }, [files]);

  const runCode = useCallback(async () => {
    if (!codeToRun.trim()) {
      setExecutionOutput("Error: No code to execute");
      return;
    }

    setExecutionOutput("Running...");

    try {
      const response = await axios.post(
        JUDGE0_CONFIG.url,
        { 
          source_code: codeToRun, 
          language_id: 71, 
          stdin: "",
          wait: true
        },
        { headers: JUDGE0_CONFIG.headers }
      );

      if (!response.data || !response.data.token) {
        throw new Error("Invalid response from execution service");
      }

      const token = response.data.token;
      let retries = 0;
      const maxRetries = 10;

      const checkResult = async () => {
        if (retries >= maxRetries) {
          setExecutionOutput("Execution timed out");
          return;
        }

        try {
          const resultResponse = await axios.get(
            `${JUDGE0_CONFIG.url}/${token}`,
            { headers: JUDGE0_CONFIG.headers }
          );

          const status = resultResponse.data.status;
          
          if (!status) {
            throw new Error("Invalid status response");
          }

          // Status ID 1-2 means still processing
          if (status.id <= 2 && retries < maxRetries) {
            retries++;
            setTimeout(checkResult, 1000);
          } else if (status.id === 3) { // Status ID 3 means completed successfully
            setExecutionOutput(resultResponse.data.stdout || "Code executed successfully");
          } else { // Any other status means error
            const errorMessage = resultResponse.data.stderr || status.description || "Execution failed";
            setExecutionOutput(`Error: ${errorMessage}`);
          }
        } catch (error) {
          setExecutionOutput(`Error checking execution status: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      };

      await checkResult();
    } catch (error) {
      setExecutionOutput(`Error running code: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [codeToRun]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] light:bg-gray-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-[#121212] light:bg-white border-b border-gray-800 light:border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 px-5 py-3 bg-[#1a1a1a] light:bg-gray-100 rounded-lg border border-blue-900 light:border-blue-200 glow-border-blue">
              <Code2 className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-200 light:text-gray-800 glow-text-blue">Code Amplifier</h1>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#1a1a1a] light:bg-gray-100 border border-gray-800 light:border-gray-300 hover:border-gray-700 light:hover:border-gray-400 transition-all duration-300"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-blue-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-800 light:border-gray-200">
          <div className="space-y-6 max-w-3xl mx-auto">
            <MemoizedFileUploader onFilesSelected={handleFilesSelected} selectedFiles={files.map((f) => ({ name: f.name, path: f.path }))} />

            {files.length > 0 && <MemoizedCodePreview files={files} />}

            {streamingState.isAnalyzing && (
              <div className="mt-4 p-4 bg-[#1a1a1a] border border-blue-900 rounded-lg shadow-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="text-blue-400 font-medium">Analyzing: {streamingState.currentFile}</p>
                    <p className="text-sm text-gray-400 mt-1">{streamingState.currentStep}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={validateCode}
                disabled={files.length === 0 || streamingState.isAnalyzing}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300
                  ${files.length === 0 || streamingState.isAnalyzing
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`}
              >
                <Wand2 className="w-5 h-5" />
                {streamingState.isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 p-6 overflow-y-auto bg-[#0a0a0a] light:bg-gray-50">
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-200 light:text-gray-800">Analysis Results</h2>
              <button
                onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] light:bg-gray-100 border border-gray-800 light:border-gray-200 hover:border-gray-700 light:hover:border-gray-300 transition-all duration-300"
              >
                <Terminal className="w-4 h-4" />
                Code Editor
              </button>
            </div>

            {isCodeEditorOpen && (
              <div className="bg-[#121212] light:bg-white rounded-xl p-6 border border-gray-800 light:border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-200 light:text-gray-800">Code Editor</h3>
                  <button
                    onClick={runCode}
                    disabled={!codeToRun.trim()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
                      ${!codeToRun.trim()
                        ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'}`}
                  >
                    <Play className="w-4 h-4" />
                    Run Code
                  </button>
                </div>

                <div className="space-y-4">
                  <textarea
                    value={codeToRun}
                    onChange={(e) => setCodeToRun(e.target.value)}
                    placeholder="Enter your code here..."
                    className="w-full h-48 p-4 bg-[#1a1a1a] light:bg-gray-100 rounded-lg border border-gray-800 light:border-gray-200 text-gray-300 light:text-gray-700 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />

                  {executionOutput && (
                    <div className="p-4 bg-[#1a1a1a] light:bg-gray-100 rounded-lg border border-gray-800 light:border-gray-200">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Output:</h4>
                      <pre className="text-sm text-gray-300 light:text-gray-700 font-mono whitespace-pre-wrap">
                        {executionOutput}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <MemoizedValidationResults
              results={validationResults}
              onSaveCorrection={(result) => {
                if (result.correctedCode) {
                  setCodeToRun(result.correctedCode);
                  setIsCodeEditorOpen(true);
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
          <AppContent />
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;