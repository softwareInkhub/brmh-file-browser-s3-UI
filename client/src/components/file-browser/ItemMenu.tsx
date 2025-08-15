import React from "react";
import { MoreVertical, Edit3, Trash2, FolderOpen, Download } from "lucide-react";
import DropdownMenu from "../ui/dropdown-menu";
import { S3Object } from "../../types";

interface ItemMenuProps {
  item: S3Object;
  onRename: (item: S3Object) => void;
  onDelete: (item: S3Object) => void;
  onMove?: (item: S3Object) => void;
  onDownload?: (item: S3Object) => void;
  className?: string;
  align?: "left" | "right";
}

const ItemMenu: React.FC<ItemMenuProps> = ({
  item,
  onRename,
  onDelete,
  onMove,
  onDownload,
  className = "",
  align = "right"
}) => {

  const isFolder = item.isFolder || item.type === 'folder';

  const menuItems = [
    {
      label: "Rename",
      icon: <Edit3 className="w-4 h-4" />,
      onClick: (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        onRename(item);
      },
    },
    {
      label: "Move to...",
      icon: <FolderOpen className="w-4 h-4" />,
      onClick: (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        onMove?.(item);
      },
    },
    {
      label: "Download",
      icon: <Download className="w-4 h-4" />,
      onClick: (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        onDownload?.(item);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        onDelete(item);
      },
      className: "text-red-600 hover:bg-red-50",
    },
  ];



  const trigger = (
    <button
      className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white border border-gray-200 transition-colors"
      aria-label="More options"
      data-menu-trigger="true"
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

export default ItemMenu;
