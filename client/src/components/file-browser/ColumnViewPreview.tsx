import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { S3Object, TreeNode } from "../../types";
import { Edit, Loader2, Share2, Download, Star, Trash2, FileText, X } from "lucide-react";
import FileEditor from "./FileEditor";
import ShareFileModal from "./ShareFileModal";
import { isFileEditable, isTextViewable, isVideoFile, isPdfFile, isDocumentFile, getFileType } from "../../lib/mimeTypes";
import { getFileContent, saveFileContent } from "../../lib/s3Service";

interface ColumnViewPreviewProps {
  selectedFile: TreeNode | null;
  previewUrl?: string;
  onDownload?: () => void;
  onStar?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  isStarred?: boolean;
}

const ColumnViewPreview: React.FC<ColumnViewPreviewProps> = ({
  selectedFile,
  previewUrl,
  onDownload,
  onStar,
  onRename,
  onDelete,
  isStarred = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const canEdit = selectedFile ? isTextViewable(selectedFile.name) : false;
  
  // Reset editing state when file changes
  useEffect(() => {
      setIsEditing(false);
      setFileContent("");
      setEditorError(null);
  }, [selectedFile]);
  
  // Fetch file content when entering edit mode
  const handleEditClick = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoadingContent(true);
      setEditorError(null);
      
      const result = await getFileContent(selectedFile.key);
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
    if (!selectedFile) return;
    
    try {
      setIsSavingContent(true);
      setEditorError(null);
      
      await saveFileContent(selectedFile.key, content);
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
  
  // Get file name from key
  const getFileName = (key: string): string => {
    return key.split("/").pop() || key;
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

  // Show loading state
    if (!selectedFile) {
      return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No File Selected</h3>
          <p className="text-sm text-gray-500">Select a file to preview its contents</p>
        </div>
        </div>
      );
    }

    // Show editor when in edit mode
    if (isEditing) {
      return (
        <FileEditor
          file={{
            key: selectedFile.key,
          name: selectedFile.name,
          size: selectedFile.size,
          lastModified: selectedFile.lastModified,
          type: selectedFile.type === 'file' ? 'file' : undefined,
          isFolder: selectedFile.type === 'folder'
          }}
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
    
  const fileName = selectedFile.name;
  const fileType = getFileType(fileName);

  // Determine what type of preview to show based on file type
  const renderPreview = () => {
    // Video preview - horizontal layout with controls
    if (isVideoFile(fileName)) {
      return (
        <div className="w-full h-full flex flex-col bg-gray-50">
          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            <video
              src={previewUrl || ''}
              controls
              className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
              autoPlay={false}
              preload="metadata"
            />
          </div>
          
          {/* Video Metadata Bar */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatSize(selectedFile.size)}</span>
                <span>•</span>
                <span>{fileType}</span>
                {selectedFile.lastModified && (
                  <>
                    <span>•</span>
                    <span>Last modified {formatDate(selectedFile.lastModified)}</span>
                  </>
                )}
        </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRename}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Rename
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Image preview - centered layout like reference
    else if (
      fileName.toLowerCase().endsWith(".jpg") ||
      fileName.toLowerCase().endsWith(".jpeg") ||
      fileName.toLowerCase().endsWith(".png") ||
      fileName.toLowerCase().endsWith(".gif") ||
      fileName.toLowerCase().endsWith(".webp")
    ) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <img
            src={previewUrl || ''}
            alt={fileName}
            className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
          />
        </div>
      );
    } 
    // PDF preview - optimized for full viewport utilization with responsive scaling
    else if (isPdfFile(fileName)) {
      return (
        <div className="w-full h-full flex flex-col">
          {/* PDF Viewer Container - Maximizes available space */}
          <div className="flex-1 min-h-0 relative">
          <iframe
            src={previewUrl || ''}
            className="w-full h-full border-0"
              title={fileName}
              style={{ 
                height: 'calc(100vh - 240px)', // Optimized calculation: tab bar (60px) + header (60px) + metadata (40px) + margins (80px)
                minHeight: '600px', // Increased minimum for better usability
                maxHeight: 'calc(100vh - 160px)', // Maximum available space
                display: 'block',
                objectFit: 'contain', // Maintains aspect ratio
                overflow: 'auto' // Enables smooth scrolling for multi-page PDFs
              }}
              onLoad={(e) => {
                // Ensure iframe takes full available space
                const iframe = e.target as HTMLIFrameElement;
                if (iframe) {
                  iframe.style.height = '100%';
                  iframe.style.width = '100%';
                }
              }}
            />
          </div>
          
          {/* PDF Metadata Bar - Fixed at bottom with minimal spacing */}
          <div className="bg-white border-t border-gray-200 p-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatSize(selectedFile.size)}</span>
                <span>•</span>
                <span>{fileType}</span>
                {selectedFile.lastModified && (
                  <>
                    <span>•</span>
                    <span>Last modified {formatDate(selectedFile.lastModified)}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRename}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Rename
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    } 
    // Audio preview
    else if (
      fileName.toLowerCase().endsWith(".mp3") ||
      fileName.toLowerCase().endsWith(".wav") ||
      fileName.toLowerCase().endsWith(".ogg") ||
      fileName.toLowerCase().endsWith(".m4a")
    ) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{fileName}</h3>
              <p className="text-sm text-gray-500 mt-1">{formatSize(selectedFile.size)}</p>
            </div>
            <audio
              src={previewUrl || ''}
              controls
              className="w-full"
              preload="metadata"
            />
          </div>
        </div>
      );
    } 
    // Document files - editable with edit button
    else if (isDocumentFile(fileName)) {
      return (
        <div className="w-full h-full flex flex-col bg-gray-50">
          {/* Document Content */}
          <div className="flex-1 p-4">
            <div className="bg-white rounded-lg p-4 h-full overflow-auto shadow-sm">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {fileContent || "Click 'Edit' to view and edit this file"}
            </pre>
            </div>
          </div>
          
          {/* Document Metadata with Edit Button */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatSize(selectedFile.size)}</span>
                <span>•</span>
                <span>{fileType}</span>
                {selectedFile.lastModified && (
                  <>
                    <span>•</span>
                    <span>Last modified {formatDate(selectedFile.lastModified)}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {canEdit && !isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditClick}
                    disabled={isLoadingContent}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {isLoadingContent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShareModalOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRename}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Rename
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    } 
    // Generic file preview - card layout like reference
    else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 p-8">
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
              {fileName}
            </h3>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Size:</span> {formatSize(selectedFile.size)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {fileType}
              </p>
              {selectedFile.lastModified && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Modified:</span> {formatDate(selectedFile.lastModified)}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-6">
              This file type cannot be previewed. Use the download button in the header to download this file.
            </p>
            <Button 
              onClick={onDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header with file info and close button */}
      <div className="px-6 py-4 border-b border-gray-200 relative">
        <div className="flex items-center justify-between">
          <div className="text-lg font-medium">
            {fileName}
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
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        <div className="file-preview-container">
          {renderPreview()}
        </div>
      </div>
      
      {/* Footer with file info and action buttons - only for non-video, non-pdf, non-document files */}
      {selectedFile && selectedFile.type === 'file' && 
       !isVideoFile(getFileName(selectedFile.key)) && 
       !isPdfFile(getFileName(selectedFile.key)) && 
       !isDocumentFile(getFileName(selectedFile.key)) && (
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatSize(selectedFile.size)}</span>
              <span>•</span>
              <span>{getFileType(getFileName(selectedFile.key))}</span>
                {selectedFile.lastModified && (
                <>
                  <span>•</span>
                  <span>Last modified {formatDate(selectedFile.lastModified)}</span>
                </>
                )}
            </div>
            
            <div className="flex items-center space-x-2">
                  <Button
                variant="ghost"
                    size="sm"
                    onClick={() => setIsShareModalOpen(true)}
                className="text-gray-600 hover:text-gray-900"
                  >
                <Share2 className="h-4 w-4 mr-1" />
                Share
                  </Button>
                  
                  <Button
                variant="ghost"
                    size="sm"
                onClick={onRename}
                className="text-gray-600 hover:text-gray-900"
                  >
                <Edit className="h-4 w-4 mr-1" />
                Rename
                  </Button>
                  
                  <Button
                variant="ghost"
                    size="sm"
                onClick={onDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                <Download className="h-4 w-4 mr-1" />
                Download
                  </Button>
                  
                  <Button
                variant="ghost"
                    size="sm"
                    onClick={onDelete}
                className="text-red-600 hover:text-red-700"
                  >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
                  </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Modal */}
      {selectedFile && (
        <ShareFileModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          file={{
            key: selectedFile.key,
            name: selectedFile.name,
            size: selectedFile.size,
            lastModified: selectedFile.lastModified,
            type: selectedFile.type === 'file' ? 'file' : undefined,
            isFolder: selectedFile.type === 'folder'
          }}
        />
      )}
    </div>
  );
};

export default ColumnViewPreview;
