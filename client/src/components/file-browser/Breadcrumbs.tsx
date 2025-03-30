import React from "react";
import { BreadcrumbItem } from "../../types";

interface BreadcrumbsProps {
  path: string;
  onNavigate: (path: string) => void;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ path, onNavigate }) => {
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
    <div className="mb-4 flex items-center text-sm text-gray-500 overflow-x-auto">
      <button
        className="flex items-center hover:text-primary transition-colors whitespace-nowrap"
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
          className="mr-1 h-4 w-4"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Home
      </button>

      {breadcrumbs.slice(1).map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          <span className="mx-2 text-gray-400">/</span>
          <button
            className="hover:text-primary transition-colors whitespace-nowrap"
            onClick={() => onNavigate(crumb.path)}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;
