import React, { useRef, useEffect } from "react";
import { Position, S3Object } from "../../types";

interface ContextMenuProps {
  position: Position;
  isVisible: boolean;
  onClose: () => void;
  item?: S3Object;
  onPreview: () => void;
  onDownload: () => void;
  onRename: () => void;
  onMove: () => void;
  onStar: () => void;
  onDelete: () => void;
  isStarred: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  isVisible,
  onClose,
  item,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onStar,
  onDelete,
  isStarred,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !item) return null;

  // Determine if the item is a folder
  const isFolder = item.isFolder || item.key.endsWith('/');

  // Adjust position if too close to edge
  const adjustPosition = (pos: Position): Position => {
    const menuWidth = 208; // Approximate width of the menu
    const menuHeight = 280; // Approximate height of the menu
    
    const adjustedX = pos.x + menuWidth > window.innerWidth 
      ? window.innerWidth - menuWidth - 10 
      : pos.x;
    
    const adjustedY = pos.y + menuHeight > window.innerHeight
      ? window.innerHeight - menuHeight - 10
      : pos.y;
    
    return { x: adjustedX, y: adjustedY };
  };

  const adjustedPosition = adjustPosition(position);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1"
      style={{ top: `${adjustedPosition.y}px`, left: `${adjustedPosition.x}px` }}
    >
      {!isFolder && (
        <button
          onClick={onPreview}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 mr-2 text-gray-400"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview
        </button>
      )}
      
      <button
        onClick={onDownload}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 mr-2 text-gray-400"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download
      </button>
      
      <button
        onClick={onRename}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 mr-2 text-gray-400"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        Rename
      </button>
      
      <button
        onClick={onMove}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 mr-2 text-gray-400"
        >
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
          <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
          <path d="M12 3v6" />
        </svg>
        Move
      </button>
      
      <button
        onClick={onStar}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isStarred ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-5 h-5 mr-2 ${isStarred ? "text-yellow-500" : "text-gray-400"}`}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {isStarred ? "Unstar" : "Star"}
      </button>
      
      <div className="border-t border-gray-200 my-1"></div>
      
      <button
        onClick={onDelete}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 mr-2 text-red-500"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
        Delete
      </button>
    </div>
  );
};

export default ContextMenu;
