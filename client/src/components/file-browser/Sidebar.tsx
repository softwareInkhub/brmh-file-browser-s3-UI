import React, { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { S3Folder } from "../../types";
import { Progress } from "@/components/ui/progress";
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';

interface SidebarProps {
  folders: S3Folder[];
  storageInfo: {
    used: number;
    total: number;
    percentage: number;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ 
  folders = [],
  storageInfo = {
    used: 0,
    total: 0,
    percentage: 0
  }
}) => {
  // For route matching
  const [isAllFiles] = useRoute("/");
  const [isRecent] = useRoute("/recent");
  const [isStarred] = useRoute("/starred");
  const [isTrash] = useRoute("/trash");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical mobile breakpoint
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      {/* Mobile Menu Button - Only show on mobile */}
      {isMobile && (
        <Button
          variant="ghost"
          className="fixed top-3 left-3 z-50 md:hidden w-8 h-8 p-0 flex items-center justify-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-14 left-0 z-40 h-[calc(100vh-56px)]
        transition-transform duration-300 ease-in-out
        bg-background border-r overflow-y-auto
        ${isMobile ? 'w-64' : 'w-64 md:w-64'}
        ${isMobile && !isMobileMenuOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <nav className="px-4 py-5">
          <div className="space-y-1">
            <Link href="/">
              <div
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isAllFiles
                    ? "bg-gray-100 text-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } group cursor-pointer`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-3 h-5 w-5 ${
                    isAllFiles ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                </svg>
                All Files
              </div>
            </Link>
            <Link href="/recent">
              <div
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isRecent
                    ? "bg-gray-100 text-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } group cursor-pointer`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-3 h-5 w-5 ${
                    isRecent ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Recent
              </div>
            </Link>
            <Link href="/starred">
              <div
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isStarred
                    ? "bg-gray-100 text-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } group cursor-pointer`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-3 h-5 w-5 ${
                    isStarred ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Starred
              </div>
            </Link>
            <Link href="/trash">
              <div
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isTrash
                    ? "bg-gray-100 text-primary"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                } group cursor-pointer`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`mr-3 h-5 w-5 ${
                    isTrash ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Trash
              </div>
            </Link>
          </div>
        </nav>

        <div className="px-4 mt-6">
          <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            FOLDERS
          </h3>
          <div className="mt-2 space-y-1">
            {folders?.map((folder) => (
              <Link key={folder.key} href={`/?prefix=${encodeURIComponent(folder.path)}`}>
                <div className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                  </svg>
                  {folder.name}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="px-4 mt-6">
          <div className="rounded-md bg-gray-50 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-800">Storage</h3>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">
                    <div className="flex justify-between mb-1">
                      <span>Used</span>
                      <span>
                        {formatSize(storageInfo.used)} of {formatSize(storageInfo.total)}
                      </span>
                    </div>
                    <Progress value={storageInfo.percentage} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 top-14"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
