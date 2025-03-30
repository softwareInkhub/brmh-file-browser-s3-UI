import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/file-browser/AppHeader";
import Sidebar from "@/components/file-browser/Sidebar";
import ActionBar from "@/components/file-browser/ActionBar";
import FileGrid from "@/components/file-browser/FileGrid";
import FileList from "@/components/file-browser/FileList";
import FilePreviewModal from "@/components/file-browser/FilePreviewModal";
import RenameModal from "@/components/file-browser/RenameModal";
import MoveModal from "@/components/file-browser/MoveModal";
import DeleteConfirmModal from "@/components/file-browser/DeleteConfirmModal";
import ContextMenu from "@/components/file-browser/ContextMenu";
import { useToast } from "@/hooks/use-toast";
import { 
  listStarredFiles, 
  listFolders, 
  getFilePreviewUrl, 
  renameFile, 
  moveFile, 
  moveToTrash, 
  toggleStar, 
  downloadFile 
} from "@/lib/s3Service";
import { S3Object, Position, ViewMode, S3Folder } from "../types";

const StarredFiles: React.FC = () => {
  // State
  const [files, setFiles] = useState<S3Object[]>([]);
  const [allFolders, setAllFolders] = useState<S3Folder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedItem, setSelectedItem] = useState<S3Object | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: Position;
    item?: S3Object;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // We know all items are starred
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  // Dummy storage info - would be fetched from a real API
  const [storageInfo] = useState({
    used: 4.2 * 1024 * 1024 * 1024, // 4.2 GB
    total: 10 * 1024 * 1024 * 1024, // 10 GB
    percentage: 42,
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch starred files
  const fetchStarredFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await listStarredFiles();
      setFiles(result.starredFiles);
      
      // Add all starred files to the starred set
      const starredKeys = new Set<string>();
      result.starredFiles.forEach(file => starredKeys.add(file.key));
      setStarredItems(starredKeys);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load starred files: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch all folders for sidebar and move modal
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
    fetchStarredFiles();
    fetchAllFolders();
  }, [fetchStarredFiles, fetchAllFolders]);

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
      setSortDirection("asc");
    }
  };

  // Navigate to folder
  const handleFolderClick = (folder: S3Object) => {
    const path = folder.key;
    setLocation(`/?prefix=${encodeURIComponent(path)}`);
  };

  // Preview file
  const handleFilePreview = async (file: S3Object) => {
    try {
      setSelectedItem(file);
      setIsPreviewModalOpen(true);
      setPreviewUrl(undefined);

      const preview = await getFilePreviewUrl(file.key);
      setPreviewUrl(preview.url);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to preview file: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Rename file
  const handleRename = async (newName: string) => {
    if (!selectedItem) return;
    
    try {
      await renameFile(selectedItem.key, newName);
      await fetchStarredFiles();
      
      toast({
        title: "Success",
        description: `File renamed successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to rename file: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Move file
  const handleMove = async (destinationPath: string) => {
    if (!selectedItem) return;
    
    try {
      await moveFile(selectedItem.key, destinationPath);
      await fetchStarredFiles();
      
      toast({
        title: "Success",
        description: `File moved successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to move file: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Delete file (move to trash)
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      await moveToTrash(selectedItem.key);
      await fetchStarredFiles();
      
      toast({
        title: "Success",
        description: `File moved to trash`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete file: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Download file
  const handleDownload = () => {
    if (!selectedItem) return;
    
    try {
      downloadFile(selectedItem.key);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to download file: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Unstar file
  const handleToggleStar = async () => {
    if (!selectedItem) return;
    
    try {
      await toggleStar(selectedItem.key, false);
      
      // Update local state
      const newStarredItems = new Set(starredItems);
      newStarredItems.delete(selectedItem.key);
      setStarredItems(newStarredItems);
      
      // Refresh starred files
      await fetchStarredFiles();
      
      toast({
        title: "Success",
        description: "File removed from starred",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to unstar file: ${(error as Error).message}`,
        variant: "destructive",
      });
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

  const handleFileClick = (file: S3Object) => {
    handleFilePreview(file);
  };

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
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Starred Files</h1>
            <p className="text-sm text-gray-500 mt-1">Files you've marked as important</p>
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
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h3 className="mt-2 text-base font-medium text-gray-900">No starred files</h3>
              <p className="mt-1 text-sm text-gray-500">
                Star your important files to access them quickly.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <FileGrid
              files={sortedFiles}
              folders={[]} // No folders in starred files view
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
              onFileContextMenu={handleContextMenu}
              onFolderContextMenu={handleContextMenu}
            />
          ) : (
            <FileList
              files={sortedFiles}
              folders={[]} // No folders in starred files view
              onFileClick={handleFileClick}
              onFolderClick={handleFolderClick}
              onFileContextMenu={handleContextMenu}
              onFolderContextMenu={handleContextMenu}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <FilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        file={selectedItem}
        previewUrl={previewUrl}
        onDownload={handleDownload}
        onStar={handleToggleStar}
        onRename={() => {
          setIsPreviewModalOpen(false);
          setIsRenameModalOpen(true);
        }}
        onMove={() => {
          setIsPreviewModalOpen(false);
          setIsMoveModalOpen(true);
        }}
        onDelete={() => {
          setIsPreviewModalOpen(false);
          setIsDeleteModalOpen(true);
        }}
        isStarred={selectedItem ? starredItems.has(selectedItem.key) : false}
      />

      <RenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRename}
        item={selectedItem}
      />

      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onMove={handleMove}
        item={selectedItem}
        folders={allFolders}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
        item={selectedItem}
      />

      <ContextMenu
        position={contextMenu.position}
        isVisible={contextMenu.visible}
        onClose={closeContextMenu}
        item={contextMenu.item}
        onPreview={() => {
          closeContextMenu();
          handleFilePreview(contextMenu.item!);
        }}
        onDownload={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          handleDownload();
        }}
        onRename={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          setIsRenameModalOpen(true);
        }}
        onMove={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          setIsMoveModalOpen(true);
        }}
        onStar={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          handleToggleStar();
        }}
        onDelete={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          setIsDeleteModalOpen(true);
        }}
        isStarred={contextMenu.item ? starredItems.has(contextMenu.item.key) : false}
      />
    </div>
  );
};

export default StarredFiles;
