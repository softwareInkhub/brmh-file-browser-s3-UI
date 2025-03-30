import React, { useState, useRef } from "react";
import { S3Object } from "../../types";

interface FileGridProps {
  files: S3Object[];
  folders: S3Object[];
  onFileClick: (file: S3Object) => void;
  onFolderClick: (folder: S3Object) => void;
  onFileContextMenu: (file: S3Object, e: React.MouseEvent) => void;
  onFolderContextMenu: (folder: S3Object, e: React.MouseEvent) => void;
  onDrop?: (sourceKeys: string[], destinationPath: string) => void;
  currentPath?: string;
}

const FileGrid: React.FC<FileGridProps> = ({
  files,
  folders,
  onFileClick,
  onFolderClick,
  onFileContextMenu,
  onFolderContextMenu,
  onDrop,
  currentPath,
}) => {
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<S3Object | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // Helper to get icon based on file type
  const getFileIcon = (file: S3Object) => {
    const type = file.type?.toLowerCase() || "";
    
    if (type.includes("pdf")) {
      return (
        <div className="flex-shrink-0 bg-red-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-red-500"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 15v-4" />
            <path d="M12 15v-6" />
            <path d="M15 15v-2" />
          </svg>
        </div>
      );
    } else if (type.includes("word") || type.includes("doc")) {
      return (
        <div className="flex-shrink-0 bg-purple-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-purple-500"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
      );
    } else if (type.includes("excel") || type.includes("spreadsheet") || type.includes("csv")) {
      return (
        <div className="flex-shrink-0 bg-green-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-green-500"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
          </svg>
        </div>
      );
    } else if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg") || type.includes("gif")) {
      return (
        <div className="flex-shrink-0 bg-pink-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-pink-500"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );
    } else if (type.includes("audio") || type.includes("mp3") || type.includes("wav")) {
      return (
        <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-indigo-500"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
      );
    } else if (type.includes("video") || type.includes("mp4") || type.includes("mov")) {
      return (
        <div className="flex-shrink-0 bg-orange-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-orange-500"
          >
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="flex-shrink-0 bg-blue-100 p-2 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-blue-500"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
      );
    }
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
  
  // Drag and drop handlers
  const handleDragStart = (item: S3Object, e: React.DragEvent) => {
    setDraggedItem(item);
    
    // Set dragged item data for transfer
    e.dataTransfer.setData('text/plain', item.key);
    
    // Set a custom drag image
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-white p-2 rounded shadow border border-gray-200';
    dragImage.textContent = item.name || item.key.split('/').pop() || item.key;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 10, 10);
    
    // Cleanup after drag operation starts
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };
  
  const handleDragOver = (e: React.DragEvent, folder?: S3Object) => {
    // Prevent default to allow drop
    e.preventDefault();
    
    // Only allow dropping onto folders
    if (folder && folder.isFolder) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverFolder(folder.key);
    } else if (!folder) {
      // Allow dropping onto the grid itself to move to current path
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };
  
  const handleDragLeave = () => {
    setDragOverFolder(null);
  };
  
  const handleDrop = (e: React.DragEvent, folder?: S3Object) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    // Get the dragged file key
    const sourceKey = e.dataTransfer.getData('text/plain');
    
    if (!sourceKey || !draggedItem) {
      return;
    }
    
    // Determine target path
    let targetPath: string;
    if (folder && folder.isFolder) {
      // Drop onto a folder
      targetPath = folder.key;
      // Add trailing slash if needed
      if (!targetPath.endsWith('/')) {
        targetPath += '/';
      }
    } else {
      // Drop onto the current path
      targetPath = currentPath || '';
    }
    
    // Call the drop handler with the source and target
    if (onDrop) {
      onDrop([sourceKey], targetPath);
    }
    
    // Reset drag state
    setDraggedItem(null);
  };

  return (
    <div 
      ref={gridRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      onDragOver={(e) => handleDragOver(e)}
      onDrop={(e) => handleDrop(e)}
    >
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.key}
          onClick={() => onFolderClick(folder)}
          onContextMenu={(e) => onFolderContextMenu(folder, e)}
          onDragOver={(e) => handleDragOver(e, folder)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder)}
          className={`group relative bg-white border ${dragOverFolder === folder.key ? 'border-primary border-2' : 'border-gray-200'} rounded-lg shadow-sm p-4 hover:shadow-md cursor-pointer transition-shadow`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-yellow-500"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {folder.name || folder.key.split("/").filter(Boolean).pop() || folder.key}
              </p>
              <p className="text-xs text-gray-500">Folder</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent folder click
                  onFolderContextMenu(folder, e);
                }}
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
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.key}
          onClick={() => onFileClick(file)}
          onContextMenu={(e) => onFileContextMenu(file, e)}
          draggable={true}
          onDragStart={(e) => handleDragStart(file, e)}
          className={`group relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md cursor-pointer transition-shadow ${draggedItem?.key === file.key ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center">
            {getFileIcon(file)}
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name || file.key.split("/").pop() || file.key}
              </p>
              <p className="text-xs text-gray-500">
                {formatSize(file.size)} • {file.type || 'Unknown'}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent file click
                  onFileContextMenu(file, e);
                }}
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
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileGrid;
