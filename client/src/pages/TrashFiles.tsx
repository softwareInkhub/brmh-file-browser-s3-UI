import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/file-browser/AppHeader";
import Sidebar from "@/components/file-browser/Sidebar";

import FileGrid from "@/components/file-browser/FileGrid";
import FileList from "@/components/file-browser/FileList";
import DeleteConfirmModal from "@/components/file-browser/DeleteConfirmModal";
import ContextMenu from "@/components/file-browser/ContextMenu";
import { useToast } from "@/hooks/use-toast";
import { 
  listTrashFiles, 
  listFolders, 
  restoreFromTrash, 
  deleteFile
} from "@/lib/s3Service";
import { S3Object, Position, ViewMode, S3Folder } from "../types";
import { Button } from "@/components/ui/button";

const TrashFiles: React.FC = () => {
  // State
  const [files, setFiles] = useState<S3Object[]>([]);
  const [allFolders, setAllFolders] = useState<S3Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItem, setSelectedItem] = useState<S3Object | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: Position;
    item?: S3Object;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });
  const [sortBy, setSortBy] = useState<string>("deletedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  // Dummy storage info - would be fetched from a real API
  const [storageInfo] = useState({
    used: 4.2 * 1024 * 1024 * 1024, // 4.2 GB
    total: 10 * 1024 * 1024 * 1024, // 10 GB
    percentage: 42,
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch trash files
  const fetchTrashFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await listTrashFiles();
      setFiles(result.trashFiles);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load trash files: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch all folders for sidebar
  const fetchAllFolders = useCallback(async () => {
    try {
      const result = await listFolders();
      setAllFolders(result.folders);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load folders: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Initial load
  useEffect(() => {
    fetchTrashFiles();
    fetchAllFolders();
  }, [fetchTrashFiles, fetchAllFolders]);

  // Filter files by search term
  const filteredFiles = files.filter(
    (file) =>
      file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let aValue: any = a.name || a.key.split("/").pop() || a.key;
    let bValue: any = b.name || b.key.split("/").pop() || b.key;
    
    if (sortBy === "name") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else if (sortBy === "size") {
      aValue = a.size || 0;
      bValue = b.size || 0;
    } else if (sortBy === "lastModified") {
      aValue = new Date(a.lastModified || 0).getTime();
      bValue = new Date(b.lastModified || 0).getTime();
    } else if (sortBy === "deletedAt") {
      // @ts-ignore - custom property for trash files
      aValue = new Date(a.deletedAt || 0).getTime();
      // @ts-ignore - custom property for trash files
      bValue = new Date(b.deletedAt || 0).getTime();
    } else if (sortBy === "type") {
      aValue = a.type || "";
      bValue = b.type || "";
    }
    
    const comparison = sortDirection === "asc" ? 1 : -1;
    return aValue < bValue ? -comparison : aValue > bValue ? comparison : 0;
  });

  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      if (column === "deletedAt") {
        setSortDirection("desc"); // Most recently deleted first by default
      } else {
        setSortDirection("asc");
      }
    }
  };

  // Restore file
  const handleRestore = async (file: S3Object) => {
    try {
      setIsLoading(true);
      // @ts-ignore - custom property for trash files
      await restoreFromTrash(file.key, file.originalKey);
      await fetchTrashFiles();
      
      toast({
        title: "Success",
        description: "File restored successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to restore file: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete file permanently
  const handlePermanentDelete = async () => {
    if (!selectedItem) return;
    
    try {
      setIsLoading(true);
      await deleteFile(selectedItem.key);
      await fetchTrashFiles();
      
      // Close the delete confirmation modal after successful deletion
      setIsDeleteModalOpen(false);
      
      toast({
        title: "Success",
        description: "File permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete file: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Empty trash
  const handleEmptyTrash = async () => {
    try {
      setIsLoading(true);
      
      // Delete each file in trash
      for (const file of files) {
        await deleteFile(file.key);
      }
      
      await fetchTrashFiles();
      
      toast({
        title: "Success",
        description: "Trash emptied successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to empty trash: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Context menu handlers
  const handleContextMenu = (item: S3Object, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedItem(item);
    setContextMenu({
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      item,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Custom context menu for trash items
  const TrashContextMenu: React.FC<{
    position: Position;
    isVisible: boolean;
    onClose: () => void;
    item?: S3Object;
    onRestore: () => void;
    onDelete: () => void;
  }> = ({ position, isVisible, onClose, item, onRestore, onDelete }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      if (isVisible) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isVisible]);

    if (!isVisible || !item) return null;

    // Adjust position if too close to edge
    const adjustPosition = (pos: Position): Position => {
      const menuWidth = 208; // Approximate width of the menu
      const menuHeight = 110; // Approximate height of the menu
      
      const adjustedX = pos.x + menuWidth > window.innerWidth 
        ? window.innerWidth - menuWidth - 10 
        : pos.x;
      
      const adjustedY = pos.y + menuHeight > window.innerHeight
        ? window.innerHeight - menuHeight - 10
        : pos.y;
      
      return { x: adjustedX, y: adjustedY };
    };

    const adjustedPosition = adjustPosition(position);

    return (
      <div
        ref={menuRef}
        className="absolute z-50 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1"
        style={{ top: `${adjustedPosition.y}px`, left: `${adjustedPosition.x}px` }}
      >
        <button
          onClick={() => {
            onClose();
            onRestore();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 mr-2 text-gray-400"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Restore
        </button>
        
        <div className="border-t border-gray-200 my-1"></div>
        
        <button
          onClick={() => {
            onClose();
            onDelete();
          }}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 mr-2 text-red-500"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          Delete permanently
        </button>
      </div>
    );
  };

  // Custom file grid renderer for trash files
  const TrashFileGrid: React.FC<{
    files: S3Object[];
    onFileContextMenu: (file: S3Object, e: React.MouseEvent) => void;
    onRestore: (file: S3Object) => void;
  }> = ({ files, onFileContextMenu, onRestore }) => {
    // Get file icon based on type
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
      }
      
      // Add more file type icons as needed
      
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

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.key}
            onContextMenu={(e) => onFileContextMenu(file, e)}
            className="group relative bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md cursor-pointer transition-shadow"
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
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRestore(file)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Required for TypeScript
  const useRef = React.useRef;

  // Check if there are files to display
  const hasContent = sortedFiles.length > 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AppHeader
        onSearchChange={setSearchTerm}
        onUploadClick={() => setLocation("/")}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar folders={allFolders} storageInfo={storageInfo} />

        <main className="flex-1 overflow-y-auto bg-white p-4 lg:p-6">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
              <p className="text-sm text-gray-500 mt-1">Files will be permanently deleted after 30 days</p>
            </div>
            {hasContent && (
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm("Are you sure you want to empty the trash? This action cannot be undone.")) {
                    handleEmptyTrash();
                  }
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
                  className="h-4 w-4 mr-2"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Empty Trash
              </Button>
            )}
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div></div> {/* Empty div for spacing */}
            <div className="flex flex-wrap items-center space-x-3">
              <div className="flex items-center rounded-md border border-gray-300 bg-white">
                <button
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === "grid" ? "bg-gray-100 text-primary" : "text-gray-700 hover:bg-gray-50"
                  } border-r border-gray-300 rounded-l-md`}
                  onClick={() => setViewMode("grid")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`px-3 py-1.5 text-sm ${
                    viewMode === "list" ? "bg-gray-100 text-primary" : "text-gray-700 hover:bg-gray-50"
                  } rounded-r-md`}
                  onClick={() => setViewMode("list")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : !hasContent ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <h3 className="mt-2 text-base font-medium text-gray-900">Trash is empty</h3>
              <p className="mt-1 text-sm text-gray-500">
                Files you delete will appear here.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <TrashFileGrid
              files={sortedFiles}
              onFileContextMenu={handleContextMenu}
              onRestore={handleRestore}
            />
          ) : (
            <FileList
              files={sortedFiles}
              folders={[]} // No folders in trash view
              onFileClick={() => {}} // No file preview in trash
              onFolderClick={() => {}} // No folders in trash
              onFileContextMenu={handleContextMenu}
              onFolderContextMenu={() => {}} // No folders in trash
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handlePermanentDelete}
        item={selectedItem}
        isPermanent={true}
      />

      <TrashContextMenu
        position={contextMenu.position}
        isVisible={contextMenu.visible}
        onClose={closeContextMenu}
        item={contextMenu.item}
        onRestore={() => {
          if (contextMenu.item) {
            handleRestore(contextMenu.item);
          }
        }}
        onDelete={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          setIsDeleteModalOpen(true);
        }}
      />
    </div>
  );
};

export default TrashFiles;
