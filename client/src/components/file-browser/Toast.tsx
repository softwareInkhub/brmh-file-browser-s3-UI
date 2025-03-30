import React from "react";
import { ToastProvider } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export { ToastProvider, useToast, Toaster };

// This is a wrapper component to provide toast utilities
// We re-export the necessary components from shadcn UI toast
// The actual implementation is in hooks/use-toast.ts and ui/toast.tsx
