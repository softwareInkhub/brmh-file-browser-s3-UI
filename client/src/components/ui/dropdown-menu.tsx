import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit3, Trash2, FolderOpen, Download } from "lucide-react";

interface DropdownMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  trigger,
  className = "",
  align = "right"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: DropdownMenuItem) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleItemClick(item);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={handleTriggerClick}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg py-1
            ${align === "right" ? "right-0" : "left-0"}
          `}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="dropdown-menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              disabled={item.disabled}
              className={`
                w-full flex items-center px-3 py-2 text-sm text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                ${item.disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700 cursor-pointer"}
                ${item.className || ""}
              `}
              role="menuitem"
              tabIndex={0}
            >
              <span className="mr-2 flex-shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
