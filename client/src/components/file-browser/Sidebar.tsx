import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { S3Folder } from "../../types";
import { Progress } from "@/components/ui/progress";
import { Button } from '../ui/button';
import { Menu, ChevronRight, Folder, Clock, Star, Users, Trash2, Plus, HardDrive, Settings, Home } from 'lucide-react';
import Sheet from '../ui/sheet';

interface SidebarProps {
  folders: S3Folder[];
  storageInfo: {
    used: number;
    total: number;
    percentage: number;
  };
  onNewClick?: () => void;
  onTabOpen?: (tabId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders = [],
  storageInfo = {
    used: 0,
    total: 0,
    percentage: 0
  },
  onNewClick,
  onTabOpen
}) => {
  // For route matching
  const [isAllFiles] = useRoute("/");
  const [isRecent] = useRoute("/recent");
  const [isStarred] = useRoute("/starred");
  const [isTrash] = useRoute("/trash");
  const [isShared] = useRoute("/shared");


  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Format storage size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const navigationItems = [
    {
      id: "my-drive",
      label: "My Drive",
      icon: Home,
      isActive: isAllFiles,
      badge: null
    },
    {
      id: "recent",
      label: "Recent",
      icon: Clock,
      isActive: isRecent,
      badge: null
    },
    {
      id: "starred",
      label: "Starred",
      icon: Star,
      isActive: isStarred,
      badge: null
    },
    {
      id: "shared",
      label: "Shared with Me",
      icon: Users,
      isActive: isShared,
      badge: null
    },
    {
      id: "trash",
      label: "Trash",
      icon: Trash2,
      isActive: isTrash,
      badge: null
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      isActive: false,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 p-0 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-16 left-0 z-40 h-[calc(100vh-64px)]
        transition-all duration-300 ease-in-out
        bg-white/95 backdrop-blur-md border-r border-gray-200/60 shadow-sm
        ${isMobile ? 'w-72' : isCollapsed ? 'w-16' : 'w-72'}
        ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
        ${!isMobile && isCollapsed ? 'w-16' : 'w-72'}
      `}>
        <nav className="px-4 py-6">
          {/* New Button - Modern style */}
          <div className="mb-8">
            <Button
              onClick={onNewClick}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-lg flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              {!isCollapsed && <span>New</span>}
            </Button>
          </div>

          {/* Navigation Links - Modern style */}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onTabOpen?.(item.id)}
                  className={`
                    flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 group cursor-pointer relative
                    ${item.isActive
                      ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-l-4 hover:border-gray-300"
                    }
                    ${isCollapsed ? 'justify-center px-2' : 'px-3'}
                  `}
                >
                  <div className="relative">
                    <IconComponent
                      className={`
                        ${isCollapsed ? 'h-5 w-5' : 'mr-3 h-5 w-5'}
                        ${item.isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"}
                        transition-colors duration-200
                      `}
                    />
                    {item.badge && !isCollapsed && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {item.isActive && !isCollapsed && (
                    <ChevronRight className="h-4 w-4 text-blue-600 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Folders Section */}
          {!isCollapsed && folders.length > 0 && (
            <div className="mt-8">
              <h3 className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Access
              </h3>
              <div className="space-y-1">
                {folders.slice(0, 5).map((folder) => (
                  <div 
                    key={folder.key} 
                    onClick={() => setActiveSheet("all-files")}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200 cursor-pointer group"
                  >
                    <Folder className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                    <span className="truncate">{folder.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Storage Section - Enhanced style */}
        {!isCollapsed && (
          <div className="px-4 mt-auto mb-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-medium text-gray-900">Storage</h3>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {storageInfo.percentage}%
                </span>
              </div>
              <div className="mb-3">
                <Progress 
                  value={storageInfo.percentage} 
                  className="h-2 bg-gray-200/50" 
                />
              </div>
              <div className="text-xs text-gray-600 mb-3">
                {formatSize(storageInfo.used)} of {formatSize(storageInfo.total)} used
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 transition-all duration-200"
              >
                Get more storage
              </Button>
            </div>
          </div>
        )}

        {/* Collapse Toggle Button */}
        {!isMobile && (
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 top-16"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sheet Components */}
      <Sheet
        isOpen={activeSheet === "my-drive"}
        onClose={() => setActiveSheet(null)}
        title="My Drive"
      >
        <div className="space-y-4">
          <p className="text-gray-600">All your files and folders</p>
          <div className="grid gap-4">
            {folders.map((folder) => (
              <div key={folder.key} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <Folder className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm font-medium">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={activeSheet === "recent"}
        onClose={() => setActiveSheet(null)}
        title="Recent Files"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Recently accessed files</p>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No recent files</p>
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={activeSheet === "starred"}
        onClose={() => setActiveSheet(null)}
        title="Starred Files"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Your starred files and folders</p>
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No starred items</p>
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={activeSheet === "shared"}
        onClose={() => setActiveSheet(null)}
        title="Shared with Me"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Files shared with you by others</p>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No shared files</p>
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={activeSheet === "trash"}
        onClose={() => setActiveSheet(null)}
        title="Trash"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Deleted files and folders</p>
          <div className="text-center py-8 text-gray-500">
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Trash is empty</p>
          </div>
        </div>
      </Sheet>

      <Sheet
        isOpen={activeSheet === "settings"}
        onClose={() => setActiveSheet(null)}
        title="Settings"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Manage your account and preferences</p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Account</h4>
              <p className="text-sm text-gray-500">Manage your profile and security</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Storage</h4>
              <p className="text-sm text-gray-500">View and manage your storage usage</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Preferences</h4>
              <p className="text-sm text-gray-500">Customize your experience</p>
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
};

export default Sidebar;
