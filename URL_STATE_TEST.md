# URL State Test Instructions

## Test Steps to Verify Refresh & Navigation Fixes

### 1. Basic Navigation Test
1. Open the app in your browser
2. Navigate to a folder (e.g., click on a folder)
3. Check the URL - it should show something like: `/?path=folder-name/&tab=my-drive`
4. Refresh the page (F5)
5. **Expected**: You should stay in the same folder, not go back to home

### 2. View Mode Persistence Test
1. Navigate to a folder
2. Change view mode to "list" or "column"
3. Check the URL - it should include `&view=list` or `&view=column`
4. Refresh the page
5. **Expected**: View mode should remain the same

### 3. File Tab Persistence Test
1. Navigate to a folder
2. Open a file in a preview tab
3. Check the URL - it should include `&file=filename.pdf&tabs=my-drive,file-filename.pdf`
4. Refresh the page
5. **Expected**: File tab should remain open and active

### 4. Multiple Tabs Test
1. Open multiple file tabs
2. Check the URL - it should include all tabs in the `tabs` parameter
3. Refresh the page
4. **Expected**: All tabs should be restored

### 5. Browser Back/Forward Test
1. Navigate to folder A
2. Navigate to folder B
3. Open a file tab
4. Press browser back button
5. **Expected**: Should return to folder A, not home

### 6. Direct URL Access Test
1. Copy a URL with state (e.g., `/?path=folder/&view=list&file=document.pdf`)
2. Open in a new tab
3. **Expected**: Should load directly to that state

## Debug Information

The app now includes console logging to help debug state restoration:

- 🔍 **URL Initialization**: Shows the URL being parsed
- 📋 **Parsed State**: Shows what state was extracted from URL
- ✅ **URL State Used**: Shows when URL state is being used
- 💾 **localStorage State Used**: Shows when localStorage fallback is used
- 🔄 **Fallback State Used**: Shows when minimal fallback state is used

## Common Issues and Solutions

### Issue: Still going to home on refresh
**Check**: 
- Look for console logs showing which state is being used
- Verify URL contains the expected parameters
- Check if `path` parameter is present in URL

### Issue: Tabs not persisting
**Check**:
- Verify `tabs` parameter in URL
- Check if `file` parameter is present for active file tab
- Look for console logs about tab restoration

### Issue: View mode not persisting
**Check**:
- Verify `view` parameter in URL
- Check if view mode is being set correctly in state

## URL Parameter Reference

- `path`: Current folder path
- `tab`: Active tab ID
- `view`: View mode (grid/list/column)
- `file`: Active file tab key
- `tabs`: Comma-separated list of open tab IDs
- `search`: Search term
- `sortBy`: Sort column
- `sortDir`: Sort direction (asc/desc)
- `fileType`: Selected file type filter
- `sidebar`: Sidebar state (collapsed)

## Example URLs

```
# Basic folder navigation
/?path=documents/&tab=my-drive

# With view mode
/?path=documents/&tab=my-drive&view=list

# With file tab open
/?path=documents/&tab=file-document.pdf&file=document.pdf&tabs=my-drive,file-document.pdf

# Complete state
/?path=documents/&tab=file-document.pdf&view=column&file=document.pdf&tabs=my-drive,file-document.pdf&search=report&sortBy=name&sortDir=asc
```
