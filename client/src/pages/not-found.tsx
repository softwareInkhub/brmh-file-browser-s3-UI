import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw, CloudOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";

export interface NotFoundProps {
  title?: string;
  message?: string;
  errorDetails?: string;
  isApiError?: boolean;
}

export default function NotFound({
  title = "404 Page Not Found",
  message = "The page you are looking for doesn't exist or has been moved.",
  errorDetails,
  isApiError = false
}: NotFoundProps) {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState<number | null>(null);

  // If this is an API error, set a 5-second countdown to retry
  useEffect(() => {
    if (isApiError && countdown === null) {
      setCountdown(5);
    }
    
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Refresh the page when countdown reaches 0
      window.location.reload();
    }
  }, [isApiError, countdown]);
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            {isApiError ? (
              <CloudOff className="h-8 w-8 text-amber-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          
          {errorDetails && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-gray-700 font-mono overflow-auto max-h-32">
              {errorDetails}
            </div>
          )}
          
          {isApiError && countdown !== null && countdown > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Retrying in <span className="font-bold">{countdown}</span> seconds...
              </p>
              <div className="mt-2 flex justify-center">
                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRetry} 
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button 
            onClick={handleGoHome} 
            className="flex-1"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
