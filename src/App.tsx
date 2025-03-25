import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, Link } from "react-router-dom";
import { FileUploader } from "./components/FileUploader";
import { ValidationResults } from "./components/ValidationResults";
import { CodePreview } from "./components/CodePreview";
import { FileHistory } from "./components/FileHistory";
import { Login } from "./components/auth/Login";
import { Register } from "./components/auth/Register";
import { Code2, Wand2, Sun, Moon, Loader2, User } from "lucide-react";
import type { FileWithContent, ValidationResult, StreamingState } from "./types";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">
            {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_CONFIG = {
  url: "http://localhost:1234/v1/chat/completions",
  model: "qwen2.5-coder-3b-instruct",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer not-needed",
  },
};

const BACKEND_API = {
  url: "http://localhost:5000/api/history",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
};

function LoadingScreen() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate("/app");
      } else {
        navigate("/login");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      <p className="mt-4 text-lg text-gray-900 dark:text-gray-100">Loading Code Amplifier...</p>
    </div>
  );
}

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isAnalyzing: false,
    currentFile: "",
    currentStep: "",
  });
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const fileContents = await Promise.all(
      selectedFiles.map(async (file) => {
        const relativePath = file.webkitRelativePath || file.name;
        console.log(`Processing file: ${file.name}, Path: ${relativePath}`);
        return {
          name: file.name,
          path: relativePath,
          content: await file.text(),
          extension: file.name.split(".").pop() || "",
        };
      })
    );

    setFiles((prevFiles) => [...prevFiles, ...fileContents]);
    setValidationResults([]);
  }, []);

  const handleDeleteFile = useCallback((fileName: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
    setValidationResults((prevResults) => prevResults.filter((result) => result.fileName !== fileName));
  }, []);

  const validateCode = useCallback(async () => {
    if (!files.length || !user?.id) return;

    setStreamingState({ isAnalyzing: true, currentFile: "", currentStep: "Initializing..." });
    const newResults: ValidationResult[] = [];

    let systemPrompt =
      "You are a code review assistant. Analyze the code for errors, improvements, and security vulnerabilities. Provide a score (0-100) in <SCORE:XX> format and suggest corrections in a code block.";
    
    if (customPrompt.trim()) {
      systemPrompt += `\nAdditional instructions: ${customPrompt.trim()}`;
    }

    for (const file of files) {
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
                content: systemPrompt,
              },
              { role: "user", content: `Analyze this ${file.extension} file:\n${file.content}` },
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = (await response.json()) as { choices?: { message: { content: string } }[] };
        const aiResponse = data?.choices?.[0]?.message?.content || "No response received.";

        const scoreMatch = aiResponse.match(/<SCORE:(\d+)>/);
        const score = Math.min(Math.max(parseInt(scoreMatch?.[1] || "0", 10), 0), 100);

        const correctedCodeMatch = aiResponse.match(/```(?:\w+\n)?([\s\S]*?)```/);
        const correctedCode = correctedCodeMatch ? correctedCodeMatch[1].trim() : undefined;

        const result: ValidationResult = {
          fileName: file.name,
          path: file.path,
          code: file.content,
          result: aiResponse.replace(/```[\s\S]*?```/, "").trim(),
          score,
          correctedCode,
          hasCorrections: !!correctedCode,
          originalCode: file.content,
        };

        newResults.push(result);

        const newItem = {
          userId: user.id,
          fileName: result.fileName,
          path: result.path,
          timestamp: new Date().toISOString(),
          score: result.score,
        };

        try {
          const historyResponse = await fetch(BACKEND_API.url, {
            method: "POST",
            headers: BACKEND_API.headers,
            body: JSON.stringify(newItem),
          });

          if (!historyResponse.ok) {
            throw new Error(`Failed to save history: ${historyResponse.status}`);
          }
          console.log("History saved to backend:", newItem);
        } catch (error) {
          console.error("Error saving history to backend:", error);
        }
      } catch (error) {
        const result: ValidationResult = {
          fileName: file.name,
          path: file.path,
          code: file.content,
          result: `Error: ${error instanceof Error ? error.message : "Failed to analyze code"}`,
          score: 0,
          hasCorrections: false,
          originalCode: file.content,
        };
        newResults.push(result);

        const newItem = {
          userId: user.id,
          fileName: result.fileName,
          path: result.path,
          timestamp: new Date().toISOString(),
          score: result.score,
        };

        try {
          const historyResponse = await fetch(BACKEND_API.url, {
            method: "POST",
            headers: BACKEND_API.headers,
            body: JSON.stringify(newItem),
          });

          if (!historyResponse.ok) {
            throw new Error(`Failed to save history: ${historyResponse.status}`);
          }
          console.log("Error history saved to backend:", newItem);
        } catch (error) {
          console.error("Error saving history to backend:", error);
        }
      }
    }

    setValidationResults(newResults);
    setStreamingState({ isAnalyzing: false, currentFile: "", currentStep: "" });
  }, [files, customPrompt, user]);

  return (
    <div className={`min-h-screen ${theme === "dark" ? "dark bg-[#0a0a0a]" : "bg-white"}`}>
      {/* Stylish Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 z-40">
        <div className="h-full flex items-center justify-between px-4 relative">
          {/* User Icon and Dropdown (Left) */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                aria-label="User menu"
              >
                <User className="h-6 w-6 text-blue-500" />
              </button>
              {isUserMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-2">
                  <div className="px-4 py-2 text-gray-100 font-medium border-b border-gray-700">
                    {user?.username || "User"}
                  </div>
                  <Link
                    to="/history"
                    className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    File History
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Centered Code Amplifier Text */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <Code2 className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">
              Code Amplifier
            </h1>
          </div>

          {/* Theme Toggle and Logout (Right) */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-gray-100" />
              ) : (
                <Moon className="h-5 w-5 text-gray-900" />
              )}
            </button>
            <button
              onClick={logout}
              className="px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto p-4 pt-20 flex space-x-8">
        <div className="w-1/2">
          <FileUploader onFilesSelected={handleFilesSelected} />
          <div className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="custom-prompt"
                className="block text-sm font-medium text-gray-200 dark:text-gray-200 light:text-gray-800 mb-1"
              >
                Custom Prompt (Optional)
              </label>
              <textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter any additional instructions for the code analysis (e.g., 'Focus on performance optimizations')"
                className="w-full p-3 rounded-lg border bg-[#1a1a1a] light:bg-gray-100 border-gray-800 light:border-gray-200 text-gray-300 light:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <button
              onClick={validateCode}
              disabled={files.length === 0 || streamingState.isAnalyzing}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                files.length === 0 || streamingState.isAnalyzing
                  ? "bg-gray-800/50 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
              }`}
            >
              <Wand2 className="w-5 h-5" />
              {streamingState.isAnalyzing ? "Analyzing..." : "Validate Code"}
            </button>
          </div>
          <div className="mt-8">
            <CodePreview files={files} onDeleteFile={handleDeleteFile} />
          </div>
        </div>

        <div className="w-px bg-gray-200 dark:bg-gray-700" />

        <div className="w-1/2">
          <ValidationResults results={validationResults} />
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/loading" element={<LoadingScreen />} />
      <Route
        path="/"
        element={<Navigate to="/loading" />}
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <FileHistory />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const AppWrapper = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default AppWrapper;