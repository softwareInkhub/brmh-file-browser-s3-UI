# BRMH Drive Codebase Cleanup Plan

## 🎯 Objective
Remove unnecessary code and dependencies while preserving all current functionality and UI behavior.

## 📋 Inventory & Safelist

### ✅ Required Core Components (KEEP)
- **File Browser Components:**
  - `FileBrowser.tsx` - Main file browser page
  - `AppHeader.tsx` - Header with search and actions
  - `Sidebar.tsx` - Navigation sidebar
  - `TabManager.tsx` - Tab management
  - `MyDriveContent.tsx` - Main content area
  - `FileGrid.tsx` - Grid view
  - `FileList.tsx` - List view
  - `ColumnView.tsx` - Column view
  - `FilePreviewTab.tsx` - File preview
  - `ContextMenu.tsx` - Right-click context menu
  - `UploadModal.tsx` - File upload modal
  - `NewFolderModal.tsx` - Create folder modal
  - `RenameModal.tsx` - Rename modal
  - `MoveModal.tsx` - Move modal
  - `DeleteConfirmModal.tsx` - Delete confirmation
  - `ShareFileModal.tsx` - Share file modal
  - `FileEditor.tsx` - Text file editor
  - `ConnectionError.tsx` - Error handling

- **Navigation Components:**
  - `RecentContent.tsx`
  - `StarredContent.tsx`
  - `SharedContent.tsx`
  - `TrashContent.tsx`
  - `SettingsContent.tsx`

- **UI Components (USED):**
  - `button.tsx` - Used extensively
  - `dialog.tsx` - Used in modals
  - `input.tsx` - Used in forms
  - `label.tsx` - Used in forms
  - `progress.tsx` - Used in upload
  - `select.tsx` - Used in share modal
  - `table.tsx` - Used in list view
  - `toast.tsx` - Used for notifications
  - `toaster.tsx` - Used for notifications
  - `scroll-area.tsx` - Used in move modal
  - `sidebar.tsx` - Used for navigation
  - `sheet.tsx` - Used by sidebar
  - `skeleton.tsx` - Used by sidebar
  - `separator.tsx` - Used by sidebar
  - `tooltip.tsx` - Used by sidebar
  - `card.tsx` - Used in pages
  - `badge.tsx` - Used in shared files

- **Hooks (USED):**
  - `use-toast.ts` - Used for notifications
  - `use-browser-history.ts` - Used in FileBrowser

- **Core Files:**
  - `App.tsx` - Main app component
  - `main.tsx` - Entry point
  - `index.css` - Styles
  - All S3 service files
  - All type definitions

## 🗑️ Unused Dependencies (REMOVE)

### Frontend Dependencies:
- `@hookform/resolvers` - Not used
- `framer-motion` - Not used
- `react-icons` - Not used
- `react-player` - Not used
- `react-helmet` - Not used
- `@jridgewell/trace-mapping` - Not used
- `zod-validation-error` - Not used

### Backend Dependencies:
- `connect-pg-simple` - Not used
- `express-session` - Not used
- `memorystore` - Not used
- `passport` - Not used
- `passport-local` - Not used
- `ws` - Not used

### Dev Dependencies:
- `@types/connect-pg-simple` - Not used
- `@types/express-session` - Not used
- `@types/passport` - Not used
- `@types/passport-local` - Not used
- `@types/ws` - Not used
- `@types/react-helmet` - Not used
- `autoprefixer` - Not needed
- `postcss` - Not needed

## 🗑️ Unused UI Components (REMOVE)
- `accordion.tsx`
- `alert.tsx`
- `alert-dialog.tsx`
- `aspect-ratio.tsx`
- `avatar.tsx`
- `breadcrumb.tsx`
- `calendar.tsx`
- `carousel.tsx`
- `chart.tsx`
- `checkbox.tsx`
- `collapsible.tsx`
- `command.tsx`
- `context-menu.tsx`
- `drawer.tsx`
- `dropdown-menu.tsx`
- `form.tsx`
- `hover-card.tsx`
- `input-otp.tsx`
- `menubar.tsx`
- `navigation-menu.tsx`
- `pagination.tsx`
- `popover.tsx`
- `radio-group.tsx`
- `resizable.tsx`
- `slider.tsx`
- `switch.tsx`
- `tabs.tsx`
- `textarea.tsx`
- `toggle.tsx`
- `toggle-group.tsx`

## 🗑️ Unused Files (REMOVE)
- `use-mobile.tsx` - Not imported anywhere
- `ActionBar.tsx` - Not used
- `UnifiedNavBar.tsx` - Not used
- `ColumnViewPreview.tsx` - Not used
- `ColumnViewBreadcrumb.tsx` - Not used
- `BrowserNavigation.tsx` - Not used
- `Breadcrumbs.tsx` - Not used
- `FilePreviewModal.tsx` - Not used
- `Toast.tsx` - Not used

## 🔧 Missing Dependencies (ADD)
- `nanoid` - Required by server/vite.ts

## 📊 Expected Results
- **Bundle Size Reduction:** ~30-40% smaller
- **Dependency Count:** ~15 fewer packages
- **File Count:** ~40 fewer files
- **Performance:** Same or better
- **Functionality:** Identical behavior

## ✅ Acceptance Criteria
1. App compiles with zero errors
2. Dev server runs cleanly
3. All current features work exactly the same
4. No UI differences
5. Bundle size is smaller or equal
6. Performance is same or better
