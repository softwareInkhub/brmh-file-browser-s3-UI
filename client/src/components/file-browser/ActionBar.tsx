import React from "react";

interface ActionBarProps {
  viewMode: "grid" | "list" | "column";
  onViewModeChange: (mode: "grid" | "list" | "column") => void;
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

      {/* Right section - Empty for now, view toggle and sorting removed */}
      <div className="flex items-center gap-2">
        {/* Future controls can be added here */}
      </div>
    </div>
  );
};

export default ActionBar;
