import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { S3Object } from "../../types";
import { Edit, Loader2, Share2 } from "lucide-react";
import FileEditor from "./FileEditor";
import ShareFileModal from "./ShareFileModal";
import { isFileEditable, isTextViewable } from "../../lib/mimeTypes";
import { getFileContent, saveFileContent } from "../../lib/s3Service";

interface FilePreviewTabProps {
  file: S3Object;
  previewUrl?: string;
  onDownload: () => void;
  onStar: () => void;
  onRename: () => void;
  onDelete: () => void;
  isStarred: boolean;
}

// Custom hook to calculate available height for PDF preview
const usePdfPreviewHeight = () => {
  const [availableHeight, setAvailableHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeightRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  const calculateHeight = useCallback(() => {
    if (!containerRef.current || !isActiveRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const containerTop = rect.top;
    
    // Calculate available height: viewport height minus the space above the container
    const height = viewportHeight - containerTop;
    
    // Ensure minimum height and apply some padding
    const minHeight = 400; // Minimum height in pixels
    const finalHeight = Math.max(height - 20, minHeight); // 20px padding
    
    // Only update if height actually changed significantly (more than 10px)
    if (Math.abs(finalHeight - lastHeightRef.current) > 10) {
      lastHeightRef.current = finalHeight;
      setAvailableHeight(finalHeight);
    }
  }, []);

  const throttledCalculateHeight = useCallback(() => {
    if (!isActiveRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      calculateHeight();
    }, 200); // Much higher throttling to reduce frequency
  }, [calculateHeight]);

  useEffect(() => {
    // Only set up observers if this is actually a PDF file
    isActiveRef.current = true;
    
    // Initial calculation
    calculateHeight();

    // Set up resize observer for the container with passive option
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to batch updates
        requestAnimationFrame(() => {
          throttledCalculateHeight();
        });
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Set up window resize listener with passive option
    const handleResize = () => {
      requestAnimationFrame(() => {
        throttledCalculateHeight();
      });
    };
    
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      isActiveRef.current = false;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [throttledCalculateHeight]);

  return { availableHeight, containerRef };
};

// Custom hook to calculate available dimensions for video preview
const useVideoPreviewDimensions = () => {
  const [availableDimensions, setAvailableDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const isActiveRef = useRef<boolean>(false);

  const calculateDimensions = useCallback(() => {
    if (!containerRef.current || !isActiveRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const containerTop = rect.top;
    const containerLeft = rect.left;
    
    // Calculate available dimensions: viewport minus the space above and to the left of the container
    const availableHeight = viewportHeight - containerTop - 20; // 20px padding
    const availableWidth = viewportWidth - containerLeft - 20; // 20px padding
    
    // Ensure minimum dimensions
    const minHeight = 300;
    const minWidth = 400;
    const finalHeight = Math.max(availableHeight, minHeight);
    const finalWidth = Math.max(availableWidth, minWidth);
    
    // Only update if dimensions actually changed significantly (more than 15px)
    if (Math.abs(finalWidth - lastDimensionsRef.current.width) > 15 || 
        Math.abs(finalHeight - lastDimensionsRef.current.height) > 15) {
      lastDimensionsRef.current = { width: finalWidth, height: finalHeight };
      setAvailableDimensions({ width: finalWidth, height: finalHeight });
    }
  }, []);

  const throttledCalculateDimensions = useCallback(() => {
    if (!isActiveRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      calculateDimensions();
    }, 200); // Much higher throttling to reduce frequency
  }, [calculateDimensions]);

  useEffect(() => {
    // Only set up observers if this is actually a video file
    isActiveRef.current = true;
    
    // Initial calculation
    calculateDimensions();

    // Set up resize observer for the container with passive option
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to batch updates
        requestAnimationFrame(() => {
          throttledCalculateDimensions();
        });
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Set up window resize listener with passive option
    const handleResize = () => {
      requestAnimationFrame(() => {
        throttledCalculateDimensions();
      });
    };
    
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      isActiveRef.current = false;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [throttledCalculateDimensions]);

  return { availableDimensions, containerRef: containerRef };
};

const FilePreviewTab: React.FC<FilePreviewTabProps> = ({
  file,
  previewUrl,
  onDownload,
  onStar,
  onRename,
  onDelete,
  isStarred,
}) => {

  const [isEditing, setIsEditing] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const canEdit = file ? isTextViewable(file.key) : false;
  
  // Get file name from key
  const getFileName = (key: string): string => {
    return key.split("/").pop() || key;
  };
  
  // Determine file type for conditional hook usage
  const fileType = file.type?.toLowerCase() || "";
  const fileName = getFileName(file.key).toLowerCase();
  const isPdfFile = fileType.includes("pdf") || fileName.endsWith(".pdf");
  const isVideoFile = fileType.includes("video") || fileName.endsWith(".mp4") || fileName.endsWith(".webm") || fileName.endsWith(".mov") || fileName.endsWith(".avi");
  
  // Use the custom hook for PDF height calculation only when needed
  const { availableHeight, containerRef } = usePdfPreviewHeight();
  
  // Use the custom hook for video dimensions calculation only when needed
  const { availableDimensions, containerRef: videoContainerRef } = useVideoPreviewDimensions();
  
  // Reset editing state when file changes
  useEffect(() => {
    setIsEditing(false);
    setFileContent("");
    setEditorError(null);
  }, [file]);
  
  // Fetch file content when entering edit mode
  const handleEditClick = async () => {
    if (!file) return;
    
    try {
      setIsLoadingContent(true);
      setEditorError(null);
      
      const result = await getFileContent(file.key);
      setFileContent(result.content);
      setIsEditing(true);
    } catch (error) {
      console.error("Error fetching file content:", error);
      setEditorError(`Failed to load file content: ${error}`);
    } finally {
      setIsLoadingContent(false);
    }
  };
  
  // Save edited content
  const handleSaveContent = async (content: string) => {
    if (!file) return;
    
    try {
      setIsSavingContent(true);
      setEditorError(null);
      
      await saveFileContent(file.key, content);
      setIsEditing(false);
      
      // Reload preview after save
      window.location.reload(); // Simple solution to refresh preview
    } catch (error) {
      console.error("Error saving file content:", error);
      setEditorError(`Failed to save file content: ${error}`);
    } finally {
      setIsSavingContent(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditorError(null);
  };

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes) return "";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (date?: Date): string => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  // Determine what type of preview to show based on file type
  const renderPreview = () => {
    // Show editor when in edit mode
    if (isEditing) {
      return (
        <FileEditor
          file={file}
          content={fileContent}
          onSave={handleSaveContent}
          onCancel={handleCancelEdit}
          isLoading={isLoadingContent}
          isSaving={isSavingContent}
        />
      );
    }
    
    // Show error message if there's an editor error
    if (editorError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-100 p-6 rounded-lg mb-4 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 mx-auto mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{editorError}</p>
          </div>
          <Button onClick={() => setEditorError(null)}>Dismiss</Button>
        </div>
      );
    }
    
    // Show loading spinner when loading preview
    if (!previewUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

         // Use the already declared fileType and fileName variables

    if (
      fileType.includes("image") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif") ||
      fileName.endsWith(".webp")
    ) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={previewUrl}
            alt={getFileName(file.key)}
            className="file-preview-image"
          />
        </div>
      );
    } else if (
      fileType.includes("pdf") ||
      fileName.endsWith(".pdf")
    ) {
      return (
        <div 
          className="pdf-preview-root w-full"
          style={{ 
            height: `${availableHeight}px`,
            minHeight: '400px'
          }}
        >
          <iframe
            src={previewUrl}
            className="file-preview-iframe"
            title={getFileName(file.key)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
          ></iframe>
        </div>
      );
    } else if (
      fileType.includes("video") ||
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm") ||
      fileName.endsWith(".mov") ||
      fileName.endsWith(".avi")
    ) {
      return (
        <div 
          ref={videoContainerRef}
          className="video-preview-root w-full h-full flex items-center justify-center"
          style={{
            width: `${availableDimensions.width}px`,
            height: `${availableDimensions.height}px`,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        >
          <video
            src={previewUrl}
            controls
            className="file-preview-video"
            autoPlay={false}
            preload="metadata"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          ></video>
        </div>
      );
    } else if (
      fileType.includes("audio") ||
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".wav") ||
      fileName.endsWith(".ogg") ||
      fileName.endsWith(".m4a")
    ) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{getFileName(file.key)}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatSize(file.size)}</p>
            </div>
            <audio
              src={previewUrl}
              controls
              className="w-full"
              preload="metadata"
            ></audio>
          </div>
        </div>
      );
    } else {
      // Generic file preview without download button (download available in header)
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-6 mx-auto w-24 h-24 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-12 w-12 text-gray-500"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {getFileName(file.key)}
            </h3>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Size:</span> {formatSize(file.size)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {file.type || 'Unknown'}
              </p>
              {file.lastModified && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Modified:</span> {formatDate(file.lastModified)}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This file type cannot be previewed. Use the download button in the header to download this file.
            </p>
            <button
              onClick={onDownload}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
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
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download File
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      {/* Share Modal */}
      <ShareFileModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        file={file} 
      />
      
      {/* File Preview Tab Content */}
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 relative">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">
              {getFileName(file.key)}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onStar}
                className={`text-gray-400 hover:text-yellow-500 transition-colors ${
                  isStarred ? "text-yellow-500" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isStarred ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <button
                onClick={onDownload}
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-50 relative"
        >
          <div className="file-preview-container">
            {renderPreview()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <span>{formatSize(file.size)}</span> • <span>{file.type}</span> •
              Last modified <span>{formatDate(file.lastModified)}</span>
            </div>
            <div className="flex items-center space-x-3">
              {canEdit && !isEditing && (
                <Button variant="outline" size="sm" onClick={handleEditClick} disabled={isLoadingContent}>
                  {isLoadingContent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1.5" />
                      Edit
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
                             <Button variant="outline" size="sm" onClick={onRename}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-1.5"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Rename
              </Button>
                             <Button
                 variant="outline"
                 size="sm"
                 onClick={onDelete}
                 className="text-red-600 hover:bg-red-50"
               >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-1.5"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilePreviewTab;
