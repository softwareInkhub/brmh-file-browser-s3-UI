import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

export interface BrowserHistoryState {
  // Navigation state
  currentPath: string;
  activeTabId: string;
  searchTerm: string;
  viewMode: 'grid' | 'list' | 'column';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  selectedFileType: string;
  
  // Tab state (new)
  openTabs: string[]; // Array of tab IDs in order
  activeFileTab?: string; // Currently active file preview tab
  
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
  
  // Tab management methods (new)
  openFileTab: (fileKey: string, replace?: boolean) => void;
  closeFileTab: (fileKey: string, replace?: boolean) => void;
  reorderTabs: (fromIndex: number, toIndex: number, replace?: boolean) => void;
  openNavigationTab: (tabId: string, replace?: boolean) => void;
  
  // State update methods
  updateSearchTerm: (term: string, replace?: boolean) => void;
  updateViewMode: (mode: 'grid' | 'list' | 'column', replace?: boolean) => void;
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
  updateHistory: (newState: Partial<BrowserHistoryState>, replace?: boolean) => void;
}

// Parse URL parameters and restore state
const parseUrlState = (url: string): Partial<BrowserHistoryState> => {
  try {
    const urlObj = new URL(url, window.location.origin);
    const params = new URLSearchParams(urlObj.search);
    
    const state: Partial<BrowserHistoryState> = {};
    
    // Always parse path if it exists
    if (params.has('path')) {
      state.currentPath = params.get('path') || '';
    }
    if (params.has('tab')) {
      state.activeTabId = params.get('tab') || 'my-drive';
    }
    if (params.has('search')) {
      state.searchTerm = params.get('search') || '';
    }
    if (params.has('view')) {
      state.viewMode = (params.get('view') as 'grid' | 'list' | 'column') || 'grid';
    }
    if (params.has('sortBy')) {
      state.sortBy = params.get('sortBy') || 'name';
    }
    if (params.has('sortDir')) {
      state.sortDirection = (params.get('sortDir') as 'asc' | 'desc') || 'asc';
    }
    if (params.has('fileType')) {
      state.selectedFileType = params.get('fileType') || 'all';
    }
    if (params.has('sidebar')) {
      state.isSidebarCollapsed = params.get('sidebar') === 'collapsed';
    }
    if (params.has('file')) {
      state.activeFileTab = params.get('file') || undefined;
    }
    if (params.has('tabs')) {
      const tabsParam = params.get('tabs');
      if (tabsParam) {
        state.openTabs = tabsParam.split(',').map(tab => decodeURIComponent(tab));
      }
    }
    if (params.has('scroll')) {
      state.scrollPosition = parseInt(params.get('scroll') || '0', 10);
    }
    
    return state;
  } catch (error) {
    console.error('Error parsing URL state:', error);
    return {};
  }
};

// Get initial state from URL first, then localStorage fallback
const getInitialState = (): BrowserHistoryState => {
  // First, try to parse from URL
  if (typeof window !== 'undefined') {
    console.log('🔍 Initializing state from URL:', window.location.href);
    const urlState = parseUrlState(window.location.href);
    console.log('📋 Parsed URL state:', urlState);
    
    // If we have URL state, use it
    if (Object.keys(urlState).length > 0) {
      const initialState: BrowserHistoryState = {
        currentPath: urlState.currentPath || '',
        activeTabId: urlState.activeTabId || 'my-drive',
        searchTerm: urlState.searchTerm || '',
        viewMode: urlState.viewMode || 'grid',
        sortBy: urlState.sortBy || 'name',
        sortDirection: urlState.sortDirection || 'asc',
        selectedFileType: urlState.selectedFileType || 'all',
        openTabs: urlState.openTabs || ['my-drive'],
        activeFileTab: urlState.activeFileTab,
        isSidebarCollapsed: urlState.isSidebarCollapsed || false,
        isPreviewModalOpen: false,
        isUploadModalOpen: false,
        isNewFolderModalOpen: false,
        isRenameModalOpen: false,
        isMoveModalOpen: false,
        isDeleteModalOpen: false,
        scrollPosition: urlState.scrollPosition || 0,
      };
      console.log('✅ Using URL state:', initialState);
      return initialState;
    }
    
    // If no URL state, try localStorage
    try {
      const saved = localStorage.getItem('brmh:lastState');
      if (saved) {
        const parsed = JSON.parse(saved);
        const localStorageState: BrowserHistoryState = {
          currentPath: parsed.currentPath || '',
          activeTabId: parsed.activeTabId || 'my-drive',
          searchTerm: parsed.searchTerm || '',
          viewMode: parsed.viewMode || 'grid',
          sortBy: parsed.sortBy || 'name',
          sortDirection: parsed.sortDirection || 'asc',
          selectedFileType: parsed.selectedFileType || 'all',
          openTabs: parsed.openTabs || ['my-drive'],
          activeFileTab: parsed.activeFileTab,
          isSidebarCollapsed: parsed.isSidebarCollapsed || false,
          isPreviewModalOpen: false,
          isUploadModalOpen: false,
          isNewFolderModalOpen: false,
          isRenameModalOpen: false,
          isMoveModalOpen: false,
          isDeleteModalOpen: false,
          scrollPosition: 0,
        };
        console.log('💾 Using localStorage state:', localStorageState);
        return localStorageState;
      }
    } catch (error) {
      console.warn('Failed to restore state from localStorage:', error);
    }
  }
  
  // Minimal fallback state
  const fallbackState: BrowserHistoryState = {
    currentPath: '',
    activeTabId: 'my-drive',
    searchTerm: '',
    viewMode: 'grid',
    sortBy: 'name',
    sortDirection: 'asc',
    selectedFileType: 'all',
    openTabs: ['my-drive'],
    isSidebarCollapsed: false,
    isPreviewModalOpen: false,
    isUploadModalOpen: false,
    isNewFolderModalOpen: false,
    isRenameModalOpen: false,
    isMoveModalOpen: false,
    isDeleteModalOpen: false,
    scrollPosition: 0,
  };
  console.log('🔄 Using fallback state:', fallbackState);
  return fallbackState;
};

export function useBrowserHistory(): UseBrowserHistoryReturn {
  const [location, setLocation] = useLocation();
  const [currentState, setCurrentState] = useState<BrowserHistoryState>(getInitialState);
  const isNavigatingRef = useRef(false);
  const scrollPositionRef = useRef(0);
  const isInitializedRef = useRef(false);
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Parse URL parameters and restore state (for runtime updates)
  const parseUrlState = useCallback((url: string): Partial<BrowserHistoryState> => {
    try {
      const urlObj = new URL(url, window.location.origin);
      const params = new URLSearchParams(urlObj.search);
      
      const state: Partial<BrowserHistoryState> = {};
      
      // Only set values if they exist in URL (don't override with defaults)
      if (params.has('path')) {
        state.currentPath = params.get('path') || '';
      }
      if (params.has('tab')) {
        state.activeTabId = params.get('tab') || 'my-drive';
      }
      if (params.has('search')) {
        state.searchTerm = params.get('search') || '';
      }
      if (params.has('view')) {
        state.viewMode = (params.get('view') as 'grid' | 'list' | 'column') || 'grid';
      }
      if (params.has('sortBy')) {
        state.sortBy = params.get('sortBy') || 'name';
      }
      if (params.has('sortDir')) {
        state.sortDirection = (params.get('sortDir') as 'asc' | 'desc') || 'asc';
      }
      if (params.has('fileType')) {
        state.selectedFileType = params.get('fileType') || 'all';
      }
      if (params.has('sidebar')) {
        state.isSidebarCollapsed = params.get('sidebar') === 'collapsed';
      }
      if (params.has('file')) {
        state.activeFileTab = params.get('file') || undefined;
      }
      if (params.has('tabs')) {
        const tabsParam = params.get('tabs');
        if (tabsParam) {
          state.openTabs = tabsParam.split(',').map(tab => decodeURIComponent(tab));
        }
      }
      if (params.has('scroll')) {
        state.scrollPosition = parseInt(params.get('scroll') || '0', 10);
      }
      
      return state;
    } catch (error) {
      console.error('Error parsing URL state:', error);
      return {};
    }
  }, []);

  // Initialize state from URL on mount (only for runtime updates, not initial load)
  useEffect(() => {
    if (!isInitializedRef.current) {
      console.log('🚀 Initializing browser history hook');
      console.log('📊 Initial state:', currentState);
      // The initial state is already set by getInitialState(), so we just mark as initialized
      isInitializedRef.current = true;
    }
  }, [currentState]);

  // Build URL from state with debouncing
  const buildUrl = useCallback((state: BrowserHistoryState): string => {
    const params = new URLSearchParams();
    
    // Always include path for consistency
    params.set('path', state.currentPath || '');
    
    // Always include tab for consistency
    params.set('tab', state.activeTabId || 'my-drive');
    
    // Only include non-default values
    if (state.searchTerm) params.set('search', state.searchTerm);
    if (state.viewMode !== 'grid') params.set('view', state.viewMode);
    if (state.sortBy !== 'name') params.set('sortBy', state.sortBy);
    if (state.sortDirection !== 'asc') params.set('sortDir', state.sortDirection);
    if (state.selectedFileType !== 'all') params.set('fileType', state.selectedFileType);
    if (state.isSidebarCollapsed) params.set('sidebar', 'collapsed');
    if (state.activeFileTab) params.set('file', state.activeFileTab);
    if (state.openTabs && state.openTabs.length > 0) {
      const tabsParam = state.openTabs.map(tab => encodeURIComponent(tab)).join(',');
      params.set('tabs', tabsParam);
    }
    if (state.scrollPosition > 0) params.set('scroll', state.scrollPosition.toString());
    
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  }, []);

    // Debounced URL update
  const debouncedUpdateUrl = useCallback((newState: BrowserHistoryState, replace = false) => {
    // Clear existing timeout
    if (urlUpdateTimeoutRef.current) {
      clearTimeout(urlUpdateTimeoutRef.current);
    }
    
    // Set new timeout for debounced update
    urlUpdateTimeoutRef.current = setTimeout(() => {
      const newUrl = buildUrl(newState);
      console.log('🌐 Updating URL:', newUrl, 'State:', newState);
      
      isNavigatingRef.current = true;
      
      if (replace) {
        window.history.replaceState(newState, '', newUrl);
      } else {
        window.history.pushState(newState, '', newUrl);
      }
      
      setLocation(newUrl);
      
      // Save to localStorage as fallback
      try {
        localStorage.setItem('brmh:lastState', JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to save state to localStorage:', error);
      }
      
      // Reset navigation flag after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }, 150); // 150ms debounce
  }, [buildUrl, setLocation]);

  // Update browser history
  const updateHistory = useCallback((newState: Partial<BrowserHistoryState>, replace = false) => {
    const updatedState = { ...currentState, ...newState };
    console.log('🔄 Updating history:', { newState, updatedState, replace });
    setCurrentState(updatedState);
    debouncedUpdateUrl(updatedState, replace);
  }, [currentState, debouncedUpdateUrl]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('🔄 PopState event:', event.state);
      
      if (event.state) {
        // Restore state from browser history
        setCurrentState(event.state);
      } else {
        // Parse state from URL (fallback for direct navigation)
        const urlState = parseUrlState(window.location.href);
        console.log('📋 Parsed URL state from popstate:', urlState);
        
        // Ensure we have at least 'my-drive' tab
        const restoredState = { ...currentState, ...urlState };
        if (!restoredState.openTabs || restoredState.openTabs.length === 0) {
          restoredState.openTabs = ['my-drive'];
        }
        
        // If activeFileTab is set, make sure it's in openTabs
        if (restoredState.activeFileTab && !restoredState.openTabs.includes(`file-${restoredState.activeFileTab}`)) {
          restoredState.openTabs = [...restoredState.openTabs, `file-${restoredState.activeFileTab}`];
        }
        
        setCurrentState(restoredState);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrlState, currentState]);

  // Handle URL changes from external navigation
  useEffect(() => {
    if (!isNavigatingRef.current && isInitializedRef.current) {
      const urlState = parseUrlState(location);
      console.log('🌐 URL changed, parsed state:', urlState);
      
      // Ensure we have at least 'my-drive' tab
      const updatedState = { ...currentState, ...urlState };
      if (!updatedState.openTabs || updatedState.openTabs.length === 0) {
        updatedState.openTabs = ['my-drive'];
      }
      
      // If activeFileTab is set, make sure it's in openTabs
      if (updatedState.activeFileTab && !updatedState.openTabs.includes(`file-${updatedState.activeFileTab}`)) {
        updatedState.openTabs = [...updatedState.openTabs, `file-${updatedState.activeFileTab}`];
      }
      
      console.log('🔄 Updating state from URL change:', updatedState);
      setCurrentState(updatedState);
    }
  }, [location, parseUrlState, currentState, isInitializedRef]);

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

  // Tab management methods
  const openFileTab = useCallback((fileKey: string, replace = false) => {
    const tabId = `file-${fileKey}`;
    const updatedState = { ...currentState };
    
    // Add tab if not already present
    if (!updatedState.openTabs.includes(tabId)) {
      updatedState.openTabs = [...updatedState.openTabs, tabId];
    }
    
    // Set as active tab
    updatedState.activeTabId = tabId;
    updatedState.activeFileTab = fileKey;
    
    setCurrentState(updatedState);
    debouncedUpdateUrl(updatedState, replace);
  }, [currentState, debouncedUpdateUrl]);

  const closeFileTab = useCallback((fileKey: string, replace = false) => {
    const tabId = `file-${fileKey}`;
    const updatedState = { ...currentState };
    
    // Remove tab from open tabs
    updatedState.openTabs = updatedState.openTabs.filter(tab => tab !== tabId);
    
    // If closing the active tab, switch to previous tab
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
      
      // Update activeFileTab based on new active tab
      if (updatedState.activeTabId.startsWith('file-')) {
        updatedState.activeFileTab = updatedState.activeTabId.replace('file-', '');
      } else {
        updatedState.activeFileTab = undefined;
      }
    }
    
    setCurrentState(updatedState);
    debouncedUpdateUrl(updatedState, replace);
  }, [currentState, debouncedUpdateUrl]);

  const reorderTabs = useCallback((fromIndex: number, toIndex: number, replace = false) => {
    const updatedState = { ...currentState };
    const newOpenTabs = [...updatedState.openTabs];
    const [movedTab] = newOpenTabs.splice(fromIndex, 1);
    newOpenTabs.splice(toIndex, 0, movedTab);
    updatedState.openTabs = newOpenTabs;
    
    setCurrentState(updatedState);
    debouncedUpdateUrl(updatedState, replace);
  }, [currentState, debouncedUpdateUrl]);

  const openNavigationTab = useCallback((tabId: string, replace = false) => {
    const updatedState = { ...currentState };
    
    // Add tab if not already present
    if (!updatedState.openTabs.includes(tabId)) {
      updatedState.openTabs = [...updatedState.openTabs, tabId];
    }
    
    // Set as active tab
    updatedState.activeTabId = tabId;
    
    setCurrentState(updatedState);
    debouncedUpdateUrl(updatedState, replace);
  }, [currentState, debouncedUpdateUrl]);

  // State update methods
  const updateSearchTerm = useCallback((term: string, replace = false) => {
    updateHistory({ searchTerm: term }, replace);
  }, [updateHistory]);

  const updateViewMode = useCallback((mode: 'grid' | 'list' | 'column', replace = false) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
  };
}
