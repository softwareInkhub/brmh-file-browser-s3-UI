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

  // Expand path to current location
  const expandPathToCurrent = useCallback(async (targetPath: string) => {
    if (!targetPath) return;

    const pathSegments = targetPath.split('/').filter(Boolean);
    let accumulatedPath = "";
    const pathsToExpand: string[] = [];

    // Build the path segments to expand
    for (const segment of pathSegments) {
      accumulatedPath += segment + '/';
      pathsToExpand.push(accumulatedPath);
    }

    // Expand each path segment
    for (const path of pathsToExpand) {
      if (!expandedNodes.has(path)) {
        await fetchTreeData(path);
        setExpandedNodes(prev => new Set(prev).add(path));
      }
    }
  }, [expandedNodes]);

  // Expand path when currentPath changes
  useEffect(() => {
    if (currentPath) {
      expandPathToCurrent(currentPath);
    }
  }, [currentPath, expandPathToCurrent]);

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
      console.error('Error fetching tree data:', error);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(prefix);
        return newSet;
      });
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchTreeData("");
  }, [fetchTreeData]);

  const toggleNode = useCallback(async (node: TreeNode) => {
    if (node.type === 'folder') {
      const isExpanded = expandedNodes.has(node.key);
      
      if (isExpanded) {
        // Collapse
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(node.key);
          return newSet;
        });
      } else {
        // Expand
        if (!node.children || node.children.length === 0) {
          await fetchTreeData(node.key);
        }
        setExpandedNodes(prev => new Set(prev).add(node.key));
      }
    }
  }, [expandedNodes, fetchTreeData]);

  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.type === 'folder') {
      toggleNode(node);
      onFolderClick?.(node);
    } else {
      setSelectedFile(node);
      onFileClick(node);
    }
  }, [toggleNode, onFolderClick, onFileClick]);

  const renderNode = useCallback((node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.key);
    const isLoading = loadingNodes.has(node.key);
    const isSelected = selectedFile?.key === node.key;
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.type === 'folder' && (hasChildren || !isExpanded);

    return (
      <div key={node.key} className="select-none">
        <div
          className={`
            flex items-center px-3 py-2 text-sm cursor-pointer rounded-md transition-colors
            ${isSelected 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'hover:bg-gray-50 text-gray-700'
            }
          `}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {/* Expand/Collapse Icon */}
          {node.type === 'folder' && (
            <div className="w-4 h-4 mr-2 flex items-center justify-center">
              {isLoading ? (
                <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : canExpand ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )
              ) : (
                <div className="w-4 h-4"></div>
              )}
            </div>
          )}
          
          {/* File/Folder Icon */}
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
          <span className="truncate flex-1">{node.name}</span>
        </div>
        
        {/* Children */}
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, loadingNodes, selectedFile, handleNodeClick]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-2">
        {treeData.map(node => renderNode(node))}
      </div>
    </div>
  );
};

export default ColumnView;
