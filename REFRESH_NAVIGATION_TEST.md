# BRMH Drive - Refresh & Navigation Test Plan

## Test Cases for Refresh + Navigation Fixes

### A) Remove defaults that overwrite state

**Test 1: URL State Preservation**
- Navigate to a deep folder path (e.g., `/folder1/subfolder/`)
- Change view mode to "list"
- Open a file in a preview tab
- Refresh the page (F5)
- **Expected**: Stay on the same folder path, view mode, and active file tab
- **Actual**: ✅ Should work with new URL-based state management

**Test 2: No Default Redirects**
- Navigate directly to a deep URL (e.g., `/?path=folder1/subfolder/&view=list&file=document.pdf`)
- **Expected**: Load directly to that state without redirecting to home
- **Actual**: ✅ Should work with new URL parsing logic

### B) URL as Single Source of Truth

**Test 3: URL Updates on State Changes**
- Navigate to a folder
- Change view mode
- Open a file tab
- **Expected**: URL should update with all state parameters
- **Actual**: ✅ Should work with debounced URL updates

**Test 4: Debounced URL Updates**
- Rapidly change view modes or navigate between folders
- **Expected**: URL should update with 150ms debounce, not on every change
- **Actual**: ✅ Should work with debounced URL updates

### C) Hydrate from URL on Load/Refresh

**Test 5: Full State Restoration**
- Navigate to a folder
- Change view to "column"
- Open multiple file tabs
- Refresh the page
- **Expected**: All state restored exactly as it was
- **Actual**: ✅ Should work with URL state hydration

**Test 6: Column View State**
- Navigate to a folder in column view
- Expand some folders in the tree
- Refresh the page
- **Expected**: Column view should restore with same folder expanded
- **Actual**: ✅ Should work with URL state hydration

### D) Back/Forward Correctness

**Test 7: Browser Navigation**
- Navigate to folder A
- Navigate to folder B
- Open a file tab
- Press browser back button
- **Expected**: Return to folder A instantly, no jump to home
- **Actual**: ✅ Should work with popstate handling

**Test 8: Forward Navigation**
- Navigate through several states
- Use browser back button
- Use browser forward button
- **Expected**: Restore exact previous state
- **Actual**: ✅ Should work with popstate handling

### E) Prevent Hard Reloads

**Test 9: Client Routing**
- Click on internal links
- **Expected**: No full page reloads, smooth client-side navigation
- **Actual**: ✅ Should work with click event prevention

**Test 10: Dev HMR**
- Make changes to code during development
- **Expected**: HMR should not trigger hard refresh, router state intact
- **Actual**: ✅ Should work with proper HMR configuration

### F) Persistence Fallback

**Test 11: Empty URL Fallback**
- Clear browser URL completely
- Refresh the page
- **Expected**: Restore last state from localStorage
- **Actual**: ✅ Should work with localStorage fallback

### G) Server/Hosting Rewrites

**Test 12: SPA Routing**
- Navigate to a deep URL directly
- **Expected**: Server should serve index.html, not 404
- **Actual**: ✅ Should work with vercel.json SPA rewrite

## Implementation Status

### ✅ Completed
- [x] Removed defaults that overwrite state
- [x] URL as single source of truth with debouncing
- [x] Tab persistence in URL
- [x] localStorage fallback for empty URLs
- [x] SPA rewrite configuration (vercel.json)
- [x] Client routing prevention
- [x] Browser back/forward handling
- [x] State hydration from URL

### 🔄 In Progress
- [ ] Column view tree expansion state
- [ ] File metadata restoration for tabs

### 📋 To Test
- [ ] All test cases above
- [ ] Edge cases with special characters in paths
- [ ] Performance with many open tabs
- [ ] Error handling for invalid URLs

## Technical Implementation Details

### Key Changes Made:

1. **Browser History Hook (`use-browser-history.ts`)**:
   - Removed default state that overwrites URL values
   - Added tab state management (`openTabs`, `activeFileTab`)
   - Implemented 150ms debounced URL updates
   - Added localStorage fallback for empty URLs
   - Enhanced popstate handling for back/forward

2. **FileBrowser Component**:
   - Synced tab management with browser history state
   - Added file preview tab restoration from URL
   - Prevented hard reloads with click event handling
   - Removed initialPrefix prop dependency

3. **Configuration**:
   - Updated `vercel.json` for SPA routing
   - Added `historyApiFallback` to `vite.config.ts`
   - Removed default navigation to home

### URL Structure:
```
/?path=folder/subfolder/&view=list&tab=my-drive&file=document.pdf&tabs=my-drive,file-document.pdf&sortBy=name&sortDir=asc
```

### State Persistence:
- Primary: URL parameters
- Fallback: localStorage (`brmh:lastState`)
- No defaults that override user state

## Next Steps

1. Test all scenarios manually
2. Add error handling for malformed URLs
3. Optimize performance for large numbers of tabs
4. Add unit tests for state management
5. Consider adding URL compression for very long states
