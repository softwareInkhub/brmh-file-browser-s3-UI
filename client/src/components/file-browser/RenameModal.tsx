import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { S3Object } from "../../types";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  item?: S3Object;
}

const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  onRename,
  item,
}) => {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      const name = item.key.split("/").pop() || item.key;
      setNewName(name);
    }
  }, [item]);

  const handleNewNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    
    // Validate new name
    if (e.target.value.trim() === "") {
      setError("Name cannot be empty");
    } else if (e.target.value.includes("/") || e.target.value.includes("\\")) {
      setError("Name cannot contain slashes");
    } else {
      setError(null);
    }
  };

  const handleRename = () => {
    if (!newName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    if (newName.includes("/") || newName.includes("\\")) {
      setError("Name cannot contain slashes");
      return;
    }

    onRename(newName);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !error && newName.trim()) {
      handleRename();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium">Rename Item</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="space-y-3">
            <Label htmlFor="newName" className="text-sm font-medium text-gray-700">
              New Name
            </Label>
            <Input
              type="text"
              id="newName"
              value={newName}
              onChange={handleNewNameChange}
              onKeyDown={handleKeyDown}
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
            onClick={handleRename}
            disabled={!!error || !newName.trim()}
            className="ml-3"
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameModal;
