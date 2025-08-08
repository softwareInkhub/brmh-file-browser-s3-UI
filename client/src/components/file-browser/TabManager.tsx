import React from "react";
import { X, Home, Clock, Star, Users, Trash2, Settings } from "lucide-react";

export interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}

interface TabManagerProps {
  tabs: Tab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
}

const TabManager: React.FC<TabManagerProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <div
              key={tab.id}
              className={`
                flex items-center gap-2 px-4 py-3 border-r border-gray-200 cursor-pointer transition-all duration-200 group relative
                ${tab.id === activeTabId
                  ? "bg-blue-50 border-b-2 border-b-blue-600 text-blue-700"
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
                ${tab.id === activeTabId ? "min-w-[200px]" : "min-w-[180px]"}
              `}
              onClick={() => onTabClick(tab.id)}
            >
              <IconComponent
                className={`
                  h-4 w-4 transition-colors duration-200
                  ${tab.id === activeTabId ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}
                `}
              />
              <span className="text-sm font-medium truncate flex-1">
                {tab.label}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className={`
                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200
                  ${tab.id === activeTabId ? "opacity-100" : ""}
                `}
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
