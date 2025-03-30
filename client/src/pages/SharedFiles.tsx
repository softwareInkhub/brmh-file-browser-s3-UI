import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, ExternalLink, Trash, RefreshCw, RotateCw } from "lucide-react";
import { listSharedFiles, shareFile } from "../lib/s3Service";
import { useToast } from "../hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Define the shape of shared file items
interface SharedFileItem {
  shareId: string;
  fileKey: string;
  fileName: string;
  expiresAt: Date;
  createdAt: Date;
  url?: string;
}

export default function SharedFiles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  
  // Fetch shared files
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/files/shared"],
    queryFn: async () => {
      const response = await listSharedFiles();
      return response.sharedFiles;
    },
  });
  
  // Mutation to regenerate a share URL
  const regenerateMutation = useMutation({
    mutationFn: async (fileKey: string) => {
      const result = await shareFile(fileKey);
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Link Regenerated",
        description: "New share link has been generated successfully"
      });
      
      // Invalidate the shared files query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/files/shared"] });
      setRegeneratingId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to regenerate link: ${(error as Error).message}`,
        variant: "destructive"
      });
      setRegeneratingId(null);
    }
  });
  
  // Handle regenerating a share link
  const handleRegenerateLink = (file: SharedFileItem) => {
    setRegeneratingId(file.shareId);
    regenerateMutation.mutate(file.fileKey);
  };
  
  // Handle copy URL to clipboard
  const handleCopyUrl = (url: string | undefined) => {
    if (!url) {
      toast({
        title: "Error",
        description: "No share URL available",
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    });
  };
  
  // Handle open link in new tab
  const handleOpenLink = (url: string | undefined) => {
    if (!url || url.startsWith('#')) {
      toast({
        title: "Error",
        description: "No share URL available",
        variant: "destructive",
      });
      return;
    }
    window.open(url, "_blank");
  };
  
  // Calculate and format time remaining until expiration
  const getTimeRemaining = (expiryDate: Date): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };
  
  // Format date for display
  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  };
  
  // Map API data to proper type, add any missing fields, and filter based on search term
  const filteredSharedFiles: SharedFileItem[] = data
    ? data.map(file => ({
        shareId: file.shareId,
        fileKey: file.fileKey,
        fileName: file.fileName,
        expiresAt: file.expiresAt,
        createdAt: file.createdAt,
        url: (file as any).url || `#share-${file.shareId}` // Add placeholder URL if not provided by API
      })).filter(file =>
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shared Files</h1>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h3 className="font-semibold">Error Loading Shared Files</h3>
          <p className="mt-1 text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shared Files</h1>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <div className="mb-6">
        <Input
          placeholder="Search shared files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading shared files...</span>
        </div>
      ) : filteredSharedFiles.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            <ExternalLink className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No shared files found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchTerm
              ? "No files match your search. Try different keywords."
              : "You haven't shared any files yet. Share files from the file browser."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSharedFiles.map((file: SharedFileItem) => (
            <Card key={file.shareId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="truncate text-lg" title={file.fileName}>
                  {file.fileName}
                </CardTitle>
                <CardDescription className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {getTimeRemaining(file.expiresAt)}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span>{formatDateTime(file.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Expires:</span>
                    <span>{formatDateTime(file.expiresAt)}</span>
                  </div>
                  <div className="mt-3 truncate rounded bg-gray-100 p-2 font-mono text-xs">
                    {file.url}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCopyUrl(file.url)}
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenLink(file.url)}
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Open
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleRegenerateLink(file)}
                    disabled={regeneratingId === file.shareId}
                  >
                    {regeneratingId === file.shareId ? (
                      <>
                        <RotateCw className="mr-1 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RotateCw className="mr-1 h-4 w-4" />
                        Regenerate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}