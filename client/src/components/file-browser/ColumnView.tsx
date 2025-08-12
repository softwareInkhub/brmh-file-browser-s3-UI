import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from "lucide-react";
import { TreeNode } from "../../types";
import { getFolderHierarchy } from "../../lib/s3Service";
import { getFileIcon } from "../../lib/mimeTypes";

interface ColumnViewProps {
  onFileClick: (file: TreeNode) => void;
  onFolderClick: (folder: TreeNode) => void;
  currentPath: string;
}

const ColumnView: React.FC<ColumnViewProps> = ({
  onFileClick,
  onFolderClick,
  currentPath,
}) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Fetch initial tree data and refresh when current path changes
  useEffect(() => {
    fetchTreeData();
  }, [currentPath]);

  const fetchTreeData = useCallback(async () => {
    try {
      // Use current path as prefix to get the correct data for the current directory
      const result = await getFolderHierarchy(currentPath);
      setTreeData(result.nodes);
    } catch (error) {
      console.error("Error fetching tree data:", error);
    }
  }, [currentPath]);

  const fetchChildren = useCallback(async (nodeKey: string) => {
    try {
      setLoadingNodes(prev => new Set(prev).add(nodeKey));
      const result = await getFolderHierarchy(nodeKey);
      
      setTreeData(prev => {
        const updateNode = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(node => {
            if (node.key === nodeKey) {
              return {
                ...node,
                children: result.nodes,
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
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeKey);
        return newSet;
      });
    }
  }, []);

  const toggleNode = useCallback((node: TreeNode) => {
    if (node.type === 'folder') {
      const newExpanded = new Set(expandedNodes);
      
      if (newExpanded.has(node.key)) {
        newExpanded.delete(node.key);
      } else {
        newExpanded.add(node.key);
        // Fetch children if not already loaded
        if (!node.children || node.children.length === 0) {
          fetchChildren(node.key);
        }
      }
      
      setExpandedNodes(newExpanded);
    }
  }, [expandedNodes, fetchChildren]);

  const handleNodeClick = useCallback((node: TreeNode) => {
    if (node.type === 'folder') {
      onFolderClick(node);
    } else {
      onFileClick(node);
    }
  }, [onFileClick, onFolderClick]);

  const renderNode = useCallback((node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.key);
    const isLoading = loadingNodes.has(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const canExpand = node.type === 'folder' && (hasChildren || !node.children);

    return (
      <div key={node.key} className="select-none">
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer rounded ${
            currentPath === node.key ? 'bg-blue-50 text-blue-600' : ''
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
  }, [expandedNodes, loadingNodes, currentPath, handleNodeClick, toggleNode]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900">Explorer</h3>
      </div>
      
      {/* Tree content */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {treeData.map(node => renderNode(node))}
        </div>
      </div>
    </div>
  );
};

export default ColumnView;
