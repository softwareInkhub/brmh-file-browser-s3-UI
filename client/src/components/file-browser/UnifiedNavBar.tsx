import React from "react";
import { Button } from "@/components/ui/button";
import { SortAsc, SortDesc, Filter, Grid3X3, List } from "lucide-react";
import { BreadcrumbItem } from "../../types";
import { truncateFolderName } from "../../lib/utils";

interface UnifiedNavBarProps {
  // ActionBar props
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onFilterChange?: (filter: string) => void;
  
  // Breadcrumbs props
  path: string;
  onNavigate: (path: string) => void;
}

const UnifiedNavBar: React.FC<UnifiedNavBarProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  sortDirection,
  onSort,
  onFilterChange,
  path,
  onNavigate,
}) => {
  // Generate breadcrumb items from path
  const getBreadcrumbItems = (path: string): BreadcrumbItem[] => {
    if (!path || path === "/") {
      return [];
    }

    const parts = path.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Add Home
    items.push({ name: "Home", path: "" });

    // Add intermediary paths
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      currentPath += parts[i] + "/";
      items.push({
        name: parts[i],
        path: currentPath,
      });
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbItems(path);

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200/60">
      {/* Left section - Breadcrumbs */}
      <div className="flex items-center text-sm text-gray-600 overflow-x-auto min-w-0 flex-1">
        <button
          className="flex items-center hover:text-blue-600 transition-colors duration-200 whitespace-nowrap font-medium"
          onClick={() => onNavigate("")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>

        {breadcrumbs.slice(1).map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-2 h-4 w-4 text-gray-400 flex-shrink-0"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <button
              className="hover:text-blue-600 transition-colors duration-200 whitespace-nowrap font-medium"
              onClick={() => onNavigate(crumb.path)}
              title={crumb.name}
            >
              {truncateFolderName(crumb.name, 12)}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Right section - Filter and Sort controls */}
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        {/* Filter button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>

        {/* Sort options */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort("name")}
            className={`h-8 px-3 text-sm rounded-lg ${
              sortBy === "name" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Name
            {sortBy === "name" && (
              sortDirection === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort("lastModified")}
            className={`h-8 px-3 text-sm rounded-lg ${
              sortBy === "lastModified" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Modified
            {sortBy === "lastModified" && (
              sortDirection === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-100 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedNavBar;
