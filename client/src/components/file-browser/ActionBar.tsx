import React from "react";
import { Button } from "@/components/ui/button";
import { SortAsc, SortDesc, Filter } from "lucide-react";

interface ActionBarProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
  onFilterChange?: (filter: string) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
  viewMode,
  onViewModeChange,
  sortBy,
  sortDirection,
  onSort,
  onFilterChange,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200/60">
      {/* Left section - Empty for now, can be used for future features */}
      <div className="flex items-center gap-4">
        {/* Future features can be added here */}
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

        </div>


      </div>
    </div>
  );
};

export default ActionBar;
