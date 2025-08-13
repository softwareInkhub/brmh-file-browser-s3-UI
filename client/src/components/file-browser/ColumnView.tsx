import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { TreeNode } from "../../types";
import { listFiles } from "../../lib/s3Service";
import { getFileIcon } from "../../lib/mimeTypes";

interface ColumnViewProps {
  onFileClick: (file: TreeNode) => void;
  onFolderClick: (folder: TreeNode) => void;
  currentPath: string;
  selectedPath?: string;
  onPathChange?: (path: string) => void;
}

const ColumnView: React.FC<ColumnViewProps> = ({
  onFileClick,
  onFolderClick,
  currentPath,
  selectedPath = "",
  onPathChange,
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<TreeNode | null>(null);

  // Helper function to find a node by path
  const findNodeByPath = useCallback((nodes: TreeNode[], path: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.key === path) {
        return node;
      }
      if (node.children) {
        const found = findNodeByPath(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const fetchTreeData = useCallback(async (prefix: string) => {
    try {
      setLoadingNodes(prev => new Set(prev).add(prefix));
      
      // Use the same S3 service as Grid/List views
      const result = await listFiles(prefix);
      
      // Convert S3Objects to TreeNodes
      const folders: TreeNode[] = result.folders.map(folder => ({
        key: folder.key,
        name: folder.name || folder.key.split('/').filter(Boolean).pop() || folder.key,
        type: 'folder' as const,
        size: 0,
        lastModified: folder.lastModified,
        children: [],
        isExpanded: false,
        isLoading: false
      }));

      const files: TreeNode[] = result.files.map(file => ({
        key: file.key,
        name: file.name || file.key.split('/').pop() || file.key,
        type: 'file' as const,
        size: file.size,
        lastModified: file.lastModified,
        etag: file.etag
      }));

      // Sort: folders A-Z, then files A-Z
      const sortedNodes = [...folders, ...files].sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });

      if (prefix === "") {
        // Root level - set the tree data
        setTreeData(sortedNodes);
      } else {
        // Update the specific node's children
        setTreeData(prev => {
          const updateNode = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
              if (node.key === prefix) {
                return {
                  ...node,
                  children: sortedNodes,
                  isLoading: false
                };
              }
              if (node.children) {
                return {
                  ...node,
                  children: updateNode(node.children)
                };
              }
              return node;
            });
          };
          return updateNode(prev);
        });
      }
    } catch (error) {
      console.error("Error fetching tree data:", error);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(prefix);
        return newSet;
      });
    }
  }, []);

  // Fetch initial tree data and refresh when current path changes
  useEffect(() => {
    fetchTreeData("");
  }, [fetchTreeData]);

  // Expand tree to show selected path
  useEffect(() => {
    if (selectedPath && selectedPath !== "") {
      const pathParts = selectedPath.split("/").filter(Boolean);
      const newExpanded = new Set(expandedNodes);
      
      // Expand all parent folders in the path
      let currentPath = "";
      for (let i = 0; i < pathParts.length; i++) {
        currentPath += pathParts[i] + "/";
        newExpanded.add(currentPath);
        
        // Fetch data for this path if not already loaded
        const existingNode = findNodeByPath(treeData, currentPath);
        if (!existingNode || !existingNode.children || existingNode.children.length === 0) {
          fetchTreeData(currentPath);
        }
      }
      
      setExpandedNodes(newExpanded);
    }
  }, [selectedPath, expandedNodes, treeData, fetchTreeData, findNodeByPath]);

  const toggleNode = useCallback((node: TreeNode) => {
    if (node.type === 'folder') {
      const newExpanded = new Set(expandedNodes);
      
      if (newExpanded.has(node.key)) {
        // Collapse
        newExpanded.delete(node.key);
      } else {
        // Expand
        newExpanded.add(node.key);
        // Fetch children if not already loaded
        if (!node.children || node.children.length === 0) {
          fetchTreeData(node.key);
        }
      }
      
      setExpandedNodes(newExpanded);
    }
  }, [expandedNodes, fetchTreeData]);

  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.type === 'folder') {
      // For folders, toggle expand/collapse and update selected path
      toggleNode(node);
      if (onPathChange) {
        onPathChange(node.key);
      }
    } else {
      // For files, select for preview and update selected path to parent folder
      setSelectedFile(node);
      onFileClick(node);
      if (onPathChange) {
        // Get parent folder path from file key
        const parentPath = node.key.substring(0, node.key.lastIndexOf('/') + 1);
        onPathChange(parentPath);
      }
    }
  }, [toggleNode, onFileClick, onPathChange]);

  const renderNode = useCallback((node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.key);
    const isLoading = loadingNodes.has(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.type === 'folder';
    const isSelected = selectedPath === node.key || selectedFile?.key === node.key;

    return (
      <div key={node.key} className="select-none">
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded ${
            isSelected ? 'bg-blue-50 text-blue-600' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Expand/Collapse button */}
          {canExpand && (
            <button
              className="w-4 h-4 mr-1 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node);
              }}
            >
              {isLoading ? (
                <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          {/* Icon */}
          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            {node.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )
            ) : (
              getFileIcon(node.name)
            )}
          </div>
          
          {/* Name */}
          <span className="text-sm truncate flex-1" title={node.name}>
            {node.name}
          </span>
        </div>
        
        {/* Children */}
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, loadingNodes, selectedFile, handleNodeClick, toggleNode]);

  return (
    <div 
      className="w-64 bg-white border-r border-gray-200 flex flex-col"
      style={{ 
        height: 'calc(100vh - 120px)', // Full viewport height minus tab bar and home bar
        minHeight: 'calc(100vh - 120px)' // Ensure minimum height is maintained
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-900">Explorer</h3>
      </div>
      
      {/* Tree content with independent scrolling */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-thin"
        style={{ 
          overscrollBehavior: 'contain', // Prevent scroll chaining to main page
          scrollBehavior: 'smooth' // Enable smooth scrolling
        }}
      >
        <div className="py-2">
          {treeData.map(node => renderNode(node))}
        </div>
      </div>
    </div>
  );
};

export default ColumnView;
