import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

export interface BrowserHistoryState {
  // Navigation state
  currentPath: string;
  activeTabId: string;
  searchTerm: string;
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  selectedFileType: string;
  
  // UI state
  isSidebarCollapsed: boolean;
  isPreviewModalOpen: boolean;
  isUploadModalOpen: boolean;
  isNewFolderModalOpen: boolean;
  isRenameModalOpen: boolean;
  isMoveModalOpen: boolean;
  isDeleteModalOpen: boolean;
  
  // Selection state
  selectedItemKey?: string;
  
  // Scroll position (for better UX)
  scrollPosition: number;
}

export interface UseBrowserHistoryReturn {
  // Current state
  currentState: BrowserHistoryState;
  
  // Navigation methods
  navigateToPath: (path: string, replace?: boolean) => void;
  navigateToTab: (tabId: string, replace?: boolean) => void;
  openPreview: (fileKey: string, replace?: boolean) => void;
  openUploadModal: (replace?: boolean) => void;
  openNewFolderModal: (replace?: boolean) => void;
  openRenameModal: (fileKey: string, replace?: boolean) => void;
  openMoveModal: (fileKey: string, replace?: boolean) => void;
  openDeleteModal: (fileKey: string, replace?: boolean) => void;
  
  // State update methods
  updateSearchTerm: (term: string, replace?: boolean) => void;
  updateViewMode: (mode: 'grid' | 'list', replace?: boolean) => void;
  updateSorting: (sortBy: string, sortDirection: 'asc' | 'desc', replace?: boolean) => void;
  updateFileTypeFilter: (type: string, replace?: boolean) => void;
  toggleSidebar: (collapsed: boolean, replace?: boolean) => void;
  
  // Modal close methods
  closePreview: (replace?: boolean) => void;
  closeUploadModal: (replace?: boolean) => void;
  closeNewFolderModal: (replace?: boolean) => void;
  closeRenameModal: (replace?: boolean) => void;
  closeMoveModal: (replace?: boolean) => void;
  closeDeleteModal: (replace?: boolean) => void;
  
  // Utility methods
  goBack: () => void;
  goForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
}

const DEFAULT_STATE: BrowserHistoryState = {
  currentPath: '',
  activeTabId: 'my-drive',
  searchTerm: '',
  viewMode: 'grid',
  sortBy: 'name',
  sortDirection: 'asc',
  selectedFileType: 'all',
  isSidebarCollapsed: false,
  isPreviewModalOpen: false,
  isUploadModalOpen: false,
  isNewFolderModalOpen: false,
  isRenameModalOpen: false,
  isMoveModalOpen: false,
  isDeleteModalOpen: false,
  scrollPosition: 0,
};

export function useBrowserHistory(): UseBrowserHistoryReturn {
  const [location, setLocation] = useLocation();
  const [currentState, setCurrentState] = useState<BrowserHistoryState>(DEFAULT_STATE);
  const isNavigatingRef = useRef(false);
  const scrollPositionRef = useRef(0);
  const isInitializedRef = useRef(false);

  // Parse URL parameters and restore state
  const parseUrlState = useCallback((url: string): Partial<BrowserHistoryState> => {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(urlObj.search);
      
      return {
        currentPath: params.get('prefix') || '',
        activeTabId: params.get('tab') || 'my-drive',
        searchTerm: params.get('search') || '',
        viewMode: (params.get('view') as 'grid' | 'list') || 'grid',
        sortBy: params.get('sortBy') || 'name',
        sortDirection: (params.get('sortDir') as 'asc' | 'desc') || 'asc',
        selectedFileType: params.get('fileType') || 'all',
        isSidebarCollapsed: params.get('sidebar') === 'collapsed',
        isPreviewModalOpen: params.get('preview') === 'true',
        isUploadModalOpen: params.get('upload') === 'true',
        isNewFolderModalOpen: params.get('newFolder') === 'true',
        isRenameModalOpen: params.get('rename') === 'true',
        isMoveModalOpen: params.get('move') === 'true',
        isDeleteModalOpen: params.get('delete') === 'true',
        selectedItemKey: params.get('selected') || undefined,
        scrollPosition: parseInt(params.get('scroll') || '0', 10),
      };
    } catch (error) {
      console.error('Error parsing URL state:', error);
      return {};
    }
  }, []);

  // Initialize state from URL on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      const urlState = parseUrlState(window.location.href);
      setCurrentState(prev => ({ ...prev, ...urlState }));
      isInitializedRef.current = true;
    }
  }, [parseUrlState]);

  // Build URL from state
  const buildUrl = useCallback((state: BrowserHistoryState): string => {
    const params = new URLSearchParams();
    
    if (state.currentPath) params.set('prefix', state.currentPath);
    if (state.activeTabId !== 'my-drive') params.set('tab', state.activeTabId);
    if (state.searchTerm) params.set('search', state.searchTerm);
    if (state.viewMode !== 'grid') params.set('view', state.viewMode);
    if (state.sortBy !== 'name') params.set('sortBy', state.sortBy);
    if (state.sortDirection !== 'asc') params.set('sortDir', state.sortDirection);
    if (state.selectedFileType !== 'all') params.set('fileType', state.selectedFileType);
    if (state.isSidebarCollapsed) params.set('sidebar', 'collapsed');
    if (state.isPreviewModalOpen) params.set('preview', 'true');
    if (state.isUploadModalOpen) params.set('upload', 'true');
    if (state.isNewFolderModalOpen) params.set('newFolder', 'true');
    if (state.isRenameModalOpen) params.set('rename', 'true');
    if (state.isMoveModalOpen) params.set('move', 'true');
    if (state.isDeleteModalOpen) params.set('delete', 'true');
    if (state.selectedItemKey) params.set('selected', state.selectedItemKey);
    if (state.scrollPosition > 0) params.set('scroll', state.scrollPosition.toString());
    
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  }, []);

  // Update browser history
  const updateHistory = useCallback((newState: Partial<BrowserHistoryState>, replace = false) => {
    const updatedState = { ...currentState, ...newState };
    const newUrl = buildUrl(updatedState);
    
    isNavigatingRef.current = true;
    
    if (replace) {
      window.history.replaceState(updatedState, '', newUrl);
    } else {
      window.history.pushState(updatedState, '', newUrl);
    }
    
    setCurrentState(updatedState);
    setLocation(newUrl);
    
    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [currentState, buildUrl, setLocation]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        // Restore state from browser history
        setCurrentState(event.state);
      } else {
        // Parse state from URL (fallback for direct navigation)
        const urlState = parseUrlState(window.location.href);
        setCurrentState(prev => ({ ...prev, ...urlState }));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrlState]);

  // Handle URL changes from external navigation
  useEffect(() => {
    if (!isNavigatingRef.current) {
      const urlState = parseUrlState(location);
      setCurrentState(prev => ({ ...prev, ...urlState }));
    }
  }, [location, parseUrlState]);

  // Save scroll position before navigation
  useEffect(() => {
    const handleScroll = () => {
      scrollPositionRef.current = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after state change
  useEffect(() => {
    if (currentState.scrollPosition > 0) {
      window.scrollTo(0, currentState.scrollPosition);
    }
  }, [currentState.scrollPosition]);

  // Navigation methods
  const navigateToPath = useCallback((path: string, replace = false) => {
    updateHistory({ currentPath: path }, replace);
  }, [updateHistory]);

  const navigateToTab = useCallback((tabId: string, replace = false) => {
    updateHistory({ activeTabId: tabId }, replace);
  }, [updateHistory]);

  const openPreview = useCallback((fileKey: string, replace = false) => {
    updateHistory({ 
      isPreviewModalOpen: true, 
      selectedItemKey: fileKey 
    }, replace);
  }, [updateHistory]);

  const openUploadModal = useCallback((replace = false) => {
    updateHistory({ isUploadModalOpen: true }, replace);
  }, [updateHistory]);

  const openNewFolderModal = useCallback((replace = false) => {
    updateHistory({ isNewFolderModalOpen: true }, replace);
  }, [updateHistory]);

  const openRenameModal = useCallback((fileKey: string, replace = false) => {
    updateHistory({ 
      isRenameModalOpen: true, 
      selectedItemKey: fileKey 
    }, replace);
  }, [updateHistory]);

  const openMoveModal = useCallback((fileKey: string, replace = false) => {
    updateHistory({ 
      isMoveModalOpen: true, 
      selectedItemKey: fileKey 
    }, replace);
  }, [updateHistory]);

  const openDeleteModal = useCallback((fileKey: string, replace = false) => {
    updateHistory({ 
      isDeleteModalOpen: true, 
      selectedItemKey: fileKey 
    }, replace);
  }, [updateHistory]);

  // State update methods
  const updateSearchTerm = useCallback((term: string, replace = false) => {
    updateHistory({ searchTerm: term }, replace);
  }, [updateHistory]);

  const updateViewMode = useCallback((mode: 'grid' | 'list', replace = false) => {
    updateHistory({ viewMode: mode }, replace);
  }, [updateHistory]);

  const updateSorting = useCallback((sortBy: string, sortDirection: 'asc' | 'desc', replace = false) => {
    updateHistory({ sortBy, sortDirection }, replace);
  }, [updateHistory]);

  const updateFileTypeFilter = useCallback((type: string, replace = false) => {
    updateHistory({ selectedFileType: type }, replace);
  }, [updateHistory]);

  const toggleSidebar = useCallback((collapsed: boolean, replace = false) => {
    updateHistory({ isSidebarCollapsed: collapsed }, replace);
  }, [updateHistory]);

  // Modal close methods
  const closePreview = useCallback((replace = false) => {
    updateHistory({ 
      isPreviewModalOpen: false, 
      selectedItemKey: undefined 
    }, replace);
  }, [updateHistory]);

  const closeUploadModal = useCallback((replace = false) => {
    updateHistory({ isUploadModalOpen: false }, replace);
  }, [updateHistory]);

  const closeNewFolderModal = useCallback((replace = false) => {
    updateHistory({ isNewFolderModalOpen: false }, replace);
  }, [updateHistory]);

  const closeRenameModal = useCallback((replace = false) => {
    updateHistory({ 
      isRenameModalOpen: false, 
      selectedItemKey: undefined 
    }, replace);
  }, [updateHistory]);

  const closeMoveModal = useCallback((replace = false) => {
    updateHistory({ 
      isMoveModalOpen: false, 
      selectedItemKey: undefined 
    }, replace);
  }, [updateHistory]);

  const closeDeleteModal = useCallback((replace = false) => {
    updateHistory({ 
      isDeleteModalOpen: false, 
      selectedItemKey: undefined 
    }, replace);
  }, [updateHistory]);

  // Browser navigation methods
  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const goForward = useCallback(() => {
    window.history.forward();
  }, []);

  // Check if we can go back/forward
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Update navigation state
  useEffect(() => {
    setCanGoBack(window.history.length > 1);
    // For now, we'll set canGoForward to false as it requires more complex tracking
    setCanGoForward(false);
  }, [currentState]);

  return {
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
  };
}
