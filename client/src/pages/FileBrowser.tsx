import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/file-browser/AppHeader";
import Sidebar from "@/components/file-browser/Sidebar";
import TabManager, { Tab } from "@/components/file-browser/TabManager";
import MyDriveContent from "@/components/file-browser/MyDriveContent";
import RecentContent from "@/components/file-browser/RecentContent";
import StarredContent from "@/components/file-browser/StarredContent";
import SharedContent from "@/components/file-browser/SharedContent";
import TrashContent from "@/components/file-browser/TrashContent";
import SettingsContent from "@/components/file-browser/SettingsContent";
import FilePreviewModal from "@/components/file-browser/FilePreviewModal";
import UploadModal from "@/components/file-browser/UploadModal";
import NewFolderModal from "@/components/file-browser/NewFolderModal";
import RenameModal from "@/components/file-browser/RenameModal";
import MoveModal from "@/components/file-browser/MoveModal";
import DeleteConfirmModal from "@/components/file-browser/DeleteConfirmModal";
import ContextMenu from "@/components/file-browser/ContextMenu";
import ConnectionError from "@/components/file-browser/ConnectionError";
import NotFound from "./not-found";
import { useToast } from "@/hooks/use-toast";
import { useBrowserHistory } from "@/hooks/use-browser-history";
import { 
  listFiles, 
  listFolders, 
  uploadFile, 
  getFilePreviewUrl, 
  createFolder, 
  renameFile, 
  moveFile, 
  moveToTrash, 
  toggleStar, 
  downloadFile, 
  downloadFiles,
  dropFiles
} from "@/lib/s3Service";
import { S3Object, Position, ViewMode, UploadStatus, S3Folder } from "../types";
import { Home, Clock, Star, Users, Trash2, Settings } from "lucide-react";

// Tab configuration
const TAB_CONFIG = {
  "my-drive": { label: "My BRMH Drive", icon: Home },
  "recent": { label: "Recent", icon: Clock },
  "starred": { label: "Starred", icon: Star },
  "shared": { label: "Shared with Me", icon: Users },
  "trash": { label: "Trash", icon: Trash2 },
  "settings": { label: "Settings", icon: Settings },
};

export interface FileBrowserProps {
  initialPrefix?: string;
}

const FileBrowser: React.FC<FileBrowserProps> = ({ initialPrefix = "" }) => {
  // Browser history management
  const {
    currentState,
    navigateToPath,
    navigateToTab,
    openPreview,
    openUploadModal,
    openNewFolderModal,
    openRenameModal,
    openMoveModal,
    openDeleteModal,
    updateSearchTerm,
    updateViewMode,
    updateSorting,
    updateFileTypeFilter,
    toggleSidebar,
    closePreview,
    closeUploadModal,
    closeNewFolderModal,
    closeRenameModal,
    closeMoveModal,
    closeDeleteModal,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useBrowserHistory();

  // Local state (not managed by history)
  const [files, setFiles] = useState<S3Object[]>([]);
  const [folders, setFolders] = useState<S3Object[]>([]);
  const [allFolders, setAllFolders] = useState<S3Folder[]>([]);
  const [selectedItem, setSelectedItem] = useState<S3Object | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: Position;
    item?: S3Object;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);
  
  // Tab management
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "my-drive",
      label: "My BRMH Drive",
      icon: Home,
      isActive: true
    }
  ]);
  
  // Track API errors for better error handling
  const [apiError, setApiError] = useState<{
    hasError: boolean;
    title: string;
    message: string;
    details: string;
  }>({
    hasError: false,
    title: "",
    message: "",
    details: ""
  });

  // Sync tab active state with history
  useEffect(() => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === currentState.activeTabId
    })));
  }, [currentState.activeTabId]);

  // Sync selected item with history
  useEffect(() => {
    if (currentState.selectedItemKey) {
      const allItems = [...files, ...folders];
      const found = allItems.find(item => item.key === currentState.selectedItemKey);
      setSelectedItem(found);
    } else {
      setSelectedItem(undefined);
    }
  }, [currentState.selectedItemKey, files, folders]);

  // Responsive sidebar behavior with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.innerWidth < 768 && !currentState.isSidebarCollapsed) {
          toggleSidebar(true, true);
        }
      }, 150); // Debounce resize events
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [currentState.isSidebarCollapsed, toggleSidebar]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sidebar toggle (Ctrl/Cmd + B)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar(!currentState.isSidebarCollapsed);
      }
      
      // Browser navigation (Alt + Left/Right)
      if (e.altKey && e.key === 'ArrowLeft' && canGoBack) {
        e.preventDefault();
        goBack();
      }
      if (e.altKey && e.key === 'ArrowRight' && canGoForward) {
        e.preventDefault();
        goForward();
      }
      
      // Escape key to close modals
      if (e.key === 'Escape') {
        if (currentState.isPreviewModalOpen) closePreview();
        if (currentState.isUploadModalOpen) closeUploadModal();
        if (currentState.isNewFolderModalOpen) closeNewFolderModal();
        if (currentState.isRenameModalOpen) closeRenameModal();
        if (currentState.isMoveModalOpen) closeMoveModal();
        if (currentState.isDeleteModalOpen) closeDeleteModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentState.isSidebarCollapsed,
    currentState.isPreviewModalOpen,
    currentState.isUploadModalOpen,
    currentState.isNewFolderModalOpen,
    currentState.isRenameModalOpen,
    currentState.isMoveModalOpen,
    currentState.isDeleteModalOpen,
    toggleSidebar,
    closePreview,
    closeUploadModal,
    closeNewFolderModal,
    closeRenameModal,
    closeMoveModal,
    closeDeleteModal,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  ]);
  
  // Dummy storage info - would be fetched from a real API
  const [storageInfo] = useState({
    used: 4.2 * 1024 * 1024 * 1024, // 4.2 GB
    total: 10 * 1024 * 1024 * 1024, // 10 GB
    percentage: 42,
  });



  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Tab handlers
  const handleTabOpen = (tabId: string) => {
    const existingTab = tabs.find(tab => tab.id === tabId);
    if (!existingTab) {
      const config = TAB_CONFIG[tabId as keyof typeof TAB_CONFIG];
      if (config) {
        const newTab: Tab = {
          id: tabId,
          label: config.label,
          icon: config.icon,
          isActive: false
        };
        setTabs(prev => [...prev, newTab]);
      }
    }
    navigateToTab(tabId);
  };

  const handleTabClick = (tabId: string) => {
    navigateToTab(tabId);
  };

  const handleTabClose = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // If we're closing the active tab, switch to the first remaining tab
    if (currentState.activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        const newActiveTab = remainingTabs[0];
        navigateToTab(newActiveTab.id, true);
        setTabs(prev => prev.map(tab => ({
          ...tab,
          isActive: tab.id === newActiveTab.id
        })));
      }
    }
  };

  // Helper to detect AWS S3 errors
  const isAwsS3Error = (error: Error): boolean => {
    const errorMsg = error.message || "";
    return (
      errorMsg.includes("InvalidAccessKeyId") || 
      errorMsg.includes("PermanentRedirect") ||
      errorMsg.includes("RequestTimeTooSkewed") ||
      errorMsg.includes("NoSuchBucket") ||
      errorMsg.includes("TLS certificate validation failed") ||
      errorMsg.includes("ERR_TLS_CERT_ALTNAME_INVALID") ||
      errorMsg.includes("region") || 
      errorMsg.includes("endpoint") ||
      errorMsg.includes("authorized")
    );
  };
  
  // Extract detailed error message from API error responses
  const extractDetailedError = (error: Error): string => {
    let errorMessage = error.message;
    let detailedError = "";
    
    try {
      // Try to parse the error message for detailed AWS errors
      if (errorMessage.includes("details")) {
        const match = errorMessage.match(/details:(.*?)(\.|$)/);
        if (match && match[1]) {
          detailedError = match[1].trim();
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    return detailedError || errorMessage;
  };

  // Fetch files and folders
  const fetchFiles = useCallback(async () => {
    try {
      console.log("Fetching files for path:", currentState.currentPath);
      setIsLoading(true);
      const result = await listFiles(currentState.currentPath);
      console.log("Files API response:", result);
      setFiles(result.files);
      setFolders(result.folders);
      
      // Reset API error if successful
      if (apiError.hasError) {
        setApiError({
          hasError: false,
          title: "",
          message: "",
          details: ""
        });
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      const detailedError = extractDetailedError(error as Error);
      
      // Check if this is an AWS S3 connection error
      if (isAwsS3Error(error as Error)) {
        setApiError({
          hasError: true,
          title: "AWS S3 Connection Error",
          message: "We're having trouble connecting to your S3 bucket. This could be due to invalid credentials, bucket name, or region configuration.",
          details: detailedError
        });
      } else {
        toast({
          title: "Error loading files",
          description: detailedError,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentState.currentPath, toast, apiError.hasError]);

  // Fetch all folders for sidebar and move modal
  const fetchAllFolders = useCallback(async () => {
    try {
      const result = await listFolders();
      setAllFolders(result.folders);
      
      // Reset API error if successful
      if (apiError.hasError) {
        setApiError({
          hasError: false,
          title: "",
          message: "",
          details: ""
        });
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      const detailedError = extractDetailedError(error as Error);
      
      // Check if this is an AWS S3 connection error
      if (isAwsS3Error(error as Error)) {
        setApiError({
          hasError: true,
          title: "AWS S3 Connection Error",
          message: "We're having trouble connecting to your S3 bucket. This could be due to invalid credentials, bucket name, or region configuration.",
          details: detailedError
        });
      } else {
        toast({
          title: "Error loading folders",
          description: detailedError,
          variant: "destructive",
        });
      }
    }
  }, [toast, apiError.hasError]);

  // Initial load
  useEffect(() => {
    fetchFiles();
    fetchAllFolders();
  }, [fetchFiles, fetchAllFolders]);

  // Fetch files whenever currentPath changes
  useEffect(() => {
    console.log("currentPath changed, fetching files for:", currentState.currentPath);
    fetchFiles();
  }, [currentState.currentPath, fetchFiles]);
  
  // Extract unique file types from files for filtering
  useEffect(() => {
    if (files.length > 0) {
      // Extract file extensions from file names and file types
      const uniqueTypes = new Set<string>();
      
      files.forEach(file => {
        // Extract from type
        if (file.type && file.type !== "Unknown") {
          uniqueTypes.add(file.type.toLowerCase());
        }
        
        // Extract from file extension
        const name = file.name || file.key;
        const extension = name.split('.').pop()?.toLowerCase();
        if (extension && extension !== name) {
          uniqueTypes.add(extension);
        }
      });
      
      // Convert Set to Array and sort
      const typeArray = Array.from(uniqueTypes).sort();
      setAvailableFileTypes(typeArray);
      
      // Reset selected file type if it's no longer available
      if (currentState.selectedFileType !== 'all' && !uniqueTypes.has(currentState.selectedFileType)) {
        updateFileTypeFilter('all', true);
      }
    } else {
      setAvailableFileTypes([]);
      updateFileTypeFilter('all', true);
    }
  }, [files, currentState.selectedFileType, updateFileTypeFilter]);

  // Filter files by search term and file type
  const filteredFiles = files.filter(
    (file) => {
      // First apply search term filter
      const matchesSearch = file.name?.toLowerCase().includes(currentState.searchTerm.toLowerCase()) ||
        file.key.toLowerCase().includes(currentState.searchTerm.toLowerCase());
      
      // Then apply file type filter if needed
      if (currentState.selectedFileType === 'all') {
        return matchesSearch;
      }
      
      // Check file type
      if (file.type && file.type.toLowerCase() === currentState.selectedFileType) {
        return matchesSearch;
      }
      
      // Check file extension
      const fileName = file.name || file.key;
      const extension = fileName.split('.').pop()?.toLowerCase();
      return matchesSearch && extension === currentState.selectedFileType;
    }
  );

  const filteredFolders = folders.filter(
    (folder) =>
      folder.name?.toLowerCase().includes(currentState.searchTerm.toLowerCase()) ||
      folder.key.toLowerCase().includes(currentState.searchTerm.toLowerCase())
  );

  // Sort files and folders
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let aValue: any = a.name || a.key.split("/").pop() || a.key;
    let bValue: any = b.name || b.key.split("/").pop() || b.key;
    
    if (currentState.sortBy === "name") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else if (currentState.sortBy === "size") {
      aValue = a.size || 0;
      bValue = b.size || 0;
    } else if (currentState.sortBy === "lastModified") {
      aValue = new Date(a.lastModified || 0).getTime();
      bValue = new Date(b.lastModified || 0).getTime();
    } else if (currentState.sortBy === "type") {
      aValue = a.type || "";
      bValue = b.type || "";
    }
    
    const comparison = currentState.sortDirection === "asc" ? 1 : -1;
    return aValue < bValue ? -comparison : aValue > bValue ? comparison : 0;
  });

  const sortedFolders = [...filteredFolders].sort((a, b) => {
    const aName = a.name || a.key.split("/").pop() || a.key;
    const bName = b.name || b.key.split("/").pop() || b.key;
    
    return currentState.sortDirection === "asc"
      ? aName.localeCompare(bName)
      : bName.localeCompare(aName);
  });

  // Handle sort
  const handleSort = (column: string) => {
    if (currentState.sortBy === column) {
      updateSorting(column, currentState.sortDirection === "asc" ? "desc" : "asc");
    } else {
      updateSorting(column, "asc");
    }
  };

  // Handle file type filter change
  const handleFileTypeChange = (type: string) => {
    updateFileTypeFilter(type);
  };

  // Navigate to folder
  const handleFolderClick = (folder: S3Object) => {
    const path = folder.key;
    console.log("Navigating to folder:", path);
    
    // Check if path ends with a slash, add one if not
    const formattedPath = path.endsWith('/') ? path : `${path}/`;
    console.log("Formatted path with trailing slash:", formattedPath);
    
    // Use browser history navigation
    navigateToPath(formattedPath);
  };

  // Navigate to path
  const handleNavigate = (path: string) => {
    // Make sure path has a trailing slash if it's not empty, for consistent folder navigation
    const formattedPath = path ? (path.endsWith('/') ? path : `${path}/`) : path;
    console.log("Navigating via breadcrumbs to path:", formattedPath);
    
    // Use browser history navigation
    navigateToPath(formattedPath);
  };

  // Preview file
  const handleFilePreview = async (file: S3Object) => {
    try {
      setSelectedItem(file);
      openPreview(file.key);
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

  // Upload files
  const handleUploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Create upload statuses
    const newUploads: UploadStatus[] = files.map((file) => ({
      file,
      progress: 0,
      status: "pending",
      key: currentState.currentPath ? `${currentState.currentPath}${file.name}` : file.name,
    }));

    setUploads(newUploads);

    // Upload each file
    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      
      try {
        newUploads[i].status = "uploading";
        setUploads([...newUploads]);

        await uploadFile(upload.file, upload.key, (progress) => {
          newUploads[i].progress = progress;
          setUploads([...newUploads]);
        });

        newUploads[i].status = "complete";
        newUploads[i].progress = 100;
        setUploads([...newUploads]);
      } catch (error) {
        newUploads[i].status = "error";
        newUploads[i].error = (error as Error).message;
        setUploads([...newUploads]);
        
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${upload.file.name}: ${(error as Error).message}`,
          variant: "destructive",
        });
      }
    }

    // Refresh file list after uploads
    await fetchFiles();

    // Show success toast if any files were uploaded successfully
    const successCount = newUploads.filter(u => u.status === "complete").length;
    if (successCount > 0) {
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`,
      });
      
      // After a short delay, clear the uploads array and close the modal
      setTimeout(() => {
        closeUploadModal();
        // Clear uploads after a short delay to ensure the modal closes properly
        setTimeout(() => {
          setUploads([]);
        }, 300);
      }, 500);
    }
  };

  // Create new folder
  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder(currentState.currentPath, name);
      await fetchFiles();
      await fetchAllFolders();
      
      // Close the new folder modal after successful creation
      closeNewFolderModal();
      
      toast({
        title: "Success",
        description: `Folder "${name}" created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create folder: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Rename file or folder
  const handleRename = async (newName: string) => {
    if (!selectedItem) return;
    
    try {
      await renameFile(selectedItem.key, newName);
      await fetchFiles();
      
      // Close the rename modal after successful rename
      closeRenameModal();
      
      toast({
        title: "Success",
        description: `Item renamed successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to rename item: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Move file or folder
  const handleMove = async (destinationPath: string) => {
    if (!selectedItem) return;
    
    try {
      await moveFile(selectedItem.key, destinationPath);
      await fetchFiles();
      
      // Close the move modal after successful move
      closeMoveModal();
      
      toast({
        title: "Success",
        description: `Item moved successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to move item: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Delete file or folder (move to trash)
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      await moveToTrash(selectedItem.key);
      await fetchFiles();
      
      // Close the delete confirmation modal
      closeDeleteModal();
      
      toast({
        title: "Success",
        description: `Item moved to trash`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete item: ${(error as Error).message}`,
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

  // Star/unstar file
  const handleToggleStar = async () => {
    if (!selectedItem) return;
    
    try {
      const isCurrentlyStarred = starredItems.has(selectedItem.key);
      await toggleStar(selectedItem.key, !isCurrentlyStarred);
      
      // Update local state
      const newStarredItems = new Set(starredItems);
      if (isCurrentlyStarred) {
        newStarredItems.delete(selectedItem.key);
      } else {
        newStarredItems.add(selectedItem.key);
      }
      setStarredItems(newStarredItems);
      
      toast({
        title: "Success",
        description: isCurrentlyStarred ? "Item removed from starred" : "Item added to starred",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${starredItems.has(selectedItem.key) ? "unstar" : "star"} item: ${(error as Error).message}`,
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

  // Context menu action handlers
  const handleContextMenuAction = (action: string, item: S3Object) => {
    closeContextMenu();
    
    switch (action) {
      case 'preview':
        handleFilePreview(item);
        break;
      case 'download':
        handleDownload();
        break;
      case 'rename':
        openRenameModal(item.key);
        break;
      case 'move':
        openMoveModal(item.key);
        break;
      case 'delete':
        openDeleteModal(item.key);
        break;
      case 'star':
        handleToggleStar();
        break;
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const handleFileClick = (file: S3Object) => {
    handleFilePreview(file);
  };
  
  // Drag and drop handlers
  const handleFileDrop = async (sourceKeys: string[], destinationPath: string) => {
    if (sourceKeys.length === 0) return;
    
    try {
      setIsLoading(true);
      const result = await dropFiles(sourceKeys, destinationPath);
      
      // Refresh the file list after the drop
      await fetchFiles();
      
      // Show success toast if files were moved successfully
      if (result.success) {
        toast({
          title: "Files Moved",
          description: `Successfully moved ${result.results.length} file${result.results.length > 1 ? 's' : ''}`,
        });
      } else if (result.errors.length > 0) {
        // Show error toast if there were any errors
        toast({
          title: "Some Files Failed to Move",
          description: `${result.results.length} file(s) moved, ${result.errors.length} file(s) failed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error Moving Files",
        description: `Failed to move files: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there are files and folders to display
  const hasContent = sortedFiles.length > 0 || sortedFolders.length > 0;
  
  // If we have a critical API error, show a ConnectionError component
  if (apiError.hasError) {
    return (
      <ConnectionError 
        title={apiError.title}
        message={apiError.message}
        errorDetails={apiError.details}
        onRetry={() => {
          // Reset API error state and retry fetching data
          setApiError({
            hasError: false,
            title: "",
            message: "",
            details: ""
          });
          fetchFiles();
          fetchAllFolders();
        }}
        onConfigHelp={() => {
          // Display a configuration help toast with troubleshooting information
          toast({
            title: "AWS S3 Configuration Guide",
            description: "Check that your AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, and AWS_REGION environment variables are set correctly.",
            variant: "default",
            duration: 10000,
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white layout-stable">
      <AppHeader 
        onSearchChange={updateSearchTerm}
        onUploadClick={openUploadModal}
      />
      <div className="pt-16">
        <div className="flex">
          <Sidebar 
            folders={allFolders}
            storageInfo={storageInfo}
            onNewClick={openUploadModal}
            onTabOpen={handleTabOpen}
            activeTabId={currentState.activeTabId}
            isCollapsed={currentState.isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
          <main className={`flex-1 min-h-[calc(100vh-64px)] bg-white main-content-responsive ${
            currentState.isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}>
            {/* Tab Manager */}
            <TabManager
              tabs={tabs}
              activeTabId={currentState.activeTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
            />
            
            {/* Tab Content */}
            <div className="flex-1">
              {currentState.activeTabId === "my-drive" && (
                <MyDriveContent
                  files={sortedFiles}
                  folders={sortedFolders}
                  currentPath={currentState.currentPath}
                  viewMode={currentState.viewMode}
                  sortBy={currentState.sortBy}
                  sortDirection={currentState.sortDirection}

                  isLoading={isLoading}
                  hasContent={hasContent}
                  onViewModeChange={updateViewMode}
                  onSort={handleSort}

                  onFileClick={handleFileClick}
                  onFolderClick={handleFolderClick}
                  onFileContextMenu={handleContextMenu}
                  onFolderContextMenu={handleContextMenu}
                  onNavigate={handleNavigate}
                  onDrop={handleFileDrop}
                  onUploadClick={openUploadModal}
                  onNewFolderClick={openNewFolderModal}
                />
              )}
              
              {currentState.activeTabId === "recent" && <RecentContent />}
              {currentState.activeTabId === "starred" && <StarredContent />}
              {currentState.activeTabId === "shared" && <SharedContent />}
              {currentState.activeTabId === "trash" && <TrashContent />}
              {currentState.activeTabId === "settings" && <SettingsContent />}
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <FilePreviewModal
        isOpen={currentState.isPreviewModalOpen}
        onClose={closePreview}
        file={selectedItem}
        previewUrl={previewUrl}
        onDownload={handleDownload}
        onStar={handleToggleStar}
        onRename={() => {
          closePreview();
          openRenameModal(selectedItem?.key || '', true);
        }}
        onMove={() => {
          closePreview();
          openMoveModal(selectedItem?.key || '', true);
        }}
        onDelete={() => {
          closePreview();
          openDeleteModal(selectedItem?.key || '', true);
        }}
        isStarred={selectedItem ? starredItems.has(selectedItem.key) : false}
      />

      <UploadModal
        isOpen={currentState.isUploadModalOpen}
        onClose={closeUploadModal}
        onUpload={handleUploadFiles}
        currentPath={currentState.currentPath}
        uploads={uploads}
      />

      <NewFolderModal
        isOpen={currentState.isNewFolderModalOpen}
        onClose={closeNewFolderModal}
        onCreateFolder={handleCreateFolder}
        currentPath={currentState.currentPath}
      />

      <RenameModal
        isOpen={currentState.isRenameModalOpen}
        onClose={closeRenameModal}
        onRename={handleRename}
        item={selectedItem}
      />

      <MoveModal
        isOpen={currentState.isMoveModalOpen}
        onClose={closeMoveModal}
        onMove={handleMove}
        item={selectedItem}
        folders={allFolders}
      />

      <DeleteConfirmModal
        isOpen={currentState.isDeleteModalOpen}
        onClose={closeDeleteModal}
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
          openRenameModal(contextMenu.item?.key || '');
        }}
        onMove={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          openMoveModal(contextMenu.item?.key || '');
        }}
        onStar={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          handleToggleStar();
        }}
        onDelete={() => {
          closeContextMenu();
          setSelectedItem(contextMenu.item);
          openDeleteModal(contextMenu.item?.key || '');
        }}
        isStarred={contextMenu.item ? starredItems.has(contextMenu.item.key) : false}
      />
    </div>
  );
};

export default FileBrowser;
