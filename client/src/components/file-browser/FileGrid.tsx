import React, { useRef, useState } from "react";
import { S3Object } from "../../types";
import { truncateFolderName } from "../../lib/utils";
import { Grid3X3, List, MoreVertical, Star, Download, Share2, Trash2, Edit3, FolderOpen } from "lucide-react";
import FolderMenu from "./FolderMenu";

interface FileGridProps {
  files: S3Object[];
  folders: S3Object[];
  viewMode?: "grid" | "list" | "column";
  onFileClick: (file: S3Object) => void;
  onFolderClick: (folder: S3Object) => void;
  onFileContextMenu: (item: S3Object, e: React.MouseEvent) => void;
  onFolderContextMenu: (item: S3Object, e: React.MouseEvent) => void;
  onFolderRename?: (folder: S3Object) => void;
  onFolderDelete?: (folder: S3Object) => void;
  onFolderMove?: (folder: S3Object) => void;
  onFolderDownload?: (folder: S3Object) => void;
  onDrop?: (sourceKeys: string[], destinationPath: string) => void;
  currentPath?: string;
}

type ViewMode = 'grid' | 'list' | 'column';

const FileGrid: React.FC<FileGridProps> = ({
  files,
  folders,
  viewMode,
  onFileClick,
  onFolderClick,
  onFileContextMenu,
  onFolderContextMenu,
  onFolderRename,
  onFolderDelete,
  onFolderMove,
  onFolderDownload,
  onDrop,
  currentPath,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<S3Object | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  
  // State for dropdown functionality
  const [expandedSections, setExpandedSections] = useState({
    folders: true,
    files: true
  });

  // Toggle dropdown sections
  const toggleSection = (section: 'folders' | 'files') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getFileIcon = (file: S3Object) => {
    const name = file.name || file.key;
    const extension = name.split('.').pop()?.toLowerCase();
    
    // Enhanced icon colors and backgrounds based on file type
    const iconConfig = {
      pdf: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      doc: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      docx: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      xls: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      xlsx: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      ppt: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
      pptx: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
      txt: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
      jpg: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      jpeg: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      png: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      gif: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      webp: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      mp4: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      avi: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      mov: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
      mp3: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      wav: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      zip: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      rar: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
      default: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
    };

    const config = iconConfig[extension as keyof typeof iconConfig] || iconConfig.default;

    // Return appropriate icon based on file type
    switch (extension) {
      case 'pdf':
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      case 'xls':
      case 'xlsx':
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
            </svg>
          </div>
        );
      case 'mp4':
      case 'avi':
      case 'mov':
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z" />
            </svg>
          </div>
        );
      case 'mp3':
      case 'wav':
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17C6,19.21 7.79,21 10,21C12.21,21 14,19.21 14,17V7H18V3H12Z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className={`flex-shrink-0 w-12 h-12 ${config.bg} ${config.border} border rounded-lg flex items-center justify-center ${config.color}`}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </div>
        );
    }
  };

  const getFolderIcon = () => (
    <div className="flex-shrink-0 w-12 h-12 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-blue-600">
      <FolderOpen className="w-6 h-6" />
    </div>
  );

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleDragStart = (item: S3Object, e: React.DragEvent) => {
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item.key);
  };

  const handleDragOver = (e: React.DragEvent, folder?: S3Object) => {
    e.preventDefault();
    if (folder) {
      setDragOverFolder(folder.key);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folder?: S3Object) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (onDrop && draggedItem) {
      const destinationPath = folder ? folder.key : currentPath || '';
      onDrop([draggedItem.key], destinationPath);
    }
    
    setDraggedItem(null);
  };

  const renderGridItem = (item: S3Object, isFolder: boolean = false) => (
    <div
      key={item.key}
      draggable
      onDragStart={(e) => handleDragStart(item, e)}
      onDragOver={(e) => isFolder ? handleDragOver(e, item) : undefined}
      onDragLeave={isFolder ? handleDragLeave : undefined}
      onDrop={(e) => isFolder ? handleDrop(e, item) : undefined}
      className={`
        group relative bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer
        ${dragOverFolder === item.key ? 'border-blue-400 bg-blue-50' : ''}
        ${viewMode === 'grid' ? 'hover:-translate-y-1' : ''}
      `}
      onClick={() => isFolder ? onFolderClick(item) : onFileClick(item)}
      onContextMenu={(e) => isFolder ? onFolderContextMenu(item, e) : onFileContextMenu(item, e)}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        {isFolder ? getFolderIcon() : getFileIcon(item)}
        <div className="w-full">
          <p className="text-sm font-medium text-gray-900 truncate" title={item.name || ''}>
            {truncateFolderName(item.name || '', viewMode === 'grid' ? 15 : 20)}
          </p>
          {isFolder ? (
            <p className="text-xs text-gray-500 mt-1">Folder</p>
          ) : (
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <p>{formatSize(item.size)}</p>
              {item.lastModified && (
                <p>{formatDate(item.lastModified)}</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Hover actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {isFolder && onFolderRename && onFolderDelete ? (
          <FolderMenu
            folder={item}
            onRename={onFolderRename}
            onDelete={onFolderDelete}
            onMove={onFolderMove}
            onDownload={onFolderDownload}
          />
        ) : (
          <button className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white border border-gray-200">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );

  const renderListItem = (item: S3Object, isFolder: boolean = false) => (
    <div
      key={item.key}
      draggable
      onDragStart={(e) => handleDragStart(item, e)}
      onDragOver={(e) => isFolder ? handleDragOver(e, item) : undefined}
      onDragLeave={isFolder ? handleDragLeave : undefined}
      onDrop={(e) => isFolder ? handleDrop(e, item) : undefined}
      className={`
        group flex items-center space-x-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer
        ${dragOverFolder === item.key ? 'border-blue-400 bg-blue-50' : ''}
      `}
      onClick={() => isFolder ? onFolderClick(item) : onFileClick(item)}
      onContextMenu={(e) => isFolder ? onFolderContextMenu(item, e) : onFileContextMenu(item, e)}
    >
      {isFolder ? getFolderIcon() : getFileIcon(item)}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate" title={item.name || ''}>
          {item.name || item.key}
        </p>
        <p className="text-xs text-gray-500">
          {isFolder ? 'Folder' : `${formatSize(item.size)} • ${item.type || 'Unknown type'}`}
        </p>
      </div>
      
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        {!isFolder && item.lastModified && (
          <span>{formatDate(item.lastModified)}</span>
        )}
      </div>
      
      {/* Hover actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
        <button className="p-1.5 hover:bg-gray-200 rounded">
          <Star className="w-4 h-4 text-gray-600" />
        </button>
        <button className="p-1.5 hover:bg-gray-200 rounded">
          <Share2 className="w-4 h-4 text-gray-600" />
        </button>
        {isFolder && onFolderRename && onFolderDelete ? (
          <FolderMenu
            folder={item}
            onRename={onFolderRename}
            onDelete={onFolderDelete}
            onMove={onFolderMove}
            onDownload={onFolderDownload}
          />
        ) : (
          <button className="p-1.5 hover:bg-gray-200 rounded">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div 
      ref={gridRef}
      className="p-6"
      onDragOver={(e) => handleDragOver(e)}
      onDrop={(e) => handleDrop(e)}
    >


      {/* Suggested folders section */}
      {folders.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
            <button 
              className="text-sm text-gray-500 hover:text-gray-700 transition-transform duration-200"
              onClick={() => toggleSection('folders')}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedSections.folders ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expandedSections.folders ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {folders.map((folder) => renderGridItem(folder, true))}
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map((folder) => renderListItem(folder, true))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Files section */}
      {files.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Files</h2>
            <button 
              className="text-sm text-gray-500 hover:text-gray-700 transition-transform duration-200"
              onClick={() => toggleSection('files')}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${expandedSections.files ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            expandedSections.files ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {files.map((file) => renderGridItem(file, false))}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => renderListItem(file, false))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {folders.length === 0 && files.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-6">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files here</h3>
          <p className="text-sm text-gray-500">Get started by uploading a file or creating a folder.</p>
        </div>
      )}
    </div>
  );
};

export default FileGrid;
