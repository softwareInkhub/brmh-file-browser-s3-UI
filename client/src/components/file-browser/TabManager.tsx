import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Home, Clock, Star, Users, Trash2, Settings, FileText } from "lucide-react";
import { getFileIcon } from "../../lib/mimeTypes";

export interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  type: 'navigation' | 'file-preview';
  fileKey?: string; // For file preview tabs
}

interface TabManagerProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
}

const TabManager: React.FC<TabManagerProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabReorder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const getTabIcon = (tab: Tab) => {
    if (tab.type === 'file-preview' && tab.fileKey) {
      const fileName = tab.fileKey.split("/").pop() || tab.fileKey;
      return getFileIcon(fileName);
    }
    return tab.icon;
  };

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabId && containerRef.current) {
      const activeTabElement = containerRef.current.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement;
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }
  }, [activeTabId]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setIsDragging(true);
    setDraggedTab(tabId);
    
    // Set drag image to be invisible
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Store initial mouse position
    setDragOffset({
      x: e.clientX - e.currentTarget.getBoundingClientRect().left,
      y: e.clientY - e.currentTarget.getBoundingClientRect().top
    });
    
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedTab && draggedTab !== tabId) {
      setDragOverTab(tabId);
    }
  }, [draggedTab]);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTab(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    
    if (draggedTab && draggedTab !== targetTabId && onTabReorder) {
      const fromIndex = tabs.findIndex(tab => tab.id === draggedTab);
      const toIndex = tabs.findIndex(tab => tab.id === targetTabId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        onTabReorder(fromIndex, toIndex);
      }
    }
    
    setIsDragging(false);
    setDraggedTab(null);
    setDragOverTab(null);
  }, [draggedTab, tabs, onTabReorder]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedTab(null);
    setDragOverTab(null);
  }, []);

  // Handle wheel scroll for horizontal scrolling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (containerRef.current) {
      e.preventDefault();
      containerRef.current.scrollBy({
        left: e.deltaY,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div className="tab-bar-container">
      <div
        ref={containerRef}
        className="tab-scroll-container"
        onWheel={handleWheel}
      >
        {tabs.map((tab, index) => {
          const iconResult = getTabIcon(tab);
          const isDragging = draggedTab === tab.id;
          const isDragOver = dragOverTab === tab.id;
          
          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              className={`
                tab-item
                ${tab.id === activeTabId ? 'active' : ''}
                ${isDragging ? 'dragging' : ''}
                ${isDragOver ? 'drag-over' : ''}
              `}
              onClick={() => onTabClick(tab.id)}
              style={{
                transform: isDragging ? 'rotate(2deg)' : 'none',
                transition: isDragging ? 'none' : 'all 0.2s ease-in-out'
              }}
            >
              {/* Handle both ReactElement and ComponentType */}
              {React.isValidElement(iconResult) ? (
                React.cloneElement(iconResult, {
                  className: 'tab-icon'
                })
              ) : (
                React.createElement(iconResult as React.ComponentType<{ className?: string }>, {
                  className: 'tab-icon'
                })
              )}
              <span className="tab-label">
                {tab.label}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={`
                  tab-close-button
                  ${isDragging ? 'disabled' : ''}
                `}
                title="Close tab"
                aria-label={`Close ${tab.label} tab`}
                disabled={isDragging}
              >
                <X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TabManager;
