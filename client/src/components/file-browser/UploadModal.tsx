import React, { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadStatus } from "../../types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
  currentPath: string;
  uploads: UploadStatus[];
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  currentPath,
  uploads,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousUploadsLength = useRef(uploads.length);
  
  // Auto-close the modal when all uploads are complete
  useEffect(() => {
    // Check if uploads were previously in progress and are now all complete
    const isAllComplete = uploads.length > 0 && uploads.every(
      upload => upload.status === "complete" || upload.status === "error"
    );
    
    if (isAllComplete && previousUploadsLength.current === uploads.length) {
      // Add a small delay before closing to let the user see the 'Complete' status
      const timer = setTimeout(() => {
        onClose();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    
    previousUploadsLength.current = uploads.length;
  }, [uploads, onClose]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer.files.length > 0) {
        onUpload(Array.from(e.dataTransfer.files));
      }
    },
    [onUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onUpload(Array.from(e.target.files));
      }
    },
    [onUpload]
  );

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Calculate total progress for all uploads
  const calculateTotalProgress = (): number => {
    if (uploads.length === 0) return 0;
    
    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0);
    return totalProgress / uploads.length;
  };

  // Check if all uploads are complete
  const isAllComplete = uploads.every(
    (upload) => upload.status === "complete" || upload.status === "error"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">Upload Files</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        <div className="p-6">
          {uploads.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleFileDrop}
              onClick={handleUploadClick}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-primary"
              }`}
            >
              <div className="mx-auto h-16 w-16 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-full w-full"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                <span className="font-medium text-primary">Click to upload</span> or
                drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, Word, Excel, Images, and more
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileInputChange}
              />
            </div>
          ) : (
            <div className="mt-2">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Uploading {uploads.length} file{uploads.length > 1 ? "s" : ""}
                {uploads.some(u => u.status === "complete") && 
                  ` (${uploads.filter(u => u.status === "complete").length} complete)`}
              </h4>

              {/* Upload Progress List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {uploads.map((upload, index) => (
                  <div key={index} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900 truncate flex-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="inline h-4 w-4 mr-1"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        {upload.file.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {upload.status === "error" ? (
                          <span className="text-red-500">Error</span>
                        ) : upload.status === "complete" ? (
                          <span className="text-green-500">Complete</span>
                        ) : (
                          `${upload.progress}%`
                        )}
                      </span>
                    </div>
                    <Progress
                      value={upload.progress}
                      className="h-1.5"
                      variant={
                        upload.status === "error"
                          ? "destructive"
                          : upload.status === "complete"
                          ? "default"
                          : "default"
                      }
                    />
                    {upload.status === "error" && (
                      <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Overall Progress */}
              {!isAllComplete && uploads.length > 1 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">
                      Overall Progress
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(calculateTotalProgress())}%
                    </span>
                  </div>
                  <Progress value={calculateTotalProgress()} className="h-1.5" />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            {uploads.length > 0 && isAllComplete ? "Close" : "Cancel"}
          </Button>
          {uploads.length === 0 && (
            <Button onClick={handleUploadClick} className="ml-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
