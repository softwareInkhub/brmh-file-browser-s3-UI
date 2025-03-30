import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { S3Object } from "../../types";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  item?: S3Object;
  isPermanent?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  item,
  isPermanent = false,
}) => {
  if (!item) return null;

  // Get item name from key
  const getItemName = (key: string): string => {
    return key.split("/").pop() || key;
  };

  const isFolder = item.isFolder || item.key.endsWith('/');
  const itemName = getItemName(item.key);
  
  const [confirmText, setConfirmText] = useState("");
  const isConfirmValid = confirmText === itemName;

  const handleDelete = () => {
    if (isConfirmValid) {
      onDelete();
      setConfirmText(""); // Reset confirmation text after deletion
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setConfirmText(""); // Reset confirmation text when closing dialog
        onClose();
      }
    }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">
              {isPermanent ? "Delete Permanently" : "Delete Item"}
            </DialogTitle>
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
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-red-600"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                Are you sure you want to delete this {isFolder ? 'folder' : 'file'}?
              </h3>
              {isPermanent ? (
                <p className="text-sm text-gray-500 mt-1">
                  This will permanently delete "{itemName}". This action cannot be undone.
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  This will move "{itemName}" to trash. You can restore it later from the trash folder.
                </p>
              )}
              {isFolder && (
                <p className="text-sm text-red-500 mt-1">
                  All files and subfolders within this folder will also be {isPermanent ? "permanently deleted" : "moved to trash"}.
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <Label htmlFor="confirm-text" className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="font-semibold">{itemName}</span> to confirm
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full"
              autoComplete="off"
              spellCheck="false"
            />
            {confirmText && !isConfirmValid && (
              <p className="text-sm text-red-500 mt-1">
                The confirmation text does not match
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid}
            className="ml-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-1.5"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;
