import React from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, List, SortAsc, SortDesc, Filter } from "lucide-react";

interface ActionBarProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onFilterChange?: (filter: string) => void;
  selectedCount?: number;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  sortDirection,
  onSort,
  onFilterChange,
  selectedCount = 0,
  onSelectAll,
  onClearSelection,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200/60">
      {/* Left section - Selection info and actions */}
      <div className="flex items-center gap-4">
        {selectedCount > 0 ? (
          <>
            <span className="text-sm text-gray-600">
              {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear selection
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-gray-600 hover:text-gray-900"
          >
            Select all
          </Button>
        )}
      </div>

      {/* Right section - View toggle and sorting */}
      <div className="flex items-center gap-2">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSort("size")}
            className={`h-8 px-3 text-sm rounded-lg ${
              sortBy === "size" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Size
            {sortBy === "size" && (
              sortDirection === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
            )}
          </Button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-4">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("grid")}
            className={`h-8 px-3 rounded-md ${
              viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            className={`h-8 px-3 rounded-md ${
              viewMode === "list" ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
