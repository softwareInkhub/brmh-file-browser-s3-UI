import React, { useState, useRef } from "react";
import { S3Object } from "../../types";
import { truncateFolderName } from "../../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ItemMenu from "./ItemMenu";

interface FileListProps {
  files: S3Object[];
  folders: S3Object[];
  onFileClick: (file: S3Object) => void;
  onFolderClick: (folder: S3Object) => void;
  onFileContextMenu: (file: S3Object, e: React.MouseEvent) => void;
  onFolderContextMenu: (folder: S3Object, e: React.MouseEvent) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onDrop?: (sourceKeys: string[], destinationPath: string) => void;
  currentPath?: string;
  onItemRename?: (item: S3Object) => void;
  onItemDelete?: (item: S3Object) => void;
  onItemMove?: (item: S3Object) => void;
  onItemDownload?: (item: S3Object) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  folders,
  onFileClick,
  onFolderClick,
  onFileContextMenu,
  onFolderContextMenu,
  sortBy,
  sortDirection,
  onSort,
  onDrop,
  currentPath,
  onItemRename,
  onItemDelete,
  onItemMove,
  onItemDownload,
}) => {
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<S3Object | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  // Helper function to format date
  const formatDate = (date?: Date): string => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  // Helper function to format file size
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
  
  // Helper function to check if click originated from menu
  const isMenuClick = (e: React.MouseEvent): boolean => {
    const target = e.target as HTMLElement;
    return target.closest('[data-menu-trigger]') !== null || 
           target.closest('[role="menu"]') !== null ||
           target.closest('[role="menuitem"]') !== null;
  };

  // Helper to get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 ml-1 text-gray-400"
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      );
    }

    return sortDirection === "asc" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 ml-1"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 ml-1"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  };

  return (
    <div 
      ref={tableRef}
      className="border rounded-md overflow-hidden"
      onDragOver={(e) => handleDragOver(e)}
      onDrop={(e) => handleDrop(e)}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center">
                Name {getSortIcon("name")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => onSort("type")}
            >
              <div className="flex items-center">
                Type {getSortIcon("type")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => onSort("size")}
            >
              <div className="flex items-center">
                Size {getSortIcon("size")}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => onSort("lastModified")}
            >
              <div className="flex items-center">
                Last Modified {getSortIcon("lastModified")}
              </div>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Folders */}
          {folders.map((folder) => (
            <TableRow
              key={folder.key}
              onClick={(e) => {
                if (!isMenuClick(e)) {
                  onFolderClick(folder);
                }
              }}
              onContextMenu={(e) => onFolderContextMenu(folder, e)}
              className={`cursor-pointer hover:bg-gray-50 ${dragOverFolder === folder.key ? 'bg-blue-50 ring-2 ring-blue-300' : ''}`}
              draggable={folder.key !== '_trash/' && folder.key !== '_starred/'}
              onDragStart={(e) => handleDragStart(folder, e)}
              onDragOver={(e) => handleDragOver(e, folder)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder)}
            >
              <TableCell className="p-2">
                <div className="flex-shrink-0 bg-yellow-100 p-1 rounded-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-yellow-500"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                  </svg>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <span title={folder.name || folder.key.split("/").filter(Boolean).pop() || folder.key}>
                  {truncateFolderName(folder.name || folder.key.split("/").filter(Boolean).pop() || folder.key, 18)}
                </span>
              </TableCell>
              <TableCell>Folder</TableCell>
              <TableCell>-</TableCell>
              <TableCell>{formatDate(folder.lastModified)}</TableCell>
              <TableCell className="text-right">
                {onItemRename && onItemDelete ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ItemMenu
                      item={folder}
                      onRename={onItemRename}
                      onDelete={onItemDelete}
                      onMove={onItemMove}
                      onDownload={onItemDownload}
                    />
                  </div>
                ) : (
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
                )}
              </TableCell>
            </TableRow>
          ))}

          {/* Files */}
          {files.map((file) => (
            <TableRow
              key={file.key}
              onClick={(e) => {
                if (!isMenuClick(e)) {
                  onFileClick(file);
                }
              }}
              onContextMenu={(e) => onFileContextMenu(file, e)}
              className="cursor-pointer hover:bg-gray-50"
              draggable
              onDragStart={(e) => handleDragStart(file, e)}
            >
              <TableCell className="p-2">
                <div className="flex-shrink-0 bg-blue-100 p-1 rounded-md flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-blue-500"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <span title={file.name || file.key.split("/").pop() || file.key}>
                  {truncateFolderName(file.name || file.key.split("/").pop() || file.key, 20)}
                </span>
              </TableCell>
              <TableCell>{file.type || "Unknown"}</TableCell>
              <TableCell>{formatSize(file.size)}</TableCell>
              <TableCell>{formatDate(file.lastModified)}</TableCell>
              <TableCell className="text-right">
                {onItemRename && onItemDelete ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ItemMenu
                      item={file}
                      onRename={onItemRename}
                      onDelete={onItemDelete}
                      onMove={onItemMove}
                      onDownload={onItemDownload}
                    />
                  </div>
                ) : (
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
                )}
              </TableCell>
            </TableRow>
          ))}

          {/* Empty state */}
          {folders.length === 0 && files.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 text-gray-400 mb-2"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                  </svg>
                  <p className="text-gray-500 text-sm">No files or folders found</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default FileList;
