import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: (e?: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  direction: 'up' | 'down';
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  trigger,
  className = "",
  align = "right"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0, width: 0, direction: 'down' });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const calculateMenuPosition = (): MenuPosition => {
    if (!triggerRef.current) {
      return { top: 0, left: 0, width: 0, direction: 'down' };
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const menuHeight = items.length * 40 + 16; // Approximate height
    const menuWidth = 160; // Approximate width

    // Calculate available space
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const direction = spaceBelow >= menuHeight || spaceBelow > spaceAbove ? 'down' : 'up';

    // Calculate vertical position with better edge handling
    let top: number;
    if (direction === 'down') {
      top = Math.min(rect.bottom + 4, viewportHeight - menuHeight - 8);
    } else {
      top = Math.max(rect.top - menuHeight - 4, 8);
    }

    // Calculate horizontal position with better edge handling
    let left: number;
    if (align === "right") {
      // For right-aligned menus, try to align with the right edge of the trigger
      left = Math.min(rect.right - menuWidth, viewportWidth - menuWidth - 8);
      left = Math.max(left, 8); // Ensure it doesn't go off the left edge
    } else {
      // For left-aligned menus, try to align with the left edge of the trigger
      left = Math.max(rect.left, 8);
      left = Math.min(left, viewportWidth - menuWidth - 8); // Ensure it doesn't go off the right edge
    }

    // Ensure the menu is always fully visible
    const finalWidth = Math.min(menuWidth, viewportWidth - 16);
    const finalLeft = Math.max(8, Math.min(left, viewportWidth - finalWidth - 8));

    return {
      top,
      left: finalLeft,
      width: finalWidth,
      direction
    };
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newPosition = calculateMenuPosition();
    setMenuPosition(newPosition);
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item: DropdownMenuItem, e?: React.MouseEvent) => {
    if (!item.disabled) {
      item.onClick(e);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: DropdownMenuItem) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleItemClick(item);
    }
  };

  const renderMenu = () => {
    if (!isOpen) return null;

    const menuStyle: React.CSSProperties = {
      position: 'fixed',
      top: `${menuPosition.top}px`,
      left: `${menuPosition.left}px`,
      width: `${menuPosition.width}px`,
      zIndex: 999999,
      maxHeight: '80vh', // Prevent menu from being too tall
      overflowY: 'auto', // Add scroll if needed
    };

    const menuContent = (
      <div
        ref={menuRef}
        style={menuStyle}
        className="bg-white border border-gray-200 rounded-lg shadow-xl py-1"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="dropdown-menu"
      >
        {items.map((item, index) => (
          <button
            key={index}
            onClick={(e) => handleItemClick(item, e)}
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
    );

    // Use portal to render menu at document body level
    return createPortal(menuContent, document.body);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>
      {renderMenu()}
    </div>
  );
};

export default DropdownMenu;
