import React from 'react';
import { CheckCircle, AlertCircle, Code2, Loader2, ChevronDown, ChevronRight, Download, Copy } from 'lucide-react';
import { ValidationResult } from '../types';
import { CodePreview } from './CodePreview';

interface ValidationResultsProps {
  results: ValidationResult[];
  streamingState?: {
    isAnalyzing: boolean;
    currentFile: string;
    currentStep: string;
  };
  onSaveCorrection: (result: ValidationResult) => void;
}

export function ValidationResults({ results, streamingState, onSaveCorrection }: ValidationResultsProps) {
  const [expandedFiles, setExpandedFiles] = React.useState<Set<string>>(new Set());

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50';
    if (score >= 70) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const toggleExpand = (fileName: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => alert('Code copied to clipboard!'))
      .catch(() => alert('Failed to copy code.'));
  };

  return (
    <div className="space-y-4">
      {streamingState?.isAnalyzing && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">
              Analyzing: {streamingState.currentFile}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{streamingState.currentStep}</p>
        </div>
      )}

      {results.map((result, index) => (
        <div
          key={index}
          className={`p-6 rounded-xl ${getBgColor(result.score)} border ${
            result.score >= 90 ? 'border-green-100' : result.score >= 70 ? 'border-yellow-100' : 'border-red-100'
          }`}
        >
          <div 
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleExpand(result.fileName)}
          >
            <div className="flex items-center gap-3">
              {expandedFiles.has(result.fileName) ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
              <Code2 className="w-6 h-6 text-gray-700" />
              <h3 className="text-xl font-semibold text-gray-900">{result.fileName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm">
                {result.score >= 90 ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                )}
                <span className={`text-lg font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </span>
              </div>
            </div>
          </div>

          {expandedFiles.has(result.fileName) && (
            <>
              <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                <h4 className="text-lg font-medium mb-4">Analysis Results</h4>
                <p className="whitespace-pre-wrap text-gray-700 font-mono">{result.result}</p>
              </div>

              {result.correctedCode && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">Corrected Code</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(result.correctedCode!)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </button>
                      <button
                        onClick={() => onSaveCorrection(result)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Save Corrected Code
                      </button>
                    </div>
                  </div>
                  <CodePreview
                    code={result.correctedCode}
                    language={result.fileName.split('.').pop() || 'text'}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}