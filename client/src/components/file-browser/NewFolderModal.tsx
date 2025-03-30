import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string) => void;
  currentPath: string;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
  currentPath,
}) => {
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFolderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
    
    // Validate folder name
    if (e.target.value.trim() === "") {
      setError("Folder name cannot be empty");
    } else if (e.target.value.includes("/") || e.target.value.includes("\\")) {
      setError("Folder name cannot contain slashes");
    } else {
      setError(null);
    }
  };

  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      setError("Folder name cannot be empty");
      return;
    }

    if (folderName.includes("/") || folderName.includes("\\")) {
      setError("Folder name cannot contain slashes");
      return;
    }

    onCreateFolder(folderName);
    setFolderName("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !error && folderName.trim()) {
      handleCreateFolder();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">Create New Folder</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="space-y-3">
            {currentPath && (
              <div className="text-sm text-gray-500 mb-2">
                Location: <span className="font-medium">{currentPath}</span>
              </div>
            )}
            <Label htmlFor="folderName" className="text-sm font-medium text-gray-700">
              Folder Name
            </Label>
            <Input
              type="text"
              id="folderName"
              value={folderName}
              onChange={handleFolderNameChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter folder name"
              autoFocus
              className={error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateFolder}
            disabled={!!error || !folderName.trim()}
            className="ml-3"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewFolderModal;
