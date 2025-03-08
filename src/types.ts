export interface ValidationResult {
  fileName: string;
  path: string;
  code: string;
  result: string;
  score: number;
  correctedCode?: string;
  hasCorrections: boolean;
}

export interface FileWithContent {
  name: string;
  path: string;
  content: string;
  extension: string;
}

export interface StreamingState {
  isAnalyzing: boolean;
  currentFile: string;
  currentStep: string;
}