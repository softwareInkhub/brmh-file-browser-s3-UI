import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { S3Object, FilePreview } from "../../types";
import { Edit, Loader2, Share2 } from "lucide-react";
import FileEditor from "./FileEditor";
import ShareFileModal from "./ShareFileModal";
import { isFileEditable, isTextViewable } from "../../lib/mimeTypes";
import { getFileContent, saveFileContent } from "../../lib/s3Service";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: S3Object;
  previewUrl?: string;
  onDownload: () => void;
  onStar: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  isStarred: boolean;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  previewUrl,
  onDownload,
  onStar,
  onRename,
  onMove,
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
  
  // Reset editing state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setFileContent("");
      setEditorError(null);
    }
  }, [isOpen]);
  
  if (!file) return null;

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

    const fileType = file.type?.toLowerCase() || "";
    const fileName = getFileName(file.key).toLowerCase();

    if (
      fileType.includes("image") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif") ||
      fileName.endsWith(".webp")
    ) {
      return (
        <img
          src={previewUrl}
          alt={getFileName(file.key)}
          className="max-w-full max-h-full object-contain"
        />
      );
    } else if (
      fileType.includes("pdf") ||
      fileName.endsWith(".pdf")
    ) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={getFileName(file.key)}
        ></iframe>
      );
    } else if (
      fileType.includes("video") ||
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm") ||
      fileName.endsWith(".mov")
    ) {
      return (
        <video
          src={previewUrl}
          controls
          className="max-w-full max-h-full"
        ></video>
      );
    } else if (
      fileType.includes("audio") ||
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".wav") ||
      fileName.endsWith(".ogg")
    ) {
      return (
        <audio
          src={previewUrl}
          controls
          className="w-full"
        ></audio>
      );
    } else {
      // Generic file preview with download button
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-16 w-16 text-gray-500"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {getFileName(file.key)}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            This file type cannot be previewed
          </p>
          <Button onClick={onDownload}>
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
            Download
          </Button>
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
      
      {/* Preview Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-medium">
                {getFileName(file.key)}
              </DialogTitle>
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
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-gray-50 min-h-[40vh]">
            {renderPreview()}
          </div>

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
                <Button variant="outline" size="sm" onClick={onMove}>
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
                    <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                    <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
                    <path d="M12 3v6" />
                  </svg>
                  Move
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FilePreviewModal;