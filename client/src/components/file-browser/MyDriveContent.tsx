import React from "react";
import { S3Object, S3Folder } from "../../types";
import UnifiedNavBar from "./UnifiedNavBar";
import FileGrid from "./FileGrid";
import FileList from "./FileList";

interface MyDriveContentProps {
  files: S3Object[];
  folders: S3Object[];
  currentPath: string;
  viewMode: "grid" | "list";
  sortBy: string;
  sortDirection: "asc" | "desc";

  isLoading: boolean;
  hasContent: boolean;
  onViewModeChange: (mode: "grid" | "list") => void;
  onSort: (column: string) => void;

  onFileClick: (file: S3Object) => void;
  onFolderClick: (folder: S3Object) => void;
  onFileContextMenu: (item: S3Object, e: React.MouseEvent) => void;
  onFolderContextMenu: (item: S3Object, e: React.MouseEvent) => void;
  onNavigate: (path: string) => void;
  onDrop: (sourceKeys: string[], destinationPath: string) => void;
  onUploadClick: () => void;
  onNewFolderClick: () => void;
}

const MyDriveContent: React.FC<MyDriveContentProps> = ({
  files,
  folders,
  currentPath,
  viewMode,
  sortBy,
  sortDirection,

  isLoading,
  hasContent,
  onViewModeChange,
  onSort,

  onFileClick,
  onFolderClick,
  onFileContextMenu,
  onFolderContextMenu,
  onNavigate,
  onDrop,
  onUploadClick,
  onNewFolderClick,
}) => {
  return (
    <div className="flex-1">
      {/* Unified Navigation Bar */}
      <UnifiedNavBar
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={onSort}
        path={currentPath}
        onNavigate={onNavigate}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-ping opacity-20"></div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 font-medium">Loading your files...</p>
              <p className="text-sm text-gray-400 mt-1">Please wait while we fetch your content</p>
            </div>
          </div>
        </div>
      ) : !hasContent ? (
        <div className="text-center py-16 px-6">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 text-gray-400"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No files found</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            This folder is empty. Upload some files or create a folder to get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onUploadClick}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Files
            </button>
            <button
              onClick={onNewFolderClick}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                <line x1="12" y1="10" x2="12" y2="16" />
                <line x1="9" y1="13" x2="15" y2="13" />
              </svg>
              New Folder
            </button>
          </div>
        </div>
             ) : viewMode === "grid" ? (
         <FileGrid
           files={files}
           folders={folders}
           viewMode={viewMode}
           onFileClick={onFileClick}
           onFolderClick={onFolderClick}
           onFileContextMenu={onFileContextMenu}
           onFolderContextMenu={onFolderContextMenu}
           onDrop={onDrop}
           currentPath={currentPath}
         />
      ) : (
        <FileList
          files={files}
          folders={folders}
          onFileClick={onFileClick}
          onFolderClick={onFolderClick}
          onFileContextMenu={onFileContextMenu}
          onFolderContextMenu={onFolderContextMenu}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
          onDrop={onDrop}
          currentPath={currentPath}
        />
      )}
    </div>
  );
};

export default MyDriveContent;
