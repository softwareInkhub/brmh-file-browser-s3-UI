import { apiRequest } from "./queryClient";
import { S3Object, S3Folder, FilePreview, TreeNode } from "../types";

// Base API URL
const API_BASE = "/api";

// List files in a directory
export async function listFiles(prefix: string = ""): Promise<{
  files: S3Object[];
  folders: S3Object[];
  prefix: string;
}> {
  const response = await fetch(`${API_BASE}/files?prefix=${encodeURIComponent(prefix)}`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to list files: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to list files: ${errorText}`);
    }
  }
  return await response.json();
}

// Get file preview URL
export async function getFilePreviewUrl(key: string): Promise<FilePreview> {
  const response = await fetch(
    `${API_BASE}/files/preview?key=${encodeURIComponent(key)}`
  );
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await response.json();
      throw new Error(`Failed to get preview URL: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to get preview URL: ${errorText}`);
    }
  }
  const data = await response.json();
  return data;
}

// Upload file
export async function uploadFile(file: File, key: string, onProgress?: (progress: number) => void): Promise<S3Object> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("key", key);

  // Use XMLHttpRequest for progress tracking
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error("Invalid response format"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      });
      
      xhr.addEventListener("error", () => {
        reject(new Error("Network error occurred during upload"));
      });
      
      xhr.open("POST", `${API_BASE}/files`);
      xhr.send(formData);
    });
  } else {
    // Use fetch if no progress tracking needed
    const response = await fetch(`${API_BASE}/files`, {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      // Try to parse the error as JSON first for structured errors
      try {
        const errorData = await response.json();
        throw new Error(`Failed to upload file: ${errorData.error}. ${errorData.details || ''}`);
      } catch (e) {
        // If not JSON, use text response
        const errorText = await response.text();
        throw new Error(`Failed to upload file: ${errorText}`);
      }
    }
    
    return await response.json();
  }
}

// Delete file
export async function deleteFile(key: string): Promise<void> {
  await apiRequest("DELETE", `${API_BASE}/files?key=${encodeURIComponent(key)}`);
}

// Move file to trash
export async function moveToTrash(key: string): Promise<{
  originalKey: string;
  trashKey: string;
}> {
  const response = await apiRequest("POST", `${API_BASE}/files/trash`, { key });
  return await response.json();
}

// Restore file from trash
export async function restoreFromTrash(
  key: string,
  originalKey: string
): Promise<{
  trashKey: string;
  originalKey: string;
}> {
  const response = await apiRequest("POST", `${API_BASE}/files/trash/restore`, {
    key,
    originalKey,
  });
  return await response.json();
}

// Rename file
export async function renameFile(
  oldKey: string,
  newName: string
): Promise<{
  oldKey: string;
  newKey: string;
}> {
  const response = await apiRequest("POST", `${API_BASE}/files/rename`, {
    oldKey,
    newName,
  });
  return await response.json();
}

// Move file
export async function moveFile(
  sourceKey: string,
  destinationPath: string
): Promise<{
  sourceKey: string;
  destinationKey: string;
}> {
  const response = await apiRequest("POST", `${API_BASE}/files/move`, {
    sourceKey,
    destinationPath,
  });
  return await response.json();
}

// Create folder
export async function createFolder(
  path: string = "",
  name: string
): Promise<S3Folder> {
  const response = await apiRequest("POST", `${API_BASE}/files/folders`, {
    path,
    name,
  });
  return await response.json();
}

// List folders
export async function listFolders(): Promise<{
  folders: S3Folder[];
}> {
  const response = await fetch(`${API_BASE}/files/folders`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to list folders: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to list folders: ${errorText}`);
    }
  }
  return await response.json();
}

// Toggle star status
export async function toggleStar(
  key: string,
  star: boolean
): Promise<{
  key: string;
  starred: boolean;
}> {
  const response = await apiRequest("POST", `${API_BASE}/files/starred/toggle`, {
    key,
    star,
  });
  return await response.json();
}

// List starred files
export async function listStarredFiles(): Promise<{
  starredFiles: S3Object[];
}> {
  const response = await fetch(`${API_BASE}/files/starred`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to list starred files: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to list starred files: ${errorText}`);
    }
  }
  return await response.json();
}

// List trash files
export async function listTrashFiles(): Promise<{
  trashFiles: S3Object[];
}> {
  const response = await fetch(`${API_BASE}/files/trash`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to list trash files: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to list trash files: ${errorText}`);
    }
  }
  return await response.json();
}

// List recent files
export async function listRecentFiles(): Promise<{
  recentFiles: S3Object[];
}> {
  const response = await fetch(`${API_BASE}/files/recent`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to list recent files: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to list recent files: ${errorText}`);
    }
  }
  return await response.json();
}

// Generate download URL for file(s)
export function getDownloadUrl(keys: string[], zip: boolean = false): string {
  const params = new URLSearchParams();
  
  if (Array.isArray(keys)) {
    keys.forEach(key => params.append("keys", key));
  } else {
    params.append("keys", keys);
  }
  
  if (zip) {
    params.append("zip", "true");
  }
  
  return `${API_BASE}/files/download?${params.toString()}`;
}

// Download file
export function downloadFile(key: string, filename?: string): void {
  const downloadUrl = getDownloadUrl([key]);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename || key.split("/").pop() || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download multiple files as zip
export function downloadFiles(keys: string[]): void {
  if (keys.length === 0) return;
  
  if (keys.length === 1) {
    downloadFile(keys[0]);
    return;
  }
  
  const downloadUrl = getDownloadUrl(keys, true);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "download.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get the raw content of a text file for editing
 */
export async function getFileContent(key: string): Promise<{ content: string }> {
  const response = await fetch(`${API_BASE}/files/content?key=${encodeURIComponent(key)}`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to get file content: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to get file content: ${errorText}`);
    }
  }
  
  const data = await response.json();
  return data;
}

/**
 * Save edited file content back to S3
 */
export async function saveFileContent(key: string, content: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/files/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ key, content })
  });
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to save file content: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to save file content: ${errorText}`);
    }
  }
  
  const data = await response.json();
  return data;
}

/**
 * Move multiple files via drag and drop
 */
export async function dropFiles(
  sourceKeys: string[],
  destinationPath: string
): Promise<any> {
  const response = await fetch(`${API_BASE}/files/drop`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sourceKeys, destinationPath }),
  });
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to move files: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to move files: ${errorText}`);
    }
  }
  
  return await response.json();
}

/**
 * Checks the health of the S3 connection and returns diagnostic information
 * @returns Diagnostic information about the S3 connection
 */
export async function checkS3Health(): Promise<{
  status: 'healthy' | 'error';
  message: string;
  diagnostics: any;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/health/s3`);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return {
          status: 'error',
          message: errorData.message || 'Failed to check S3 connection',
          diagnostics: errorData.diagnostics || {},
          error: errorData.error
        };
      } catch (e) {
        const errorText = await response.text();
        return {
          status: 'error',
          message: 'Failed to check S3 connection status',
          diagnostics: {
            errorType: 'network',
            errorDetails: errorText
          },
          error: errorText
        };
      }
    }
    
    const data = await response.json();
    return {
      status: data.status,
      message: data.message,
      diagnostics: data.diagnostics,
      error: data.error
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Failed to check S3 connection status',
      diagnostics: {
        errorType: 'client',
        errorDetails: (error as Error).message
      },
      error: (error as Error).message
    };
  }
}

/**
 * Generate a share link for a file
 * @param key The key of the file to share
 * @param expiresIn The number of seconds until the share link expires (optional, default: 3600)
 * @returns Information about the generated share link
 */
export async function shareFile(key: string, expiresIn?: number): Promise<{
  shareId: string;
  url: string;
  expiresAt: Date;
  fileKey: string;
  fileName: string;
}> {
  const response = await fetch(`${API_BASE}/files/share`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, expiresIn }),
  });
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to share file: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to share file: ${errorText}`);
    }
  }
  
  const data = await response.json();
  
  // Convert string dates to Date objects
  if (typeof data.expiresAt === 'string') {
    data.expiresAt = new Date(data.expiresAt);
  }
  
  return data;
}

/**
 * Get information about a shared file
 * @param shareId The ID of the share to retrieve
 * @returns Information about the shared file
 */
export async function getSharedFile(shareId: string): Promise<{
  shareId: string;
  fileKey: string;
  fileName: string;
  url: string;
  expiresAt: Date;
  createdAt: Date;
  contentType?: string;
  size?: number;
  lastModified?: Date;
}> {
  const response = await fetch(`${API_BASE}/files/shared/${encodeURIComponent(shareId)}`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to get shared file: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to get shared file: ${errorText}`);
    }
  }
  
  const data = await response.json();
  
  // Convert string dates to Date objects
  if (typeof data.expiresAt === 'string') {
    data.expiresAt = new Date(data.expiresAt);
  }
  if (typeof data.createdAt === 'string') {
    data.createdAt = new Date(data.createdAt);
  }
  if (typeof data.lastModified === 'string') {
    data.lastModified = new Date(data.lastModified);
  }
  
  return data;
}

/**
 * List all shared files
 * @returns List of currently shared files
 */
export async function listSharedFiles(): Promise<{
  sharedFiles: Array<{
    shareId: string;
    fileKey: string;
    fileName: string;
    expiresAt: Date;
    createdAt: Date;
  }>;
}> {
  const response = await fetch(`${API_BASE}/files/shared`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to list shared files: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to list shared files: ${errorText}`);
    }
  }
  
  const data = await response.json();
  
  // Convert string dates to Date objects
  if (data.sharedFiles && Array.isArray(data.sharedFiles)) {
    data.sharedFiles = data.sharedFiles.map((item: any) => ({
      ...item,
      expiresAt: typeof item.expiresAt === 'string' ? new Date(item.expiresAt) : item.expiresAt,
      createdAt: typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
    }));
  }
  
  return data;
}

/**
 * Get folder hierarchy for column view
 * @param prefix The prefix to start from (empty for root)
 * @returns Promise with the folder hierarchy
 */
export async function getFolderHierarchy(prefix: string = ""): Promise<{
  nodes: TreeNode[];
  prefix: string;
}> {
  const response = await fetch(`${API_BASE}/files/hierarchy?prefix=${encodeURIComponent(prefix)}`);
  const responseClone = response.clone(); // Clone response for error handling
  
  if (!response.ok) {
    // Try to parse the error as JSON first for structured errors
    try {
      const errorData = await responseClone.json();
      throw new Error(`Failed to get folder hierarchy: ${errorData.error}. ${errorData.details || ''}`);
    } catch (e) {
      // If not JSON, use text response
      const errorText = await response.text();
      throw new Error(`Failed to get folder hierarchy: ${errorText}`);
    }
  }
  return await response.json();
}
