import React from "react";
import { MoreVertical, Edit3, Trash2, FolderOpen, Download } from "lucide-react";
import DropdownMenu from "../ui/dropdown-menu";
import { S3Object } from "../../types";

interface FolderMenuProps {
  folder: S3Object;
  onRename: (folder: S3Object) => void;
  onDelete: (folder: S3Object) => void;
  onMove?: (folder: S3Object) => void;
  onDownload?: (folder: S3Object) => void;
  className?: string;
  align?: "left" | "right";
}

const FolderMenu: React.FC<FolderMenuProps> = ({
  folder,
  onRename,
  onDelete,
  onMove,
  onDownload,
  className = "",
  align = "right"
}) => {
  const menuItems = [
    {
      label: "Rename",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: () => onRename(folder),
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDelete(folder),
      className: "text-red-600 hover:bg-red-50",
    },
    ...(onMove ? [{
      label: "Move to...",
      icon: <FolderOpen className="w-4 h-4" />,
      onClick: () => onMove(folder),
    }] : []),
    ...(onDownload ? [{
      label: "Download",
      icon: <Download className="w-4 h-4" />,
      onClick: () => onDownload(folder),
    }] : []),
  ];

  const trigger = (
    <button 
      className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white border border-gray-200 transition-colors"
      aria-label="More options"
    >
      <MoreVertical className="w-4 h-4 text-gray-600" />
    </button>
  );

  return (
    <DropdownMenu
      items={menuItems}
      trigger={trigger}
      className={className}
      align={align}
    />
  );
};

export default FolderMenu;
