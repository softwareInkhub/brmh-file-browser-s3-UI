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
import FilePreviewTab from "@/components/file-browser/FilePreviewTab";
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
import { Home, Clock, Star, Users, Trash2, Settings, FileText } from "lucide-react";

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
  // Props removed - state is now managed through URL
}

const FileBrowser: React.FC<FileBrowserProps> = () => {
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
    openFileTab,
    closeFileTab,
    reorderTabs,
    openNavigationTab,
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
    updateHistory,
  } = useBrowserHistory();

  // Local state (not managed by history)
  const [files, setFiles] = useState<S3Object[]>([]);
  const [folders, setFolders] = useState<S3Object[]>([]);
  const [allFolders, setAllFolders] = useState<S3Folder[]>([]);
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
  
  // Tab management - sync with browser history
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [filePreviewTabs, setFilePreviewTabs] = useState<Map<string, S3Object>>(new Map());
  const [filePreviewUrls, setFilePreviewUrls] = useState<Map<string, string>>(new Map());

  // Open file in a new tab
  const openFileInTab = async (file: S3Object) => {
    const tabId = `file-${file.key}`;
    
    // Check if file is already open in a tab
    if (filePreviewTabs.has(tabId)) {
      // Switch to existing tab
      handleTabClick(tabId);
      return;
    }

    // Add new file preview tab
    setFilePreviewTabs(prev => new Map(prev).set(tabId, file));
    
    // Generate preview URL
    try {
      const preview = await getFilePreviewUrl(file.key);
      setFilePreviewUrls(prev => new Map(prev).set(tabId, preview.url));
    } catch (error) {
      console.error("Error getting preview URL:", error);
    }

    // Use browser history to open the tab
    openFileTab(file.key);
  };

  // Close file preview tab
  const closeFilePreviewTab = (tabId: string) => {
    // Extract file key from tab ID
    const fileKey = tabId.replace('file-', '');
    
    // Remove from file preview tabs
    setFilePreviewTabs(prev => {
      const newMap = new Map(prev);
      newMap.delete(tabId);
      return newMap;
    });

    // Remove from preview URLs
    setFilePreviewUrls(prev => {
      const newMap = new Map(prev);
      newMap.delete(tabId);
      return newMap;
    });

    // Use browser history to close the tab
    closeFileTab(fileKey);
  };
  
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

  // Sync tabs with browser history state
  useEffect(() => {
    console.log('🔄 Syncing tabs with browser history state:', {
      openTabs: currentState.openTabs,
      activeTabId: currentState.activeTabId
    });
    
    const newTabs: Tab[] = [];
    
    // Add navigation tabs first
    const navigationTabs = ['my-drive', 'recent', 'starred', 'shared', 'trash', 'settings'];
    navigationTabs.forEach(tabId => {
      if (currentState.openTabs.includes(tabId)) {
        const config = TAB_CONFIG[tabId as keyof typeof TAB_CONFIG];
        if (config) {
          newTabs.push({
            id: tabId,
            label: config.label,
            icon: config.icon,
            isActive: tabId === currentState.activeTabId,
            type: 'navigation'
          });
        }
      }
    });
    
    // Add file preview tabs
    currentState.openTabs.forEach(tabId => {
      if (tabId.startsWith('file-')) {
        const file = filePreviewTabs.get(tabId);
        if (file) {
          const fileName = file.key.split("/").pop() || file.key;
          newTabs.push({
            id: tabId,
            label: fileName,
            icon: FileText,
            isActive: tabId === currentState.activeTabId,
            type: 'file-preview',
            fileKey: file.key
          });
        }
      }
    });
    
    console.log('📋 Created tabs:', newTabs);
    setTabs(newTabs);
  }, [currentState.openTabs, currentState.activeTabId, filePreviewTabs]);

  // Sync selected item with history
  useEffect(() => {
    if (currentState.selectedItemKey) {
      const allItems = [...files, ...folders];
      const found = allItems.find(item => item.key === currentState.selectedItemKey);
      // setSelectedItem(found); // This state variable was removed
    } else {
      // setSelectedItem(undefined); // This state variable was removed
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
    console.log('🔄 Opening tab:', tabId);
    
    // Check if tab already exists in browser history state
    const existingTabInHistory = currentState.openTabs.includes(tabId);
    
    if (!existingTabInHistory) {
      // Add tab to browser history state and make it active
      openNavigationTab(tabId, false);
    } else {
      // Tab exists, just navigate to it
      navigateToTab(tabId);
    }
  };

  // Tab click handler
  const handleTabClick = (tabId: string) => {
    // Update tab active state
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));

    // Navigate to tab
    navigateToTab(tabId);
  };

  // Tab close handler
  const handleTabClose = (tabId: string) => {
    console.log('🔄 Closing tab:', tabId);
    
    // Check if it's a file preview tab
    if (tabId.startsWith('file-')) {
      closeFilePreviewTab(tabId);
    } else {
      // For navigation tabs, prevent closing essential tabs like "my-drive"
      if (tabId === 'my-drive') {
        // Don't allow closing the main drive tab
        return;
      }
      
      // Remove the tab from browser history state
      const updatedState = { ...currentState };
      updatedState.openTabs = updatedState.openTabs.filter(tab => tab !== tabId);
      
      // If the closed tab was active, switch to the previous tab
      if (updatedState.activeTabId === tabId) {
        const currentIndex = currentState.openTabs.indexOf(tabId);
        if (currentIndex > 0) {
          // Switch to the tab before the closed one
          updatedState.activeTabId = currentState.openTabs[currentIndex - 1];
        } else if (updatedState.openTabs.length > 0) {
          // Switch to the next tab or first available
          updatedState.activeTabId = currentState.openTabs[currentIndex + 1] || updatedState.openTabs[0];
        } else {
          // No tabs left, switch to my-drive
          updatedState.activeTabId = 'my-drive';
          updatedState.openTabs = ['my-drive'];
        }
      }
      
      // Update browser history state using the hook's methods
      updateHistory({
        openTabs: updatedState.openTabs,
        activeTabId: updatedState.activeTabId
      }, true); // Use replace to update URL immediately
    }
  };

  // Tab reorder handler
  const handleTabReorder = (fromIndex: number, toIndex: number) => {
    reorderTabs(fromIndex, toIndex);
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

  // Restore file preview tabs from browser history
  useEffect(() => {
    if (currentState.openTabs && currentState.openTabs.length > 0) {
      // Find file preview tabs that need to be restored
      const fileTabs = currentState.openTabs.filter(tabId => tabId.startsWith('file-'));
      
      fileTabs.forEach(tabId => {
        const fileKey = tabId.replace('file-', '');
        if (!filePreviewTabs.has(tabId)) {
          // We need to restore this file tab
          // For now, we'll create a placeholder S3Object
          // In a real implementation, you might want to fetch the file metadata
          const placeholderFile: S3Object = {
            key: fileKey,
            name: fileKey.split("/").pop() || fileKey,
            size: 0,
            type: "Unknown"
          };
          
          setFilePreviewTabs(prev => new Map(prev).set(tabId, placeholderFile));
          
          // Generate preview URL
          getFilePreviewUrl(fileKey).then(preview => {
            setFilePreviewUrls(prev => new Map(prev).set(tabId, preview.url));
          }).catch(error => {
            console.error("Error getting preview URL for restored tab:", error);
          });
        }
      });
    }
  }, [currentState.openTabs, filePreviewTabs]);

  // Prevent hard reloads and ensure client routing
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        e.preventDefault();
        const url = new URL(link.href);
        setLocation(url.pathname + url.search);
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [setLocation]);

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
  }).map(folder => ({
    ...folder,
    path: folder.key
  } as S3Folder));

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

  // File click handler - now opens in tab
  const handleFileClick = (file: S3Object) => {
    openFileInTab(file);
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
    // Get the item from context menu, selected item, or active file tab
    let item = contextMenu.item;
    
    if (!item && currentState.selectedItemKey) {
      // Try to find the item from the selected item key
      const allItems = [...files, ...folders];
      item = allItems.find(item => item.key === currentState.selectedItemKey);
    }
    
    if (!item && currentState.activeTabId?.startsWith('file-')) {
      // Try to get the item from the active file tab
      item = filePreviewTabs.get(currentState.activeTabId);
    }
    
    if (!item) {
      toast({
        title: "Error",
        description: "No item selected for renaming",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await renameFile(item.key, newName);
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
    // Get the item from context menu, selected item, or active file tab
    let item = contextMenu.item;
    
    if (!item && currentState.selectedItemKey) {
      // Try to find the item from the selected item key
      const allItems = [...files, ...folders];
      item = allItems.find(item => item.key === currentState.selectedItemKey);
    }
    
    if (!item && currentState.activeTabId?.startsWith('file-')) {
      // Try to get the item from the active file tab
      item = filePreviewTabs.get(currentState.activeTabId);
    }
    
    if (!item) {
      toast({
        title: "Error",
        description: "No item selected for moving",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await moveFile(item.key, destinationPath);
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
    // Get the item from context menu, selected item, or active file tab
    let item = contextMenu.item;
    
    if (!item && currentState.selectedItemKey) {
      // Try to find the item from the selected item key
      const allItems = [...files, ...folders];
      item = allItems.find(item => item.key === currentState.selectedItemKey);
    }
    
    if (!item && currentState.activeTabId?.startsWith('file-')) {
      // Try to get the item from the active file tab
      item = filePreviewTabs.get(currentState.activeTabId);
    }
    
    if (!item) {
      toast({
        title: "Error",
        description: "No item selected for deletion",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await moveToTrash(item.key);
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
    // Get the item from context menu, selected item, or active file tab
    let item = contextMenu.item;
    
    if (!item && currentState.selectedItemKey) {
      // Try to find the item from the selected item key
      const allItems = [...files, ...folders];
      item = allItems.find(item => item.key === currentState.selectedItemKey);
    }
    
    if (!item && currentState.activeTabId?.startsWith('file-')) {
      // Try to get the item from the active file tab
      item = filePreviewTabs.get(currentState.activeTabId);
    }
    
    if (!item) {
      toast({
        title: "Error",
        description: "No item selected for download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      downloadFile(item.key, item.name);
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
    // Get the item from context menu, selected item, or active file tab
    let item = contextMenu.item;
    
    if (!item && currentState.selectedItemKey) {
      // Try to find the item from the selected item key
      const allItems = [...files, ...folders];
      item = allItems.find(item => item.key === currentState.selectedItemKey);
    }
    
    if (!item && currentState.activeTabId?.startsWith('file-')) {
      // Try to get the item from the active file tab
      item = filePreviewTabs.get(currentState.activeTabId);
    }
    
    if (!item) {
      toast({
        title: "Error",
        description: "No item selected for starring",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const isCurrentlyStarred = starredItems.has(item.key);
      await toggleStar(item.key, !isCurrentlyStarred);
      
      // Update local state
      const newStarredItems = new Set(starredItems);
      if (isCurrentlyStarred) {
        newStarredItems.delete(item.key);
      } else {
        newStarredItems.add(item.key);
      }
      setStarredItems(newStarredItems);
      
      toast({
        title: "Success",
        description: isCurrentlyStarred ? "Item removed from starred" : "Item added to starred",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${starredItems.has(item.key) ? "unstar" : "star"} item: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  // Context menu handlers
  const handleContextMenu = (item: S3Object, e: React.MouseEvent) => {
    e.preventDefault();
    // setSelectedItem(item); // This state variable was removed
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
        openFileInTab(item);
        break;
      case 'download':
        downloadFile(item.key, item.name);
        break;
      case 'rename':
        openRenameModal(item.key, true);
        break;
      case 'move':
        openMoveModal(item.key, true);
        break;
      case 'delete':
        openDeleteModal(item.key, true);
        break;
      case 'star':
        handleToggleStarForItem(item);
        break;
    }
  };

  // Handle toggle star for a specific item
  const handleToggleStarForItem = async (item: S3Object) => {
    try {
      const isCurrentlyStarred = starredItems.has(item.key);
      await toggleStar(item.key, !isCurrentlyStarred);
      
      // Update local state
      const newStarredItems = new Set(starredItems);
      if (isCurrentlyStarred) {
        newStarredItems.delete(item.key);
      } else {
        newStarredItems.add(item.key);
      }
      setStarredItems(newStarredItems);
      
      toast({
        title: "Success",
        description: isCurrentlyStarred ? "Item removed from starred" : "Item added to starred",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${starredItems.has(item.key) ? "unstar" : "star"} item: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
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
          <main className={`flex-1 min-h-[calc(100vh-64px)] bg-white main-content-responsive main-content-fixed ${
            currentState.isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'
          }`}>
            {/* Tab Manager */}
            <TabManager
              tabs={tabs}
              activeTabId={currentState.activeTabId}
              onTabClick={handleTabClick}
              onTabClose={handleTabClose}
              onTabReorder={handleTabReorder}
            />
            
            {/* Tab Content */}
            <div className="flex-1">
              {(() => {
                console.log('🎯 Rendering tab content for:', currentState.activeTabId);
                console.log('📋 Current state:', {
                  activeTabId: currentState.activeTabId,
                  openTabs: currentState.openTabs,
                  tabsLength: tabs.length
                });
                return null;
              })()}
              
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
                  onFolderRename={(folder) => openRenameModal(folder.key, true)}
                  onFolderDelete={(folder) => openDeleteModal(folder.key, true)}
                  onFolderMove={(folder) => openMoveModal(folder.key, true)}
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
              
              {/* Fallback content when no tab content matches */}
              {!currentState.activeTabId.startsWith('file-') && 
               currentState.activeTabId !== "my-drive" &&
               currentState.activeTabId !== "recent" &&
               currentState.activeTabId !== "starred" &&
               currentState.activeTabId !== "shared" &&
               currentState.activeTabId !== "trash" &&
               currentState.activeTabId !== "settings" && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Tab Not Found</h3>
                    <p className="text-gray-500">The tab "{currentState.activeTabId}" could not be loaded.</p>
                  </div>
                </div>
              )}
              

              
              {/* File Preview Tabs */}
              {currentState.activeTabId.startsWith('file-') && (() => {
                const file = filePreviewTabs.get(currentState.activeTabId);
                const previewUrl = filePreviewUrls.get(currentState.activeTabId);
                
                if (!file) return null;
                
                return (
                  <FilePreviewTab
                    file={file}
                    previewUrl={previewUrl}
                    onDownload={() => downloadFile(file.key, file.name)}
                    onStar={() => handleToggleStar()}
                    onRename={() => {
                      openRenameModal(file.key, true);
                    }}
                    onDelete={() => {
                      openDeleteModal(file.key, true);
                    }}
                    isStarred={starredItems.has(file.key)}
                  />
                );
              })()}
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
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
        item={(() => {
          // Get the item from context menu, selected item, or active file tab
          let item = contextMenu.item;
          
          if (!item && currentState.selectedItemKey) {
            // Try to find the item from the selected item key
            const allItems = [...files, ...folders];
            item = allItems.find(item => item.key === currentState.selectedItemKey);
          }
          
          if (!item && currentState.activeTabId?.startsWith('file-')) {
            // Try to get the item from the active file tab
            item = filePreviewTabs.get(currentState.activeTabId);
          }
          
          return item;
        })()}
      />

      <MoveModal
        isOpen={currentState.isMoveModalOpen}
        onClose={closeMoveModal}
        onMove={handleMove}
        item={(() => {
          // Get the item from context menu, selected item, or active file tab
          let item = contextMenu.item;
          
          if (!item && currentState.selectedItemKey) {
            // Try to find the item from the selected item key
            const allItems = [...files, ...folders];
            item = allItems.find(item => item.key === currentState.selectedItemKey);
          }
          
          if (!item && currentState.activeTabId?.startsWith('file-')) {
            // Try to get the item from the active file tab
            item = filePreviewTabs.get(currentState.activeTabId);
          }
          
          return item;
        })()}
        folders={allFolders}
      />

      <DeleteConfirmModal
        isOpen={currentState.isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDelete}
        item={(() => {
          // Get the item from context menu, selected item, or active file tab
          let item = contextMenu.item;
          
          if (!item && currentState.selectedItemKey) {
            // Try to find the item from the selected item key
            const allItems = [...files, ...folders];
            item = allItems.find(item => item.key === currentState.selectedItemKey);
          }
          
          if (!item && currentState.activeTabId?.startsWith('file-')) {
            // Try to get the item from the active file tab
            item = filePreviewTabs.get(currentState.activeTabId);
          }
          
          return item;
        })()}
      />

      <ContextMenu
        position={contextMenu.position}
        isVisible={contextMenu.visible}
        onClose={closeContextMenu}
        item={contextMenu.item}
        onPreview={() => {
          if (contextMenu.item) {
            openFileInTab(contextMenu.item);
          }
        }}
        onDownload={() => {
          if (contextMenu.item) {
            downloadFile(contextMenu.item.key, contextMenu.item.name);
          }
        }}
        onRename={() => {
          if (contextMenu.item) {
            openRenameModal(contextMenu.item.key, true);
          }
        }}
        onMove={() => {
          if (contextMenu.item) {
            openMoveModal(contextMenu.item.key, true);
          }
        }}
        onStar={() => {
          if (contextMenu.item) {
            handleToggleStarForItem(contextMenu.item);
          }
        }}
        onDelete={() => {
          if (contextMenu.item) {
            openDeleteModal(contextMenu.item.key, true);
          }
        }}
        isStarred={contextMenu.item ? starredItems.has(contextMenu.item.key) : false}
      />
    </div>
  );
};

export default FileBrowser;
