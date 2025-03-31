import 'dotenv/config'; // Load .env file first
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Robust environment variable handling for AWS configuration
const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Validate required environment variables
if (!region || !bucketName || !accessKeyId || !secretAccessKey) {
  console.error('Missing required AWS configuration. Please check your .env file.');
  console.error('Required variables:', {
    AWS_REGION: region ? '✓' : '✗',
    AWS_BUCKET_NAME: bucketName ? '✓' : '✗',
    AWS_ACCESS_KEY_ID: accessKeyId ? '✓' : '✗',
    AWS_SECRET_ACCESS_KEY: secretAccessKey ? '✓' : '✗'
  });
  process.exit(1);
}

// Log AWS configuration for debugging (safely)
console.log('AWS Config:', {
  region,
  bucketName,
  accessKeyIdExists: !!accessKeyId,
  secretAccessKeyExists: !!secretAccessKey,
  environment: process.env.NODE_ENV || 'development',
  endpoint: `https://${bucketName}.s3.${region}.amazonaws.com`
});

// Log detailed variable info for troubleshooting, but safely mask sensitive data
console.log('Environment variables status:', {
  AWS_REGION: !!process.env.AWS_REGION ? 'Set ✓' : 'Not set ✗',
  REGION: !!process.env.REGION ? 'Set ✓' : 'Not set ✗',
  AWS_BUCKET_NAME: !!process.env.AWS_BUCKET_NAME ? 'Set ✓' : 'Not set ✗',
  BUCKET_NAME: !!process.env.BUCKET_NAME ? 'Set ✓' : 'Not set ✗',
  AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID ? 'Set ✓' : 'Not set ✗',
  ACCESS_KEY_ID: !!process.env.ACCESS_KEY_ID ? 'Set ✓' : 'Not set ✗',
  AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY ? 'Set ✓' : 'Not set ✗',
  SECRET_ACCESS_KEY: !!process.env.SECRET_ACCESS_KEY ? 'Set ✓' : 'Not set ✗',
  NODE_ENV: process.env.NODE_ENV || 'Not set ✗'
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handling middleware with detailed logging
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Create a detailed error log for troubleshooting
    console.error(`[ERROR] ${req.method} ${req.path} - Status ${status}`);
    console.error(`Message: ${message}`);
    
    if (err.stack) {
      console.error(`Stack: ${err.stack}`);
    }
    
    // Log additional context for AWS/S3 errors
    if (err.name && (err.name.includes('AWS') || err.name.includes('S3'))) {
      console.error('AWS Error Details:', {
        errorName: err.name,
        errorCode: err.$metadata?.httpStatusCode,
        requestId: err.$metadata?.requestId,
        cfId: err.$metadata?.cfId,
        extendedRequestId: err.$metadata?.extendedRequestId,
      });
    }
    
    // Create clean client response
    const clientResponse = { 
      message,
      statusCode: status,
      path: req.path,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    };
    
    // Send error response to client
    res.status(status).json(clientResponse);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable or default to port 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Start the server with simplified configuration
  server.listen(port, () => {
    log(`Server is running on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please free up port ${port} or configure a different port in the environment.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });
})();
