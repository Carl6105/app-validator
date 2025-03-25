import React, { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Code2,
  ChevronDown,
  ChevronRight,
  Download,
  Copy,
  Shield,
  Zap,
  Lightbulb,
  FileCode,
  FileText,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { ValidationResult } from "../types";

interface ValidationResultsProps {
  results: ValidationResult[];
}

const getStyles = (score: number) => {
  const styles = [
    { threshold: 90, text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { threshold: 70, text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    { threshold: 0, text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  ];
  return styles.find((style) => score >= style.threshold) || styles[styles.length - 1];
};

const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "py":
      return "python";
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    default:
      return "plaintext";
  }
};

interface ResultCardProps {
  result: ValidationResult;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (code: string, fileName: string) => void;
  copiedFile: string | null;
}

const ResultCard = ({ result, isExpanded, onToggle, onCopy, copiedFile }: ResultCardProps) => {
  const { text, bg, border } = getStyles(result.score ?? 0);
  const [showOriginal, setShowOriginal] = useState(false);

  const parsedResult = useMemo(() => {
    const sections = { security: [], performance: [], suggestions: [] } as Record<string, string[]>;
    const lines = (result.result || "").toLowerCase().split("\n");

    lines.forEach((line, i) => {
      const trimmedLine = (result.result || "").split("\n")[i].replace(/^[\d.\s]*/, "").trim();
      if (line.includes("security") || line.includes("vulnerability")) {
        sections.security.push(trimmedLine);
      } else if (line.includes("performance") || line.includes("optimization")) {
        sections.performance.push(trimmedLine);
      } else if (line.includes("suggestion") || line.includes("improvement") || line.includes("recommend")) {
        sections.suggestions.push(trimmedLine);
      }
    });

    return sections;
  }, [result.result]);

  const { security, performance, suggestions } = parsedResult;
  const language = useMemo(() => getLanguageFromFileName(result.fileName), [result.fileName]);
  const hasOriginalCode = !!result.originalCode; // Check if originalCode exists

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border overflow-hidden shadow-xl transition-all duration-300 ${bg} ${border}`}
    >
      <div className="p-6 space-y-6">
        {/* File Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className={`w-6 h-6 ${text} animate-pulse`} />
            <h3 className="font-semibold text-lg text-gray-200 light:text-gray-800 truncate">{result.fileName}</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xl font-bold ${text}`}>{result.score ?? 0}/100</span>
            <button
              onClick={onToggle}
              className="p-2 rounded-full hover:bg-gray-700/30 light:hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronRight className="w-6 h-6 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="space-y-8"
          >
            {/* Analysis Sections */}
            {result.result && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {security.length > 0 && (
                  <div className="p-5 rounded-xl border bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 light:border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-red-400 animate-pulse" />
                      <h4 className="font-semibold text-xl text-gray-200 light:text-gray-800">Security Analysis</h4>
                    </div>
                    <div className="space-y-3 text-gray-300 light:text-gray-600 text-sm leading-relaxed">
                      {security.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {performance.length > 0 && (
                  <div className="p-5 rounded-xl border bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 light:border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                      <h4 className="font-semibold text-xl text-gray-200 light:text-gray-800">Performance Analysis</h4>
                    </div>
                    <div className="space-y-3 text-gray-300 light:text-gray-600 text-sm leading-relaxed">
                      {performance.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="p-5 rounded-xl border bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700 md:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-6 h-6 text-blue-400 animate-pulse" />
                      <h4 className="font-semibold text-xl text-gray-200 light:text-gray-800">Suggestions & Improvements</h4>
                    </div>
                    <div className="space-y-3 text-gray-300 light:text-gray-600 text-sm leading-relaxed">
                      {suggestions.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Corrected Code Section */}
            {result.correctedCode && (
              <div className="relative mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Code2 className="w-6 h-6 text-purple-400 animate-pulse" />
                    <h4 className="font-semibold text-xl text-gray-200 light:text-gray-800">Suggested Code Improvements</h4>
                  </div>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    disabled={!hasOriginalCode}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-gray-300 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasOriginalCode
                        ? "bg-gray-700/50 hover:bg-gray-600/50"
                        : "bg-gray-700/30 cursor-not-allowed opacity-50"
                    }`}
                    aria-label={showOriginal ? "Show corrected code" : "Show original code"}
                    title={hasOriginalCode ? "" : "Original code not available"}
                  >
                    <FileText className="w-4 h-4" />
                    {showOriginal ? "Show Corrected" : "Show Original"}
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-800 dark:border-gray-800 light:border-gray-200 shadow-xl">
                  {/* VS Code-like Header */}
                  <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm font-mono">{result.fileName}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onCopy(showOriginal && hasOriginalCode ? result.originalCode! : result.correctedCode!, result.fileName)}
                        className="p-1 rounded hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Copy code"
                        title={copiedFile === result.fileName ? "Copied!" : "Copy code"}
                      >
                        {copiedFile === result.fileName ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([showOriginal && hasOriginalCode ? result.originalCode! : result.correctedCode!], { type: "text/plain" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = result.fileName;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="p-1 rounded hover:bg-gray-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Download code"
                        title="Download code"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  {/* Code Editor */}
                  <Editor
                    height="300px"
                    defaultLanguage={language}
                    value={showOriginal && hasOriginalCode ? result.originalCode! : result.correctedCode!}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: "on",
                      glyphMargin: false,
                      folding: true,
                      lineDecorationsWidth: 10,
                      renderLineHighlight: "all",
                      wordWrap: "on",
                    }}
                    className="monaco-editor-container"
                    aria-label={`Code editor for ${showOriginal && hasOriginalCode ? "original" : "corrected"} code in ${result.fileName}`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export function ValidationResults({ results }: ValidationResultsProps) {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const toggleExpand = useCallback((fileName: string) => {
    setExpandedFiles((prev) => ({ ...prev, [fileName]: !prev[fileName] }));
  }, []);

  const handleCopyCode = useCallback(async (code: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
      setCopiedFile(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      {results.length === 0 ? (
        <div className="text-center text-gray-400 py-10 rounded-xl p-6 border bg-[#121212] dark:bg-[#121212] light:bg-white border-gray-800 dark:border-gray-800 light:border-gray-200 shadow-lg">
          <Code2 className="w-14 h-14 mx-auto mb-4 text-gray-500 animate-pulse" />
          <p className="text-xl font-semibold">No validation results available</p>
          <p className="text-sm text-gray-500 mt-2">Upload and validate your code to see the analysis</p>
        </div>
      ) : (
        <div className="space-y-8">
          <AnimatePresence>
            {results.map((result) => (
              <ResultCard
                key={result.fileName}
                result={result}
                isExpanded={expandedFiles[result.fileName] || false}
                onToggle={() => toggleExpand(result.fileName)}
                onCopy={handleCopyCode}
                copiedFile={copiedFile}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default ValidationResults;