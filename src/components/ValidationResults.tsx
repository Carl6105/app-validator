import React, { useState, useCallback, memo } from "react";
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
  FileCode
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ValidationResult } from "../types";

interface ValidationResultsProps {
  results: ValidationResult[];
  onSaveCorrection: (result: ValidationResult) => void;
}

const getStyles = (score: number) => {
  if (score >= 90) return { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" };
  if (score >= 70) return { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" };
  return { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" };
};

const ResultCard = memo(({ result, isExpanded, onToggle, onCopy, copiedFile }: {
  result: ValidationResult;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (code: string, fileName: string) => void;
  copiedFile: string | null;
}) => {
  const { text, bg, border } = getStyles(result.score ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${bg} rounded-lg border ${border} overflow-hidden shadow-lg transition-all duration-300`}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className={`w-5 h-5 ${text}`} />
            <h3 className="font-medium text-gray-200 light:text-gray-800 truncate">{result.fileName}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-semibold ${text}`}>{result.score}/100</span>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-700/30 light:hover:bg-gray-200 rounded transition-colors duration-200"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="space-y-6"
          >
            {/* Analysis Sections */}
            {result.result && (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Security Analysis */}
                <div className="p-4 bg-gray-800/30 light:bg-gray-100 rounded-lg border border-gray-700 light:border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-red-400" />
                    <h4 className="font-medium text-gray-200 light:text-gray-800">Security Analysis</h4>
                  </div>
                  <div className="space-y-2 text-gray-300 light:text-gray-600 text-sm">
                    {result.result.split('\n')
                      .filter(line => line.toLowerCase().includes('security') || line.toLowerCase().includes('vulnerability'))
                      .filter(line => !line.includes('**Security Analysis**:'))
                      .map((line, i) => (
                        <p key={i} className="leading-relaxed">{line.replace(/^[\d.\s]*/, '').trim()}</p>
                      ))}
                  </div>
                </div>

                {/* Performance Analysis */}
                <div className="p-4 bg-gray-800/30 light:bg-gray-100 rounded-lg border border-gray-700 light:border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <h4 className="font-medium text-gray-200 light:text-gray-800">Performance Analysis</h4>
                  </div>
                  <div className="space-y-2 text-gray-300 light:text-gray-600 text-sm">
                    {result.result.split('\n')
                      .filter(line => line.toLowerCase().includes('performance') || line.toLowerCase().includes('optimization'))
                      .filter(line => !line.includes('Performance Analysis'))
                      .map((line, i) => (
                        <p key={i} className="leading-relaxed">{line.replace(/^[\d.\s]*/, '').trim()}</p>
                      ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                    <h4 className="font-medium text-gray-200 light:text-gray-800">Suggestions & Improvements</h4>
                  </div>
                  <div className="space-y-2 text-gray-300 light:text-gray-600 text-sm">
                    {result.result.split('\n')
                      .filter(line => 
                        line.toLowerCase().includes('suggestion') || 
                        line.toLowerCase().includes('improvement') || 
                        line.toLowerCase().includes('recommend'))
                      .filter(line => !line.includes('**Improvements**:'))
                      .map((line, i) => (
                        <p key={i} className="leading-relaxed">{line.replace(/^[\d.\s]*/, '').trim()}</p>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Corrected Code Section */}
            {result.correctedCode && (
              <div className="relative mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-purple-400" />
                    <h4 className="font-medium text-gray-200 light:text-gray-800">Suggested Code Improvements</h4>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onCopy(result.correctedCode!, result.fileName)}
                      className="p-1.5 rounded bg-gray-800/50 light:bg-gray-200 hover:bg-gray-700/50 light:hover:bg-gray-300 transition-colors duration-200"
                      aria-label="Copy code"
                    >
                      {copiedFile === result.fileName ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([result.correctedCode!], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = result.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1.5 rounded bg-gray-800/50 light:bg-gray-200 hover:bg-gray-700/50 light:hover:bg-gray-300 transition-colors duration-200"
                      aria-label="Download code"
                    >
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <SyntaxHighlighter
                  language="typescript"
                  style={vscDarkPlus}
                  className="rounded-lg !bg-gray-900/50 light:!bg-gray-100 !mt-0"
                >
                  {result.correctedCode}
                </SyntaxHighlighter>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

export function ValidationResults({ results, onSaveCorrection }: ValidationResultsProps) {
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
    <div className="space-y-4">
      {results.length === 0 ? (
        <div className="text-center text-gray-400 py-8 bg-[#121212] dark:bg-[#121212] light:bg-white rounded-xl p-6 border border-gray-800 dark:border-gray-800 light:border-gray-200">
          <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-lg">No validation results available</p>
          <p className="text-sm text-gray-500">Upload and validate your code to see the analysis</p>
        </div>
      ) : (
        <div className="space-y-6">
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
        </div>
      )}
    </div>
  );
}

export default ValidationResults;