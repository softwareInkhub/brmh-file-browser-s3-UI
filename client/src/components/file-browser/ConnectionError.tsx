import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { checkS3Health } from '@/lib/s3Service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, AlertCircle, FileWarning, RefreshCw, Settings, HelpCircle } from 'lucide-react';

interface ConnectionErrorProps {
  title: string;
  message: string;
  errorDetails?: string;
  onRetry: () => void;
  onConfigHelp: () => void;
}

export default function ConnectionError({
  title,
  message,
  errorDetails,
  onRetry,
  onConfigHelp
}: ConnectionErrorProps) {
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const healthCheck = await checkS3Health();
      setDiagnosticsResult(healthCheck);
      setIsDiagnosticsOpen(true);
    } catch (error) {
      setDiagnosticsResult({
        status: 'error',
        message: 'Failed to run diagnostics',
        error: (error as Error).message,
        diagnostics: {
          errorType: 'client',
          errorDetails: (error as Error).message
        }
      });
      setIsDiagnosticsOpen(true);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center text-amber-500 mb-2">
            <AlertTriangle className="w-10 h-10 mr-2" />
            <CardTitle className="text-2xl font-bold text-gray-800">{title}</CardTitle>
          </div>
          <CardDescription className="text-base text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorDetails && (
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[200px] text-sm font-mono">
              <div className="flex items-center text-red-500 mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Error Details:</span>
              </div>
              <p className="whitespace-pre-wrap text-gray-700">{errorDetails}</p>
            </div>
          )}

          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FileWarning className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Possible causes:</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Invalid AWS credentials (Access Key or Secret Key)</li>
                    <li>Incorrect S3 bucket name</li>
                    <li>Incorrect AWS region configuration</li>
                    <li>Insufficient permissions to access the bucket</li>
                    <li>Network connectivity issues</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between space-y-3 sm:space-y-0 pt-2">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onRetry}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
            <Button
              variant="outline"
              onClick={runDiagnostics}
              disabled={isRunningDiagnostics}
              className="flex items-center"
            >
              {isRunningDiagnostics ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings className="mr-2 h-4 w-4" />
              )}
              Run Diagnostics
            </Button>
          </div>
          <Button 
            onClick={onConfigHelp}
            className="flex items-center"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Configuration Help
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isDiagnosticsOpen} onOpenChange={setIsDiagnosticsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>S3 Connection Diagnostics</DialogTitle>
            <DialogDescription>
              Results from checking your AWS S3 connection
            </DialogDescription>
          </DialogHeader>
          
          {diagnosticsResult && (
            <div className="max-h-[60vh] overflow-auto">
              <div className={`p-4 mb-4 rounded-md ${
                diagnosticsResult.status === 'healthy' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="font-semibold">{diagnosticsResult.message}</div>
                {diagnosticsResult.error && <div className="text-sm mt-1">{diagnosticsResult.error}</div>}
              </div>
              
              {diagnosticsResult.diagnostics && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700">Diagnostic Information:</h3>
                  
                  {diagnosticsResult.diagnostics.region && (
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Region:</div>
                      <div className="w-2/3">{diagnosticsResult.diagnostics.region}</div>
                    </div>
                  )}
                  
                  {diagnosticsResult.diagnostics.bucketName && (
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Bucket:</div>
                      <div className="w-2/3">{diagnosticsResult.diagnostics.bucketName}</div>
                    </div>
                  )}
                  
                  {diagnosticsResult.diagnostics.endpointUsed && (
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Endpoint:</div>
                      <div className="w-2/3 break-all">{diagnosticsResult.diagnostics.endpointUsed}</div>
                    </div>
                  )}
                  
                  {diagnosticsResult.diagnostics.errorType && (
                    <div className="flex">
                      <div className="w-1/3 font-medium text-gray-500">Error Type:</div>
                      <div className="w-2/3">{diagnosticsResult.diagnostics.errorType}</div>
                    </div>
                  )}
                  
                  {diagnosticsResult.diagnostics.recommendations && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-gray-700 mb-2">Recommendations:</h3>
                      <ul className="list-disc pl-5 space-y-2">
                        {diagnosticsResult.diagnostics.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-gray-600">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDiagnosticsOpen(false)}>Close</Button>
            <Button onClick={runDiagnostics} variant="outline">
              {isRunningDiagnostics ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Again
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}