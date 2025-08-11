import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { S3Object, S3Folder } from "../../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { listFiles } from "@/lib/s3Service";

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (destinationPath: string) => void;
  item?: S3Object;
  folders: S3Folder[];
}

type FolderNode = {
  key: string;
  name: string;
  path: string;
  depth: number;
  expanded: boolean;
  children: FolderNode[];
  isLoaded: boolean;
  isLoading: boolean;
};

const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  onMove,
  item,
  folders,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [loadingFolders, setLoadingFolders] = useState<boolean>(false);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDestination("");
      buildInitialFolderTree();
    }
  }, [isOpen, folders]);

  // Create an initial folder tree from the top-level folders
  const buildInitialFolderTree = () => {
    // Filter out trash folder and get top-level folders
    const topLevelFolders = folders
      .filter(folder => !folder.key.startsWith("_trash"))
      .filter(folder => folder.key.split('/').length <= 2); // Only top level

    // Create initial tree nodes
    const initialTree = topLevelFolders.map(folder => ({
      key: folder.key,
      name: folder.name,
      path: folder.path || folder.key, // Use path or fallback to key
      depth: 0,
      expanded: false,
      children: [],
      isLoaded: false,
      isLoading: false
    }));

    setFolderTree(initialTree);
  };

  // Load subfolders when a folder is expanded
  const loadSubfolders = async (folderPath: string) => {
    try {
      setLoadingFolders(true);
      const result = await listFiles(folderPath);
      
      // Get both folders from files array and separate folders array
      const subfolders = [
        ...result.files.filter(file => file.isFolder),
        ...(result.folders || [])
      ].filter(folder => !folder.key.startsWith("_trash"));
      
      console.log("Loaded subfolders for", folderPath, ":", subfolders);
      
      // Update folder tree with new subfolders
      updateFolderTreeWithChildren(folderPath, subfolders);
    } catch (error) {
      console.error("Error loading subfolders:", error);
    } finally {
      setLoadingFolders(false);
    }
  };

  // Update the folder tree when children are loaded
  const updateFolderTreeWithChildren = (parentKey: string, children: S3Object[]) => {
    const updateNode = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.key === parentKey) {
          // Map children to FolderNode objects
          const childNodes = children.map(child => ({
            key: child.key,
            name: child.name || child.key.split('/').slice(-2)[0],
            path: child.key, // For subfolders, key is the proper path
            depth: node.depth + 1,
            expanded: false,
            children: [],
            isLoaded: false,
            isLoading: false
          }));
          
          // Return updated node
          return {
            ...node,
            children: childNodes,
            isLoaded: true,
            isLoading: false
          };
        } else if (node.children.length > 0) {
          // Recursively update children
          return {
            ...node,
            children: updateNode(node.children)
          };
        }
        return node;
      });
    };
    
    setFolderTree(updateNode(folderTree));
  };

  // Toggle folder expansion
  const toggleFolder = async (key: string) => {
    const toggleNode = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.key === key) {
          const newExpanded = !node.expanded;
          
          // If expanding and not loaded yet, trigger loading
          if (newExpanded && !node.isLoaded && !node.isLoading) {
            node.isLoading = true;
            loadSubfolders(node.key);
          }
          
          return {
            ...node,
            expanded: newExpanded
          };
        } else if (node.children.length > 0) {
          // Recursively toggle in children
          return {
            ...node,
            children: toggleNode(node.children)
          };
        }
        return node;
      });
    };
    
    setFolderTree(toggleNode(folderTree));
  };

  const handleMove = () => {
    onMove(selectedDestination);
  };

  // Cannot move to the current directory
  const getCurrentDirectory = (key: string): string => {
    if (!key) return "";
    if (item?.isFolder) return key;
    const parts = key.split("/");
    parts.pop(); // Remove filename
    return parts.join("/");
  };

  // Recursive function to render the folder tree
  const renderFolderTree = (nodes: FolderNode[], currentDir: string) => {
    return nodes.map(node => (
      <React.Fragment key={node.key}>
        <li>
          <div 
            className={`w-full text-left px-2 py-2 hover:bg-gray-50 flex items-center 
              ${selectedDestination === node.path ? "bg-gray-100" : ""}
              ${currentDir === node.path ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ paddingLeft: `${node.depth * 1.25 + 0.5}rem` }}
          >
            <button
              onClick={() => toggleFolder(node.key)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 mr-1"
            >
              {node.isLoading ? (
                <div className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  style={{ 
                    transform: node.expanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.2s'
                  }}
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              )}
            </button>
            
            <button
              className="flex-1 flex items-center"
              onClick={() => {
                if (currentDir !== node.path) {
                  setSelectedDestination(node.path);
                }
              }}
              disabled={currentDir === node.path}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4 text-gray-400"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              <span className="text-sm text-gray-700">
                {node.name}
                {currentDir === node.path && " (Current Location)"}
              </span>
            </button>
          </div>
        </li>
        
        {/* Render children if expanded */}
        {node.expanded && node.children.length > 0 && (
          <ul>
            {renderFolderTree(node.children, currentDir)}
          </ul>
        )}
        
        {/* Show message if expanded but no children */}
        {node.expanded && node.children.length === 0 && node.isLoaded && (
          <li style={{ paddingLeft: `${(node.depth + 1) * 1.25 + 0.5}rem` }} className="py-1">
            <span className="text-xs text-gray-500">No subfolders</span>
          </li>
        )}
      </React.Fragment>
    ));
  };

  if (!item) return null;

  const currentDir = getCurrentDirectory(item.key);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium">Move Item</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Destination
          </label>

          <ScrollArea className="h-60 border border-gray-300 rounded-md">
            <ul className="divide-y divide-gray-200">
              {/* Root folder option */}
              <li>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center ${
                    selectedDestination === "" ? "bg-gray-100" : ""
                  } ${currentDir === "" ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => setSelectedDestination("")}
                  disabled={currentDir === ""}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4 text-gray-400"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    Home (Root)
                    {currentDir === "" && " (Current Location)"}
                  </span>
                </button>
              </li>
              
              {/* Interactive folder tree */}
              {renderFolderTree(folderTree, currentDir)}
              
              {folders.length === 0 && (
                <li className="px-4 py-2 text-sm text-gray-500">
                  No folders available
                </li>
              )}
            </ul>
          </ScrollArea>

          {selectedDestination && (
            <p className="mt-4 text-sm text-gray-500">
              Selected destination: <span className="font-medium">{selectedDestination || "Root"}</span>
            </p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={currentDir === selectedDestination || (!selectedDestination && currentDir !== "")}
            className="ml-3"
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveModal;
