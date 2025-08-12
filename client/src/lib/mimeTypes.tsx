// MIME type utility for file handling
import React from 'react';
import { 
  FileText, 
  FileImage, 
  FileAudio, 
  FileVideo, 
  FileArchive, 
  FileCode, 
  File,
  FileType,
  FileSpreadsheet,
  Presentation,
  FileText as FileWord
} from 'lucide-react';

/**
 * Common file extensions and their corresponding MIME types
 */
const MIME_TYPES: Record<string, string> = {
  // Text files
  'txt': 'text/plain',
  'md': 'text/markdown',
  'markdown': 'text/markdown',
  
  // Source code
  'html': 'text/html',
  'htm': 'text/html',
  'css': 'text/css',
  'js': 'application/javascript',
  'jsx': 'application/javascript',
  'ts': 'application/typescript',
  'tsx': 'application/typescript',
  'json': 'application/json',
  'xml': 'application/xml',
  'svg': 'image/svg+xml',
  'py': 'text/x-python',
  'rb': 'text/x-ruby',
  'java': 'text/x-java',
  'c': 'text/x-c',
  'cpp': 'text/x-c++',
  'cs': 'text/x-csharp',
  'go': 'text/x-go',
  'php': 'text/x-php',
  'swift': 'text/x-swift',
  'yaml': 'text/x-yaml',
  'yml': 'text/x-yaml',
  'toml': 'text/x-toml',
  'ini': 'text/x-ini',
  'sh': 'text/x-sh',
  'bash': 'text/x-sh',
  'bat': 'text/x-bat',
  'ps1': 'text/x-powershell',
  'sql': 'text/x-sql',
  
  // Images
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'bmp': 'image/bmp',
  'ico': 'image/x-icon',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  
  // Audio
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'ogg': 'audio/ogg',
  'flac': 'audio/flac',
  'm4a': 'audio/mp4',
  'aac': 'audio/aac',
  
  // Video
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'avi': 'video/x-msvideo',
  'mov': 'video/quicktime',
  'wmv': 'video/x-ms-wmv',
  'flv': 'video/x-flv',
  'mkv': 'video/x-matroska',
  '3gp': 'video/3gpp',
  
  // Documents
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'odt': 'application/vnd.oasis.opendocument.text',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odp': 'application/vnd.oasis.opendocument.presentation',
  
  // Archives
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  'tar': 'application/x-tar',
  'gz': 'application/gzip',
  '7z': 'application/x-7z-compressed',
  
  // Misc
  'csv': 'text/csv',
  'rtf': 'application/rtf',
};

/**
 * File categories by type
 */
export enum FileCategory {
  TEXT = 'text',
  CODE = 'code',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}

/**
 * Get the MIME type from a file extension
 */
export function getMimeTypeFromExtension(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[extension] || 'application/octet-stream';
}

/**
 * Get file category from MIME type
 */
export function getCategoryFromMimeType(mimeType: string): FileCategory {
  if (mimeType.startsWith('text/')) {
    if (['text/html', 'text/css', 'application/javascript', 'application/typescript',
         'text/x-python', 'text/x-ruby', 'text/x-java', 'text/x-c', 'text/x-c++', 
         'text/x-csharp', 'text/x-go', 'text/x-php', 'text/x-swift', 'text/x-yaml', 
         'text/x-toml', 'text/x-ini', 'text/x-sh', 'text/x-bat', 'text/x-powershell',
         'text/x-sql', 'application/json', 'application/xml'].includes(mimeType)) {
      return FileCategory.CODE;
    }
    return FileCategory.TEXT;
  }
  
  if (mimeType.startsWith('image/')) {
    return FileCategory.IMAGE;
  }
  
  if (mimeType.startsWith('audio/')) {
    return FileCategory.AUDIO;
  }
  
  if (mimeType.startsWith('video/')) {
    return FileCategory.VIDEO;
  }
  
  if (mimeType === 'application/pdf' || 
      mimeType.includes('word') || 
      mimeType.includes('excel') || 
      mimeType.includes('powerpoint') || 
      mimeType.includes('opendocument')) {
    return FileCategory.DOCUMENT;
  }
  
  if (mimeType.includes('zip') || 
      mimeType.includes('compressed') || 
      mimeType.includes('archive') || 
      mimeType === 'application/gzip') {
    return FileCategory.ARCHIVE;
  }
  
  if (mimeType === 'application/octet-stream') {
    return FileCategory.BINARY;
  }
  
  return FileCategory.UNKNOWN;
}

/**
 * Get file category directly from filename
 */
export function getFileCategoryFromName(filename: string): FileCategory {
  const mimeType = getMimeTypeFromExtension(filename);
  return getCategoryFromMimeType(mimeType);
}

/**
 * Get file icon component based on filename
 */
export function getFileIcon(filename: string): React.ReactElement {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const category = getFileCategoryFromName(filename);
  
  // Document types
  if (['pdf'].includes(extension)) {
    return <FileType className="w-4 h-4 text-red-500" />;
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(extension)) {
    return <FileWord className="w-4 h-4 text-blue-500" />;
  }
  if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
    return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
  }
  if (['ppt', 'pptx', 'odp'].includes(extension)) {
    return <Presentation className="w-4 h-4 text-orange-500" />;
  }
  
  // Category-based icons
  switch (category) {
    case FileCategory.IMAGE:
      return <FileImage className="w-4 h-4 text-green-500" />;
    case FileCategory.AUDIO:
      return <FileAudio className="w-4 h-4 text-purple-500" />;
    case FileCategory.VIDEO:
      return <FileVideo className="w-4 h-4 text-red-500" />;
    case FileCategory.ARCHIVE:
      return <FileArchive className="w-4 h-4 text-yellow-500" />;
    case FileCategory.CODE:
      return <FileCode className="w-4 h-4 text-blue-500" />;
    case FileCategory.TEXT:
      return <FileText className="w-4 h-4 text-gray-500" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
}

/**
 * Check if a file is editable
 */
export function isFileEditable(filename: string): boolean {
  const category = getFileCategoryFromName(filename);
  return category === FileCategory.TEXT || category === FileCategory.CODE;
}

/**
 * Check if a file is viewable as text
 */
export function isTextViewable(filename: string): boolean {
  const category = getFileCategoryFromName(filename);
  return category === FileCategory.TEXT || category === FileCategory.CODE;
}

/**
 * Get language mode for code editor
 */
export function getLanguageFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Map file extensions to CodeMirror language modes
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'css',
    'sass': 'css',
    'less': 'css',
    'md': 'markdown',
    'markdown': 'markdown',
    'json': 'json',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'php': 'php',
    'swift': 'swift',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'sh': 'shell',
    'bash': 'shell',
    'bat': 'batch',
    'ps1': 'powershell',
    'sql': 'sql',
    'xml': 'xml',
    'svg': 'xml',
  };
  
  return languageMap[extension] || 'plaintext';
}