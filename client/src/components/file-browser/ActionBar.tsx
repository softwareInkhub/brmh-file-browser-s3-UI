import React from "react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "../../types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ActionBarProps {
  currentPath: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onCreateFolder: () => void;
  onSort: (option: string) => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  availableFileTypes: string[];
  selectedFileType: string;
  onFileTypeChange: (fileType: string) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  currentPath,
  viewMode,
  onViewModeChange,
  onCreateFolder,
  onSort,
  sortBy,
  sortDirection,
  availableFileTypes = [],
  selectedFileType = "all",
  onFileTypeChange,
}) => {
  // Get folder name from path
  const getFolderName = (path: string): string => {
    if (!path || path === "") return "All Files";
    
    const parts = path.split("/").filter(Boolean);
    return parts[parts.length - 1];
  };
  
  // Get file type display name
  const getFileTypeDisplayName = (type: string): string => {
    if (type === "all") return "All Files";
    return type.toUpperCase();
  };

  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-medium text-gray-900 mb-3 sm:mb-0">
        {getFolderName(currentPath)}
      </h2>
      <div className="flex flex-wrap items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateFolder}
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
            className="mr-1.5 h-4 w-4"
          >
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            <line x1="12" y1="10" x2="12" y2="16" />
            <line x1="9" y1="13" x2="15" y2="13" />
          </svg>
          New Folder
        </Button>
        
        {/* File Type Filter */}
        {availableFileTypes.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
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
                  className="mr-1.5 h-4 w-4"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <path d="M18 12h-6v6m3-6 3 6" />
                </svg>
                File Type: {getFileTypeDisplayName(selectedFileType)}
                {selectedFileType !== "all" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {selectedFileType}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup 
                value={selectedFileType} 
                onValueChange={onFileTypeChange}
              >
                <DropdownMenuRadioItem value="all">
                  All Files
                </DropdownMenuRadioItem>
                
                {availableFileTypes.map((type) => (
                  <DropdownMenuRadioItem key={type} value={type}>
                    {type.toUpperCase()}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-center rounded-md border border-gray-300 bg-white">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className={`rounded-l-md ${
              viewMode === "grid" ? "bg-gray-100 text-primary" : ""
            } border-r border-gray-300`}
            onClick={() => onViewModeChange("grid")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className={`rounded-r-md ${
              viewMode === "list" ? "bg-gray-100 text-primary" : ""
            }`}
            onClick={() => onViewModeChange("list")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
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
                className="mr-1.5 h-4 w-4"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
              </svg>
              Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSort("name")}>
              <div className="flex items-center">
                Name
                {sortBy === "name" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 h-4 w-4"
                  >
                    <polyline
                      points={
                        sortDirection === "asc"
                          ? "18 15 12 9 6 15"
                          : "6 9 12 15 18 9"
                      }
                    />
                  </svg>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("type")}>
              <div className="flex items-center">
                Type
                {sortBy === "type" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 h-4 w-4"
                  >
                    <polyline
                      points={
                        sortDirection === "asc"
                          ? "18 15 12 9 6 15"
                          : "6 9 12 15 18 9"
                      }
                    />
                  </svg>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("size")}>
              <div className="flex items-center">
                Size
                {sortBy === "size" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 h-4 w-4"
                  >
                    <polyline
                      points={
                        sortDirection === "asc"
                          ? "18 15 12 9 6 15"
                          : "6 9 12 15 18 9"
                      }
                    />
                  </svg>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSort("lastModified")}>
              <div className="flex items-center">
                Last Modified
                {sortBy === "lastModified" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 h-4 w-4"
                  >
                    <polyline
                      points={
                        sortDirection === "asc"
                          ? "18 15 12 9 6 15"
                          : "6 9 12 15 18 9"
                      }
                    />
                  </svg>
                )}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ActionBar;
