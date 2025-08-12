import { z } from "zod";

// S3 File/Object Type
export interface S3Object {
  key: string;
  name?: string;
  size?: number;
  lastModified?: Date;
  type?: string;
  isFolder?: boolean;
  etag?: string;
}

// S3 Folder Type
export interface S3Folder {
  key: string;
  name: string;
  path: string;
}

// File View Mode
export type ViewMode = "grid" | "list" | "column";

// TreeNode for column view hierarchy
export interface TreeNode {
  key: string;
  name: string;
  type: 'folder' | 'file';
  size?: number;
  lastModified?: Date;
  isFolder?: boolean;
  etag?: string;
  children?: TreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

// Context Menu Position
export interface Position {
  x: number;
  y: number;
}

// Breadcrumb Item
export interface BreadcrumbItem {
  name: string;
  path: string;
}

// Sort Options
export type SortOption = "name" | "size" | "lastModified";
export type SortDirection = "asc" | "desc";

// Filter Options
export interface FilterOptions {
  searchTerm?: string;
  fileType?: string;
}

// Upload Status
export interface UploadStatus {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  key: string;
  error?: string;
}

// File Operation Types
export type OperationType = "rename" | "move" | "delete" | "create" | "upload" | "download";

// Pagination Info
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

// Toast Type
export type ToastType = "success" | "error" | "info" | "warning";

// Toast Data
export interface ToastData {
  message: string;
  type: ToastType;
  id: string;
}

// File Preview Type
export interface FilePreview {
  key: string;
  url: string;
  type: string;
  name: string;
  size?: number;
  lastModified?: Date;
}

// Storage Info
export interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

// Shared File
export interface SharedFile {
  shareId: string;
  fileKey: string;
  fileName: string;
  url: string;
  expiresAt: Date;
  createdAt: Date;
  contentType?: string;
  size?: number;
  lastModified?: Date;
}

// Shared File List
export interface SharedFileList {
  sharedFiles: SharedFile[];
}
