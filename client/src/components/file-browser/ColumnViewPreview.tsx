import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { S3Object, TreeNode } from "../../types";
import { Edit, Loader2, Share2, Download, Star, Trash2, Move, FileText } from "lucide-react";
import FileEditor from "./FileEditor";
import ShareFileModal from "./ShareFileModal";
import { isFileEditable, isTextViewable } from "../../lib/mimeTypes";
import { getFileContent, saveFileContent } from "../../lib/s3Service";

interface ColumnViewPreviewProps {
  selectedFile?: TreeNode;
  onDownload?: () => void;
  onStar?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  isStarred?: boolean;
}

const ColumnViewPreview: React.FC<ColumnViewPreviewProps> = ({
  selectedFile,
  onDownload,
  onStar,
  onRename,
  onMove,
  onDelete,
  isStarred = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const canEdit = selectedFile ? isTextViewable(selectedFile.key) : false;
  
  // Reset state when selected file changes
  useEffect(() => {
    if (selectedFile) {
      setIsEditing(false);
      setFileContent("");
      setEditorError(null);
      setPreviewUrl(null);
      
      // Generate preview URL for files
      if (selectedFile.type === 'file') {
        // For now, we'll use a placeholder. In a real implementation,
        // you'd generate a signed URL or fetch the file content
        setPreviewUrl(`/api/files/preview?key=${encodeURIComponent(selectedFile.key)}`);
      }
    }
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

  // Determine what type of preview to show based on file type
  const renderPreview = () => {
    if (!selectedFile) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <FileText className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">No file selected</p>
          <p className="text-sm">Select a file from the tree to preview</p>
        </div>
      );
    }

    // Show editor when in edit mode
    if (isEditing) {
      return (
        <FileEditor
          file={{
            key: selectedFile.key,
            name: selectedFile.name
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
    
    // Show loading spinner when loading preview
    if (!previewUrl && selectedFile.type === 'file') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (selectedFile.type === 'folder') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-16 w-16 mb-4"
          >
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
          </svg>
          <p className="text-lg font-medium">Folder</p>
          <p className="text-sm">{selectedFile.name}</p>
        </div>
      );
    }

    const fileName = getFileName(selectedFile.key).toLowerCase();

    if (
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif") ||
      fileName.endsWith(".webp")
    ) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={previewUrl || ''}
            alt={getFileName(selectedFile.key)}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    } else if (fileName.endsWith(".pdf")) {
      return (
        <div className="w-full h-full">
          <iframe
            src={previewUrl || ''}
            className="w-full h-full border-0"
            title={getFileName(selectedFile.key)}
          />
        </div>
      );
    } else if (isTextViewable(selectedFile.key)) {
      return (
        <div className="w-full h-full p-4">
          <div className="bg-gray-50 rounded-lg p-4 h-full overflow-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {fileContent || "Click 'Edit' to view and edit this file"}
            </pre>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-16 w-16 mb-4"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-lg font-medium">File Preview</p>
          <p className="text-sm">{getFileName(selectedFile.key)}</p>
          <p className="text-xs mt-2">{formatSize(selectedFile.size)}</p>
        </div>
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header with file info and actions */}
      {selectedFile && (
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {getFileName(selectedFile.key)}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{formatSize(selectedFile.size)}</span>
                {selectedFile.lastModified && (
                  <span>Modified {formatDate(selectedFile.lastModified)}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {selectedFile.type === 'file' && (
                <>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditClick}
                      disabled={isLoadingContent}
                    >
                      {isLoadingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onStar}
                  >
                    <Star className={`h-4 w-4 ${isStarred ? 'fill-yellow-400 text-yellow-600' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMove}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Preview content */}
      <div className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>
      
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
