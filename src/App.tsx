import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { CodePreview } from './components/CodePreview';
import { ValidationResults } from './components/ValidationResults';
import { Code2, Loader2, Wand2 } from 'lucide-react';
import type { FileWithContent, ValidationResult, StreamingState } from './types';

const LM_STUDIO_API_URL = 'http://localhost:1234/v1/chat/completions';
const MODEL_NAME = 'deepseek-coder-7b'; // Update model name here if needed

function App() {
  const [files, setFiles] = useState<FileWithContent[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isAnalyzing: false,
    currentFile: '',
    currentStep: '',
  });
  const [userPrompt, setUserPrompt] = useState<string>(''); // New state for custom prompt

  // Handle file selection
  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    const fileContents: FileWithContent[] = await Promise.all(
      selectedFiles.map(async (file) => {
        const path = (file as any).path || file.webkitRelativePath || file.name;
        return {
          name: file.name,
          path,
          content: await file.text(),
          extension: file.name.split('.').pop() || '',
        };
      })
    );

    setFiles(fileContents);
    setValidationResults([]);
    setStreamingState({ isAnalyzing: false, currentFile: '', currentStep: '' });
  }, []);

  // Validate code with optional user prompt
  const validateCode = useCallback(async () => {
    if (files.length === 0) return;

    const results: ValidationResult[] = [];

    for (const file of files) {
      setStreamingState({
        isAnalyzing: true,
        currentFile: file.path,
        currentStep: 'Analyzing code...',
      });

      try {
        const response = await fetch(LM_STUDIO_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              {
                role: 'user',
                content: `Analyze the following code for syntax errors, logical flaws, and potential improvements.
                **Always include the score in this format: <SCORE:XX> where XX is a number from 0 to 100.**
                If you do not provide a score, the analysis will be considered invalid.
                
                Provide a structured response with:
                1. **Analysis Summary**
                2. **Identified Issues**
                3. **Recommended Fixes**
                4. **Corrected Code (if needed)**
                5. **Final Score: <SCORE:XX>**

                The code is written in ${file.extension}.
                ${userPrompt ? `Additionally, consider the following user prompt: ${userPrompt}` : ''}

                Code:
                ${file.content}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) throw new Error('Failed to validate code');

        const data = await response.json();
        let analysisResult = data.choices[0].message.content;

        // Remove <think> tags
        analysisResult = analysisResult.replace(/<\/?think>/g, '');

        // Extract score in the format <SCORE:XX>
        const scoreMatch = analysisResult.match(/<SCORE:(\d+)>/);
        let score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

        // Ensure score is within 0-100
        score = Math.min(Math.max(score, 0), 100);

        // Extract corrected code inside triple backticks
        const codeBlockRegex = /```(?:\w+\n)?([\s\S]*?)```/;
        const codeBlockMatch = analysisResult.match(codeBlockRegex);
        const correctedCode = codeBlockMatch ? codeBlockMatch[1].trim() : undefined;

        results.push({
          fileName: file.name,
          path: file.path,
          code: file.content,
          result: analysisResult.replace(codeBlockRegex, '').trim(),
          score,
          correctedCode,
          hasCorrections: !!correctedCode,
        });

        setValidationResults([...results]);
      } catch (error) {
        console.error(`Error validating ${file.path}:`, error);
        results.push({
          fileName: file.name,
          path: file.path,
          code: file.content,
          result: 'Error: Failed to analyze code',
          score: 0,
          hasCorrections: false,
        });
        setValidationResults([...results]);
      }
    }

    setStreamingState({ isAnalyzing: false, currentFile: '', currentStep: '' });
  }, [files, userPrompt]);

  // Save corrected code to a file
  const handleSaveCorrection = useCallback(async (result: ValidationResult) => {
    if (!result.correctedCode) return;

    const blob = new Blob([result.correctedCode], { type: 'text/plain' });
    const correctedFileName = result.path.replace(/\.[^/.]+$/, '_corrected$&');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = correctedFileName.split('/').pop() || 'corrected_code.txt';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-900 rounded-lg text-yellow-400 shadow-md border border-yellow-500">
            <Code2 className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Code Amplifier</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FileUploader 
              onFilesSelected={handleFilesSelected}
              selectedFiles={files.map(f => ({ name: f.name, path: f.path }))}
            />

            {/* Status Box for Current Analysis */}
            {streamingState.isAnalyzing && (
              <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg shadow">
                <p className="text-yellow-800 font-semibold">Processing: {streamingState.currentFile}</p>
                <p className="text-yellow-700">{streamingState.currentStep}</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </h2>
                <button
                  onClick={validateCode}
                  disabled={streamingState.isAnalyzing}
                  className="px-4 py-2 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                >
                  {streamingState.isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {streamingState.isAnalyzing ? 'Analyzing...' : 'Validate All Files'}
                </button>
              </div>
            )}
          </div>

          <div>
            <ValidationResults results={validationResults} onSaveCorrection={handleSaveCorrection} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
