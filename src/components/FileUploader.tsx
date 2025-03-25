import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileCode, FolderOpen, GripVertical, Trash2, HelpCircle, AlertTriangle } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
}

interface UploadedFile {
  file: File;
  path: string;
  size: number;
}

interface SortableFileItemProps {
  file: UploadedFile;
  index: number;
  onRemove: (index: number) => void;
}

const SortableFileItem = ({ file, index, onRemove }: SortableFileItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.path });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-lg border transition-all duration-300 bg-[#1a1a1a] light:bg-gray-100 border-gray-800 light:border-gray-200 group hover:border-gray-700 light:hover:border-gray-300"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="p-1 rounded hover:bg-gray-700 light:hover:bg-gray-200 transition-colors duration-200 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <FileCode className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <span className="truncate text-sm text-gray-300 light:text-gray-600">{file.path}</span>
        <span className="text-xs text-gray-500 flex-shrink-0">
          ({(file.size / 1024).toFixed(1)} KB)
        </span>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="p-1 rounded hover:bg-red-500/20 transition-colors duration-200 opacity-0 group-hover:opacity-100"
        aria-label={`Remove ${file.path}`}
      >
        <Trash2 className="w-4 h-4 text-red-400" />
      </button>
    </div>
  );
};

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "folder">("file");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isFolderUploadSupported, setIsFolderUploadSupported] = useState(true);

  // Check if folder upload is supported in the browser
  useEffect(() => {
    const input = document.createElement("input");
    input.type = "file";
    const isSupported = "webkitdirectory" in input || "directory" in input;
    setIsFolderUploadSupported(isSupported);
    if (!isSupported && uploadMode === "folder") {
      setUploadMode("file");
      console.warn("Folder upload is not supported in this browser.");
    }
    console.log("Folder upload supported:", isSupported); // Debug log
  }, [uploadMode]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      console.log("Dropped files:", acceptedFiles); // Debug log
      const fileEntries = acceptedFiles.map((file) => {
        const relativePath = file.webkitRelativePath || file.name;
        console.log(`File: ${file.name}, Relative Path: ${relativePath}`); // Debug log
        return {
          file,
          path: relativePath,
          size: file.size,
        };
      });

      setUploadedFiles((prev) => [...prev, ...fileEntries]);
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const removeFile = useCallback(
    (index: number) => {
      setUploadedFiles((prev) => {
        const updatedFiles = prev.filter((_, i) => i !== index);
        onFilesSelected(updatedFiles.map((entry) => entry.file));
        return updatedFiles;
      });
    },
    [onFilesSelected]
  );

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([]);
    onFilesSelected([]);
  }, [onFilesSelected]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    ...(uploadMode === "folder" && isFolderUploadSupported
      ? { webkitdirectory: true }
      : {}),
  });

  const handleDragEnd = useCallback(
    (event: any) => {
      const { active, over } = event;
      if (!active || !over || active.id === over.id) return;

      const oldIndex = uploadedFiles.findIndex((file) => file.path === active.id);
      const newIndex = uploadedFiles.findIndex((file) => file.path === over.id);

      setUploadedFiles((prevFiles) => {
        const newFiles = arrayMove(prevFiles, oldIndex, newIndex);
        onFilesSelected(newFiles.map((entry) => entry.file));
        return newFiles;
      });
    },
    [uploadedFiles, onFilesSelected]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-200 dark:text-gray-200 light:text-gray-800">
            Upload Your Code
          </h2>
          <div className="relative">
            <button
              className="p-1 rounded-full hover:bg-gray-700/30 light:hover:bg-gray-200 transition-colors duration-200"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label="Show upload instructions"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
            {showTooltip && (
              <div className="absolute top-full mt-2 w-64 p-2 bg-gray-800 light:bg-white text-gray-200 light:text-gray-800 text-sm rounded-lg shadow-lg z-10">
                Upload individual files or entire folders for code analysis. You can:
                <ul className="mt-1 list-disc list-inside">
                  <li>Drag & drop files or folders</li>
                  <li>Click to browse</li>
                  <li>Reorder files</li>
                  <li>Remove files</li>
                </ul>
                {!isFolderUploadSupported && (
                  <p className="mt-2 text-red-400">
                    Note: Folder upload is not supported in your browser.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          {["file", "folder"].map((mode) => (
            <button
              key={mode}
              className={`px-4 py-2 rounded-lg transition-all ${
                uploadMode === mode
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-[#1a1a1a] light:bg-gray-100 text-gray-400 light:text-gray-600 border border-gray-800 light:border-gray-300 hover:border-gray-700 light:hover:border-gray-400"
              } ${mode === "folder" && !isFolderUploadSupported ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (mode === "folder" && !isFolderUploadSupported) return;
                setUploadMode(mode as "file" | "folder");
              }}
              disabled={mode === "folder" && !isFolderUploadSupported}
              aria-label={mode === "file" ? "Upload individual files" : "Upload an entire folder"}
              title={
                mode === "folder" && !isFolderUploadSupported
                  ? "Folder upload is not supported in your browser"
                  : undefined
              }
            >
              {mode === "file" ? "Upload Files" : "Upload Folder"}
            </button>
          ))}
        </div>
      </div>

      {uploadMode === "folder" && !isFolderUploadSupported && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          <AlertTriangle className="w-5 h-5" />
          <p>
            Folder upload is not supported in your browser. Please use a modern browser like Chrome or Edge, or upload individual files instead.
          </p>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragActive
            ? "border-blue-500/50 bg-blue-500/5"
            : "border-gray-600 dark:border-gray-600 light:border-gray-300 hover:border-gray-500 dark:hover:border-gray-500 light:hover:border-gray-400 hover:bg-gray-800/30 dark:hover:bg-gray-800/30 light:hover:bg-gray-100/80"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          {uploadMode === "folder" ? (
            <FolderOpen className="w-16 h-16 mb-4 text-blue-400" />
          ) : (
            <Upload className="w-16 h-16 mb-4 text-blue-400" />
          )}
          <p className="text-xl font-medium text-gray-300 dark:text-gray-300 light:text-gray-600">
            {isDragActive
              ? `Drop your ${uploadMode === "folder" ? "folder" : "files"} here`
              : `Drag & drop your ${uploadMode} here`}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-400 mt-2">
            or click to browse
          </p>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="rounded-xl p-6 border bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-white border-gray-800 dark:border-gray-800 light:border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-200 dark:text-gray-200 light:text-gray-800">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 dark:text-red-400 light:text-red-500 hover:text-red-300 dark:hover:text-red-300 light:hover:text-red-600 transition-colors"
              onClick={clearAllFiles}
              aria-label="Remove all files"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={uploadedFiles.map((f) => f.path)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <SortableFileItem
                    key={file.path}
                    file={file}
                    index={index}
                    onRemove={removeFile}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}