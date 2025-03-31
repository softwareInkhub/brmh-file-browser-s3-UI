import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  onSearchChange: (search: string) => void;
  onUploadClick: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onSearchChange, onUploadClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="h-14 px-4 lg:px-6">
        <div className="flex items-center justify-between h-full max-w-[1400px] mx-auto">
          {/* Left section with logo and search */}
          <div className="flex items-center gap-4">
            {/* Logo and title */}
            <h1 className="text-xl font-semibold text-gray-900 flex items-center whitespace-nowrap ml-12 md:ml-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-6 w-6 text-primary flex-shrink-0"
              >
                <path d="M2 22L12 12 22 22" />
                <path d="M18 14L12 9 6 14" />
                <path d="M2 9L12 2 22 9" />
              </svg>
              <span className="hidden sm:inline">S3 File Browser</span>
            </h1>

            {/* Search bar - hidden on mobile */}
            <div className="hidden md:block relative max-w-md w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <Input
                type="text"
                className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search files and folders..."
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Right section with actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              size="sm"
              onClick={onUploadClick}
              className="inline-flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none" 
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 h-4 w-4"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </Button>
            
            <button className="text-gray-500 hover:text-gray-700 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            
            <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-medium flex-shrink-0">
              JS
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
