import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { S3Object } from "../../types";
import { shareFile } from "../../lib/s3Service";
import { Copy, Loader2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: S3Object;
}

const ShareFileModal: React.FC<ShareFileModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState("3600"); // Default: 1 hour
  const [copied, setCopied] = useState(false);

  // Reset state when modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setShareUrl(null);
      setCopied(false);
      setExpiresIn("3600");
    }
  }, [isOpen]);

  // Generate a share link when the component mounts or when expiration changes
  const handleGenerateLink = async () => {
    if (!file) return;
    
    try {
      setIsLoading(true);
      setShareUrl(null);
      
      const result = await shareFile(file.key, parseInt(expiresIn));
      setShareUrl(result.url);
    } catch (error) {
      console.error("Error generating share link:", error);
      toast({
        title: "Error",
        description: `Failed to generate share link: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Copy the share URL to clipboard
  const handleCopyToClipboard = () => {
    if (!shareUrl) return;
    
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    
    toast({
      title: "Link Copied",
      description: "The share link has been copied to your clipboard."
    });
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Format the expiration time for display
  const formatExpiration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
    return `${Math.floor(seconds / 86400)} days`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>File</Label>
            <div className="rounded bg-muted p-2 text-sm">
              {file?.name || file?.key?.split("/").pop() || "Selected file"}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expiration">Link Expiration</Label>
            <Select value={expiresIn} onValueChange={setExpiresIn}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiration time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="86400">24 hours</SelectItem>
                <SelectItem value="259200">3 days</SelectItem>
                <SelectItem value="604800">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {!shareUrl && (
            <Button 
              onClick={handleGenerateLink} 
              disabled={isLoading || !file}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Share Link"
              )}
            </Button>
          )}
          
          {shareUrl && (
            <div className="space-y-2">
              <Label htmlFor="link">Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="link"
                  value={shareUrl}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCopyToClipboard}
                  className={copied ? "text-green-500" : ""}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in {formatExpiration(parseInt(expiresIn))}.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          {shareUrl && (
            <Button
              variant="outline"
              onClick={handleGenerateLink}
              disabled={isLoading}
              className="mt-2 sm:mt-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate Link"
              )}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFileModal;