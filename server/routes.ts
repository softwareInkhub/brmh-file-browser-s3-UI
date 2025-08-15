import type { Express } from "express";
import { createServer, type Server } from "http";
import https from "https";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import multer from "multer";
import archiver from "archiver";
import cors from "cors";
import { z } from "zod";

// Create a custom HTTPS agent that ignores SSL certificate validation
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

import { getFileCategoryFromName, isTextViewable, getMimeTypeFromExtension } from "../client/src/lib/mimeTypes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure S3 client with environment variables
  // Use environment variables for region and bucket name with appropriate defaults
  const region = process.env.AWS_REGION || process.env.REGION || "ap-south-1"; // Default to ap-south-1 based on error messages
  const bucketName = process.env.AWS_BUCKET_NAME || process.env.BUCKET_NAME || "file-browser";
  
  // Print AWS credential details for debugging (safely)
  console.log("AWS Credentials:", {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 3)}...` : 
                (process.env.ACCESS_KEY_ID ? `${process.env.ACCESS_KEY_ID.substring(0, 3)}...` : 'undefined'),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 3)}...` : 
                    (process.env.SECRET_ACCESS_KEY ? `${process.env.SECRET_ACCESS_KEY.substring(0, 3)}...` : 'undefined'),
    bucketName,
    region
  });
  
  // Create a simple file system mock for development
  // Create a comprehensive set of mock files for the file browser demo
  const mockFiles = [
    // Documents folder
    {
      key: 'documents/annual_report_2024.pdf',
      name: 'annual_report_2024.pdf',
      size: 1024 * 1024 * 3.7, // 3.7 MB
      lastModified: new Date(Date.now() - 86400000 * 2), // 2 days ago
      type: 'PDF',
      etag: 'mock-etag-doc-1'
    },
    {
      key: 'documents/project_proposal.docx',
      name: 'project_proposal.docx',
      size: 1024 * 1024 * 1.2, // 1.2 MB
      lastModified: new Date(Date.now() - 86400000 * 5), // 5 days ago
      type: 'Word',
      etag: 'mock-etag-doc-2'
    },
    {
      key: 'documents/company_presentation.pptx',
      name: 'company_presentation.pptx',
      size: 1024 * 1024 * 8.1, // 8.1 MB
      lastModified: new Date(Date.now() - 86400000 * 1), // 1 day ago
      type: 'PowerPoint',
      etag: 'mock-etag-doc-3'
    },
    {
      key: 'documents/financial_data.xlsx',
      name: 'financial_data.xlsx',
      size: 1024 * 1024 * 2.3, // 2.3 MB
      lastModified: new Date(Date.now() - 86400000 * 3), // 3 days ago
      type: 'Excel',
      etag: 'mock-etag-doc-4'
    },
    {
      key: 'documents/contracts/contract_template.docx',
      name: 'contract_template.docx',
      size: 1024 * 450, // 450 KB
      lastModified: new Date(Date.now() - 86400000 * 10), // 10 days ago
      type: 'Word',
      etag: 'mock-etag-doc-5'
    },
    {
      key: 'documents/contracts/client_agreement.pdf',
      name: 'client_agreement.pdf',
      size: 1024 * 780, // 780 KB
      lastModified: new Date(Date.now() - 86400000 * 6), // 6 days ago
      type: 'PDF',
      etag: 'mock-etag-doc-6'
    },
    
    // Images folder
    {
      key: 'images/company_logo.png',
      name: 'company_logo.png',
      size: 1024 * 85, // 85 KB
      lastModified: new Date(Date.now() - 86400000 * 20), // 20 days ago
      type: 'PNG',
      etag: 'mock-etag-img-1'
    },
    {
      key: 'images/team_photo.jpg',
      name: 'team_photo.jpg',
      size: 1024 * 350, // 350 KB
      lastModified: new Date(Date.now() - 86400000 * 7), // 7 days ago
      type: 'JPEG',
      etag: 'mock-etag-img-2'
    },
    {
      key: 'images/product_banner.jpg',
      name: 'product_banner.jpg',
      size: 1024 * 520, // 520 KB
      lastModified: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      type: 'JPEG',
      etag: 'mock-etag-img-3'
    },
    {
      key: 'images/screenshots/dashboard.png',
      name: 'dashboard.png',
      size: 1024 * 220, // 220 KB
      lastModified: new Date(Date.now() - 3600000 * 5), // 5 hours ago
      type: 'PNG',
      etag: 'mock-etag-img-4'
    },
    {
      key: 'images/screenshots/mobile_app.png',
      name: 'mobile_app.png',
      size: 1024 * 185, // 185 KB
      lastModified: new Date(Date.now() - 3600000 * 6), // 6 hours ago
      type: 'PNG',
      etag: 'mock-etag-img-5'
    },
    {
      key: 'images/icons/file_icon.svg',
      name: 'file_icon.svg',
      size: 1024 * 12, // 12 KB
      lastModified: new Date(Date.now() - 86400000 * 15), // 15 days ago
      type: 'SVG',
      etag: 'mock-etag-img-6'
    },
    
    // Videos folder
    {
      key: 'videos/product_demo.mp4',
      name: 'product_demo.mp4',
      size: 1024 * 1024 * 28.4, // 28.4 MB
      lastModified: new Date(Date.now() - 86400000 * 4), // 4 days ago
      type: 'MP4',
      etag: 'mock-etag-vid-1'
    },
    {
      key: 'videos/company_intro.mp4',
      name: 'company_intro.mp4',
      size: 1024 * 1024 * 42.7, // 42.7 MB
      lastModified: new Date(Date.now() - 3600000 * 30), // 30 hours ago
      type: 'MP4',
      etag: 'mock-etag-vid-2'
    },
    {
      key: 'videos/interviews/ceo_interview.mov',
      name: 'ceo_interview.mov',
      size: 1024 * 1024 * 85.2, // 85.2 MB
      lastModified: new Date(Date.now() - 86400000 * 1), // 1 day ago
      type: 'MOV',
      etag: 'mock-etag-vid-3'
    },
    
    // Data folder
    {
      key: 'data/user_records.csv',
      name: 'user_records.csv',
      size: 1024 * 1024 * 1.8, // 1.8 MB
      lastModified: new Date(Date.now() - 3600000 * 3), // 3 hours ago
      type: 'CSV',
      etag: 'mock-etag-data-1'
    },
    {
      key: 'data/analytics.json',
      name: 'analytics.json',
      size: 1024 * 850, // 850 KB
      lastModified: new Date(Date.now() - 3600000), // 1 hour ago
      type: 'JSON',
      etag: 'mock-etag-data-2'
    },
    {
      key: 'data/research/market_research.xlsx',
      name: 'market_research.xlsx',
      size: 1024 * 1024 * 3.5, // 3.5 MB
      lastModified: new Date(Date.now() - 86400000 * 12), // 12 days ago
      type: 'Excel',
      etag: 'mock-etag-data-3'
    },
    {
      key: 'data/research/survey_results.txt',
      name: 'survey_results.txt',
      size: 1024 * 320, // 320 KB
      lastModified: new Date(Date.now() - 86400000 * 8), // 8 days ago
      type: 'Text',
      etag: 'mock-etag-data-4'
    }
  ];

  // Use the region from environment variables

  // Do not use mock data
  const useMockData = false;
  
  // Inspect environment variables and provide debug info for configuration troubleshooting
  // Check for required AWS environment variables and log status (not values for security)
  const awsConfig = {
    region: region,
    bucketName: bucketName,
    accessKeyIdExists: !!process.env.AWS_ACCESS_KEY_ID || !!process.env.ACCESS_KEY_ID,
    secretAccessKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY || !!process.env.SECRET_ACCESS_KEY,
    regionExists: !!process.env.AWS_REGION || !!process.env.REGION
  };
  console.log("AWS Config Status:", {
    ...awsConfig,
    usingMockData: useMockData
  });

  // Configure the S3 client with properly structured AWS configuration
  const s3Client = new S3Client({
    region: region, // Use the region from environment variables
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || "",
    },
    // Use path style addressing (bucket name in path instead of hostname)
    // This fixes the TLS certificate validation and permanent redirect issues
    forcePathStyle: true,
    // Proper endpoint structure for AWS S3
    endpoint: undefined, // Let the SDK construct the correct endpoint based on region
    // Increase timeouts for more reliable operations
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 8000, // 5 seconds
      socketTimeout: 30000, // 30 seconds
      httpsAgent: new https.Agent({
        keepAlive: true,
        maxSockets: 50, // Higher connection limit for performance
        rejectUnauthorized: true // Ensure TLS verification for security
      })
    })
  });
  
  // Log real S3 connection with region information
  console.log(`Connecting to S3 bucket: ${bucketName} in region ${region} using path-style addressing`);
  
  // Multer setup for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // Helper functions
  const getFileType = (key: string) => {
    const ext = path.extname(key).toLowerCase();
    const fileTypes: Record<string, string> = {
      '.pdf': 'PDF',
      '.doc': 'Word',
      '.docx': 'Word',
      '.xls': 'Excel',
      '.xlsx': 'Excel',
      '.ppt': 'PowerPoint',
      '.pptx': 'PowerPoint',
      '.jpg': 'JPEG',
      '.jpeg': 'JPEG',
      '.png': 'PNG',
      '.gif': 'GIF',
      '.txt': 'Text',
      '.csv': 'CSV',
      '.zip': 'ZIP',
      '.rar': 'RAR',
      '.mp3': 'MP3',
      '.mp4': 'MP4',
      '.mov': 'MOV',
    };
    return fileTypes[ext] || 'Unknown';
  };
  
  // Helper function to get mock file structure based on path
  const getMockFiles = (prefix: string = '') => {
    // Get all files that match the prefix path
    const matchingFiles = mockFiles.filter(file => {
      return file.key.startsWith(prefix) && (!prefix || file.key !== prefix);
    });
    
    // Extract unique folder paths
    const folderPaths: Set<string> = new Set();
    matchingFiles.forEach(file => {
      const pathParts = file.key.substring(prefix.length).split('/');
      if (pathParts.length > 1) {
        folderPaths.add(prefix + pathParts[0] + '/');
      }
    });
    
    // Create folder objects
    const folders = Array.from(folderPaths).map(path => ({
      key: path,
      name: path.split('/').filter(Boolean).pop() || path,
      isFolder: true,
      type: 'Folder',
      lastModified: null,
      size: 0
    }));
    
    // Filter files in the current directory level
    const files = matchingFiles.filter(file => {
      const relativePath = file.key.substring(prefix.length);
      return !relativePath.includes('/');
    });
    
    return {
      files,
      folders,
      prefix
    };
  };

  const isFolder = (key: string) => key.endsWith('/');

  // CORS middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Diagnostic endpoint to check AWS S3 connection health
  app.get('/api/health/s3', async (req, res) => {
    try {
      // Check credentials
      const credentialCheck = {
        accessKeyId: !!process.env.AWS_ACCESS_KEY_ID || !!process.env.ACCESS_KEY_ID,
        secretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY || !!process.env.SECRET_ACCESS_KEY,
        bucketName: process.env.AWS_BUCKET_NAME || process.env.BUCKET_NAME,
        region: process.env.AWS_REGION || process.env.REGION,
        isConfigured: (!!process.env.AWS_ACCESS_KEY_ID || !!process.env.ACCESS_KEY_ID) && 
                      (!!process.env.AWS_SECRET_ACCESS_KEY || !!process.env.SECRET_ACCESS_KEY) && 
                      (!!process.env.AWS_BUCKET_NAME || !!process.env.BUCKET_NAME) && 
                      (!!process.env.AWS_REGION || !!process.env.REGION)
      };

      // If not configured, return early with details
      if (!credentialCheck.isConfigured) {
        return res.status(503).json({
          status: 'error',
          message: 'AWS S3 is not properly configured',
          diagnostics: {
            ...credentialCheck,
            recommendations: [
              'Ensure all required environment variables are set: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME, AWS_REGION',
              'Check that the access key and secret key are valid and active',
              'Make sure the S3 bucket exists and is accessible'
            ]
          }
        });
      }

      // Test connection by listing a single item
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 1
      });

      const response = await s3Client.send(command);
      
      // Return success response with diagnostics
      return res.json({
        status: 'healthy',
        message: 'Successfully connected to AWS S3',
        diagnostics: {
          region: region,
          bucketName: bucketName,
          endpointUsed: `https://s3.${region}.amazonaws.com`,
          pathStyleAccess: true,
          objectCount: response.KeyCount || 0,
          responseTime: 'OK'
        }
      });
    } catch (error) {
      console.error('S3 health check failed:', error);
      
      // Parse error to provide helpful diagnostics
      const errorMsg = (error as Error).message || '';
      const isCredentialError = errorMsg.includes('InvalidAccessKeyId') || errorMsg.includes('SignatureDoesNotMatch');
      const isRegionError = errorMsg.includes('PermanentRedirect') || errorMsg.includes('region');
      const isBucketError = errorMsg.includes('NoSuchBucket') || errorMsg.includes('AllAccessDisabled');
      const isTlsError = errorMsg.includes('TLS') || errorMsg.includes('certificate') || errorMsg.includes('SSL');
      
      const recommendations = [];
      
      if (isCredentialError) {
        recommendations.push('Verify that your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct and active');
      }
      if (isRegionError) {
        recommendations.push(`Check that the region "${region}" is correct for your bucket. Try using the bucket's actual region.`);
      }
      if (isBucketError) {
        recommendations.push(`Confirm that the bucket "${bucketName}" exists and is accessible with your credentials`);
      }
      if (isTlsError) {
        recommendations.push('TLS/SSL certificate validation issues detected. Check your network configuration.');
      }
      
      if (recommendations.length === 0) {
        recommendations.push('Check AWS console for additional information about your S3 bucket status');
        recommendations.push('Verify that the IAM user has sufficient permissions to access this bucket');
      }
      
      // Return detailed error response
      return res.status(503).json({
        status: 'error',
        message: 'Failed to connect to AWS S3',
        error: errorMsg,
        diagnostics: {
          region: region,
          bucketName: bucketName,
          endpointUsed: `https://s3.${region}.amazonaws.com`,
          pathStyleAccess: true,
          errorType: isCredentialError ? 'credentials' : isRegionError ? 'region' : isBucketError ? 'bucket' : isTlsError ? 'tls' : 'unknown',
          recommendations
        }
      });
    }
  });

  // API routes
  // 1. List files
  app.get('/api/files', async (req, res) => {
    try {
      const prefix = req.query.prefix as string || '';
      
      if (useMockData) {
        // Use mock data
        console.log(`Using mock data for prefix: ${prefix}`);
        const mockResult = getMockFiles(prefix);
        return res.json(mockResult);
      }
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: '/',
        Prefix: prefix
      });

      const response = await s3Client.send(command);
      
      // Process folders (CommonPrefixes)
      const folders = (response.CommonPrefixes || []).map(prefix => {
        const key = prefix.Prefix || '';
        console.log('Processing folder prefix:', prefix, 'key:', key);
        return {
          key,
          name: key.split('/').filter(Boolean).pop() || key,
          isFolder: true,
          type: 'Folder',
          lastModified: null,
          size: 0,
          etag: '' // Add etag property for folders
        };
      });

      // Process files (Contents)
      const files = (response.Contents || [])
        .filter(item => (item.Key !== prefix) && !item.Key?.endsWith('/'))
        .map(item => {
          const key = item.Key || '';
          return {
            key,
            name: key.split('/').pop() || key,
            isFolder: false,
            size: item.Size,
            lastModified: item.LastModified,
            type: getFileType(key),
            etag: item.ETag
          };
        });

      // Return combined results
      res.json({
        files,
        folders,
        prefix
      });
    } catch (error) {
      console.error('Error listing files:', error);
      
      // Return error details to help troubleshoot AWS connection issues
      return res.status(500).json({ 
        error: 'Failed to list files from S3 bucket', 
        details: (error as Error).message,
        bucket: bucketName,
        region: region,
        prefix: req.query.prefix
      });
    }
  });

  // 2. Upload file
  app.post('/api/files', upload.single('file'), async (req, res) => {
    try {
      if (!req.file || !req.body.key) {
        return res.status(400).json({ error: 'File and key are required' });
      }

      const key = req.body.key;
      const file = req.file;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await s3Client.send(command);
      
      res.json({
        message: 'File uploaded successfully',
        key,
        size: file.size,
        type: getFileType(key)
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file', details: (error as Error).message });
    }
  });

  // 3. Delete file or folder
  app.delete('/api/files', async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }

      // Check if this is a folder (ends with /)
      const isFolder = key.endsWith('/');
      
      if (isFolder) {
        // Handle folder deletion
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: key,
          Delimiter: '/'
        });
        
        const listResponse = await s3Client.send(listCommand);
        
        // Delete all files in the folder
        if (listResponse.Contents) {
          for (const file of listResponse.Contents) {
            if (file.Key && file.Key !== key && !file.Key.endsWith('/')) {
              const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: file.Key
              });
              
              await s3Client.send(deleteCommand);
            }
          }
        }
        
        res.json({ message: 'Folder deleted successfully' });
      } else {
        // Handle file deletion
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key
        });

        await s3Client.send(command);
        
        res.json({ message: 'File deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting file/folder:', error);
      res.status(500).json({ error: 'Failed to delete file/folder', details: (error as Error).message });
    }
  });

  // 4. Get file preview URL
  app.get('/api/files/preview', async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }
      
      if (useMockData) {
        // Generate a mock preview URL
        const mockUrl = `/api/mock/preview?key=${encodeURIComponent(key)}`;
        console.log(`Using mock preview URL for key: ${key}`);
        
        return res.json({
          url: mockUrl,
          key,
          type: getFileType(key),
          name: key.split('/').pop() || key
        });
      }

      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      // Generate signed URL with 1-hour expiration
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      res.json({
        url,
        key,
        type: getFileType(key),
        name: key.split('/').pop() || key
      });
    } catch (error) {
      console.error('Error generating preview URL:', error);
      
      // Return error details to help troubleshoot AWS connection issues
      return res.status(500).json({ 
        error: 'Failed to generate preview URL from S3', 
        details: (error as Error).message,
        bucket: bucketName,
        region: region,
        key: req.query.key
      });
    }
  });

  // 5. Get file content for editing
  app.get('/api/files/content', async (req, res) => {
    try {
      const key = req.query.key as string;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }
      
      // Check if file is viewable as text, reject binary files
      if (!isTextViewable(key)) {
        return res.status(400).json({ 
          error: 'File is not editable',
          details: 'Only text-based files can be edited'
        });
      }
      
      if (useMockData) {
        // Generate mock content based on file type
        console.log(`Using mock content for key: ${key}`);
        let mockContent = "Sample content for " + key;
        
        // Return mock content
        return res.json({
          content: mockContent,
          key
        });
      }
      
      // Create a command to get the file from S3
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      // Get the object from S3
      const s3Response = await s3Client.send(command);
      
      // Convert the stream to a string
      let content = '';
      if (s3Response.Body instanceof Readable) {
        // Process the readable stream
        for await (const chunk of s3Response.Body) {
          content += chunk.toString();
        }
      } else {
        throw new Error('Invalid response body format');
      }
      
      // Return the content
      res.json({ content, key });
    } catch (error) {
      console.error('Error getting file content:', error);
      res.status(500).json({ error: 'Failed to get file content', details: (error as Error).message });
    }
  });
  
  // 6. Save file content
  app.post('/api/files/content', async (req, res) => {
    try {
      const { key, content } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }
      
      if (content === undefined) {
        return res.status(400).json({ error: 'File content is required' });
      }
      
      // Check if file is editable, reject binary files
      if (!isTextViewable(key)) {
        return res.status(400).json({ 
          error: 'File is not editable',
          details: 'Only text-based files can be edited'
        });
      }
      
      if (useMockData) {
        // Simulate saving content
        console.log(`Mock saving content for key: ${key}`);
        return res.json({
          success: true,
          key
        });
      }
      
      // Create a command to put the object in S3
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: getMimeTypeFromExtension(key)
      });
      
      // Save the content to S3
      await s3Client.send(command);
      
      // Return success
      res.json({ success: true, key });
    } catch (error) {
      console.error('Error saving file content:', error);
      res.status(500).json({ error: 'Failed to save file content', details: (error as Error).message });
    }
  });

  // Mock preview endpoint
  app.get('/api/mock/preview', (req, res) => {
    // Get key from query params and ensure it's a string
    const key = typeof req.query.key === 'string' ? req.query.key : '';
    
    // Extract the file extension or type
    const type = getFileType(key).toLowerCase();
    
    // Prepare mock content based on file type
    let defaultContent = '';
    let contentType = 'text/plain';
    
    // Generate appropriate mock content for each file type
    switch (type.toLowerCase()) {
      case 'pdf':
        defaultContent = `<div style="padding: 20px; font-family: Arial; text-align: center;">
          <h2>Mock PDF Document</h2>
          <p>This is a mock preview for: ${key}</p>
          <p style="color: #666;">PDF content would appear here in a real application.</p>
        </div>`;
        contentType = 'text/html';
        break;
        
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        // Generate a mock image with file name
        const fileName = key.split('/').pop() || key;
        defaultContent = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill="#f0f0f0"/>
          <rect x="10" y="10" width="380" height="280" fill="#ddd" stroke="#aaa" stroke-width="1"/>
          <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="#555">Mock Image Preview</text>
          <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#777">${fileName}</text>
        </svg>`;
        contentType = 'image/svg+xml';
        break;
        
      case 'mp4':
      case 'mov':
        // HTML with a mock video player
        defaultContent = `<div style="padding: 20px; font-family: Arial; text-align: center;">
          <div style="width: 400px; height: 300px; background: #000; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
            <div style="color: white; text-align: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              <p>Mock Video Player</p>
              <p>${key.split('/').pop() || key}</p>
            </div>
          </div>
        </div>`;
        contentType = 'text/html';
        break;
        
      case 'word':
      case 'excel':
      case 'powerpoint':
      case 'text':
      case 'csv':
      case 'json':
      default:
        // Generate mock text content preview
        defaultContent = `<div style="padding: 20px; font-family: Arial;">
          <h3>Mock Document Preview</h3>
          <p>File: ${key}</p>
          <p>Type: ${type}</p>
          <hr/>
          <p style="color: #666;">Document content would appear here in a real application.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>`;
        contentType = 'text/html';
    }
    
    // Set appropriate headers and send response
    res.setHeader('Content-Type', contentType);
    res.send(defaultContent);
  });

  // 5. Download file(s)
  app.get('/api/files/download', async (req, res) => {
    try {
      const keys = Array.isArray(req.query.keys) 
        ? req.query.keys as string[] 
        : [req.query.keys as string];
      
      const zipRequested = req.query.zip === 'true';
      
      if (keys.length === 0) {
        return res.status(400).json({ error: 'File keys are required' });
      }
      
      if (useMockData) {
        // Generate mock download response
        if (keys.length === 1 && !zipRequested) {
          const key = keys[0];
          const filename = key.split('/').pop() || 'download';
          const mockData = `This is mock file content for ${key}`;
          
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.setHeader('Content-Type', 'text/plain');
          res.send(mockData);
          return;
        } else {
          // For mock data with multiple files, just return a message
          res.setHeader('Content-Type', 'text/plain');
          res.send(`This is a mock download for multiple files: ${keys.join(', ')}`);
          return;
        }
      }

      // Single file download without zip
      if (keys.length === 1 && !zipRequested) {
        const key = keys[0];
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key
        });

        const response = await s3Client.send(command);
        const filename = key.split('/').pop() || 'download';
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        if (response.ContentType) {
          res.setHeader('Content-Type', response.ContentType);
        }
        
        // Convert the response body to a Buffer and send it
        if (response.Body) {
          const streamToBuffer = async (stream: any): Promise<Buffer> => {
            return new Promise((resolve, reject) => {
              const chunks: Buffer[] = [];
              stream.on('data', (chunk: Buffer) => chunks.push(chunk));
              stream.on('error', reject);
              stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
          };
          
          const buffer = await streamToBuffer(response.Body);
          res.send(buffer);
        } else {
          res.status(404).json({ error: 'File content not found' });
        }
        return;
      }
      
      // Multiple files or folder download with zip
      const archive = archiver('zip', {
        zlib: { level: 5 }
      });
      
      // Set response headers for zip download
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="download.zip"');
      
      // Pipe the archive to the response
      archive.pipe(res);
      
      // Collect all files to add to the archive
      const allFiles: { key: string; filename: string }[] = [];
      
      for (const key of keys) {
        // Check if this is a folder (ends with /)
        if (key.endsWith('/')) {
          // List all files in the folder
          const listCommand = new ListObjectsV2Command({
            Bucket: bucketName,
            Prefix: key,
            Delimiter: '/'
          });
          
          const listResponse = await s3Client.send(listCommand);
          
          // Add all files in the folder
          if (listResponse.Contents) {
            for (const file of listResponse.Contents) {
              if (file.Key && file.Key !== key && !file.Key.endsWith('/')) {
                const relativePath = file.Key.substring(key.length);
                allFiles.push({
                  key: file.Key,
                  filename: relativePath
                });
              }
            }
          }
        } else {
          // Single file
          allFiles.push({
            key: key,
            filename: key.split('/').pop() || key
          });
        }
      }
      
      // Add all collected files to the archive
      for (const file of allFiles) {
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.key
        });
        
        const response = await s3Client.send(command);
        
        if (response.Body) {
          const streamToBuffer = async (stream: any): Promise<Buffer> => {
            return new Promise((resolve, reject) => {
              const chunks: Buffer[] = [];
              stream.on('data', (chunk: Buffer) => chunks.push(chunk));
              stream.on('error', reject);
              stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
          };
          
          const buffer = await streamToBuffer(response.Body);
          archive.append(buffer, { name: file.filename });
        }
      }
      
      // Finalize the archive
      await archive.finalize();
    } catch (error) {
      console.error('Error downloading files:', error);
      
      // Return error details to help troubleshoot AWS connection issues
      return res.status(500).json({ 
        error: 'Failed to download files from S3', 
        details: (error as Error).message,
        bucket: bucketName,
        region: region
      });
    }
  });

  // 6. Rename file or folder
  app.post('/api/files/rename', async (req, res) => {
    try {
      const { oldKey, newName } = req.body;
      
      if (!oldKey || !newName) {
        return res.status(400).json({ error: 'Old key and new name are required' });
      }

      // Check if this is a folder (ends with /)
      const isFolder = oldKey.endsWith('/');
      
      if (isFolder) {
        // Handle folder rename
        const oldFolderPath = oldKey;
        const pathParts = oldKey.split('/');
        pathParts.pop(); // Remove trailing slash
        pathParts.pop(); // Remove folder name
        const newFolderPath = pathParts.length > 0 
          ? `${pathParts.join('/')}/${newName}/` 
          : `${newName}/`;
        
        // List all files in the folder
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: oldFolderPath,
          Delimiter: '/'
        });
        
        const listResponse = await s3Client.send(listCommand);
        
        // Rename all files in the folder
        if (listResponse.Contents) {
          for (const file of listResponse.Contents) {
            if (file.Key && file.Key !== oldFolderPath && !file.Key.endsWith('/')) {
              const relativePath = file.Key.substring(oldFolderPath.length);
              const newFileKey = `${newFolderPath}${relativePath}`;
              
              // Copy file to new location
              const copyCommand = new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: encodeURIComponent(`${bucketName}/${file.Key}`),
                Key: newFileKey
              });
              
              await s3Client.send(copyCommand);
              
              // Delete old file
              const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: file.Key
              });
              
              await s3Client.send(deleteCommand);
            }
          }
        }
        
        res.json({
          message: 'Folder renamed successfully',
          oldKey: oldFolderPath,
          newKey: newFolderPath
        });
      } else {
        // Handle file rename
        const pathParts = oldKey.split('/');
        pathParts.pop(); // Remove filename
        const newKey = pathParts.length > 0 
          ? `${pathParts.join('/')}/${newName}` 
          : newName;
        
        // Copy the object to the new key
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: encodeURIComponent(`${bucketName}/${oldKey}`),
          Key: newKey
        });
        
        await s3Client.send(copyCommand);
        
        // Delete the old object
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: oldKey
        });
        
        await s3Client.send(deleteCommand);
        
        res.json({
          message: 'File renamed successfully',
          oldKey,
          newKey
        });
      }
    } catch (error) {
      console.error('Error renaming file/folder:', error);
      res.status(500).json({ error: 'Failed to rename file/folder', details: (error as Error).message });
    }
  });

  // 7. List starred files
  app.get('/api/files/starred', async (req, res) => {
    try {
      // For simplicity, we'll use a static list of starred files
      // In a real implementation, this would be stored in a database
      const starredFiles = [
        {
          key: 'documents/important.pdf',
          name: 'important.pdf',
          type: 'PDF',
          size: 1024 * 1024, // 1 MB
          lastModified: new Date(),
          isFolder: false
        },
        {
          key: 'images/logo.png',
          name: 'logo.png',
          type: 'PNG',
          size: 512 * 1024, // 512 KB
          lastModified: new Date(),
          isFolder: false
        }
      ];
      
      res.json({ starredFiles });
    } catch (error) {
      console.error('Error listing starred files:', error);
      res.status(500).json({ error: 'Failed to list starred files', details: (error as Error).message });
    }
  });

  // 8. List trash files
  app.get('/api/files/trash', async (req, res) => {
    try {
      // For simplicity, we'll use a static list of trash files
      // In a real implementation, this would be stored in a database
      const trashFiles = [
        {
          key: '_trash/old_document.pdf',
          originalKey: 'documents/old_document.pdf',
          name: 'old_document.pdf',
          type: 'PDF',
          size: 2 * 1024 * 1024, // 2 MB
          lastModified: new Date(),
          deletedAt: new Date(Date.now() - 86400000), // 1 day ago
          isFolder: false
        }
      ];
      
      res.json({ trashFiles });
    } catch (error) {
      console.error('Error listing trash files:', error);
      res.status(500).json({ error: 'Failed to list trash files', details: (error as Error).message });
    }
  });

  // 9. Move file to trash
  app.post('/api/files/trash', async (req, res) => {
    try {
      const { key } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }

      // Get filename
      const filename = key.split('/').pop() || '';
      const newKey = `_trash/${filename}`;
      
      // Copy the object to trash folder
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: encodeURIComponent(`${bucketName}/${key}`),
        Key: newKey
      });
      
      await s3Client.send(copyCommand);
      
      // Delete the original object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      await s3Client.send(deleteCommand);
      
      res.json({
        message: 'File moved to trash successfully',
        originalKey: key,
        trashKey: newKey
      });
    } catch (error) {
      console.error('Error moving file to trash:', error);
      res.status(500).json({ error: 'Failed to move file to trash', details: (error as Error).message });
    }
  });

  // 10. Restore file from trash
  app.post('/api/files/trash/restore', async (req, res) => {
    try {
      const { key, originalKey } = req.body;
      
      if (!key || !originalKey) {
        return res.status(400).json({ error: 'Trash key and original key are required' });
      }
      
      // Copy the object from trash to original location
      const copyCommand = new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: encodeURIComponent(`${bucketName}/${key}`),
        Key: originalKey
      });
      
      await s3Client.send(copyCommand);
      
      // Delete the trash object
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      await s3Client.send(deleteCommand);
      
      res.json({
        message: 'File restored successfully',
        trashKey: key,
        originalKey
      });
    } catch (error) {
      console.error('Error restoring file from trash:', error);
      res.status(500).json({ error: 'Failed to restore file from trash', details: (error as Error).message });
    }
  });

  // 11. List recent files
  app.get('/api/files/recent', async (req, res) => {
    try {
      if (useMockData) {
        // Use mock data - sort by last modified date
        const recentFiles = [...mockFiles]
          .sort((a, b) => {
            const dateA = a.lastModified?.getTime() || 0;
            const dateB = b.lastModified?.getTime() || 0;
            return dateB - dateA; // Sort by most recent first
          });
        
        console.log(`Using mock data for recent files, found ${recentFiles.length} files`);
        return res.json({ recentFiles });
      }
      
      // For simplicity, we'll use a sample list of recent files
      // In a real implementation, this would track files based on access time in a database
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 50, // Limit to 50 recent items
      });

      const response = await s3Client.send(command);
      
      // Process files and sort by last modified date
      const recentFiles = (response.Contents || [])
        .filter(item => !item.Key?.endsWith('/'))
        .map(item => {
          const key = item.Key || '';
          return {
            key,
            name: key.split('/').pop() || key,
            isFolder: false,
            size: item.Size,
            lastModified: item.LastModified,
            type: getFileType(key),
            etag: item.ETag
          };
        })
        .sort((a, b) => {
          const dateA = a.lastModified?.getTime() || 0;
          const dateB = b.lastModified?.getTime() || 0;
          return dateB - dateA; // Sort by most recent first
        });
      
      res.json({ recentFiles });
    } catch (error) {
      console.error('Error listing recent files:', error);
      
      // Return error details to help troubleshoot AWS connection issues
      return res.status(500).json({ 
        error: 'Failed to list recent files from S3', 
        details: (error as Error).message,
        bucket: bucketName,
        region: region
      });
    }
  });

  // 12. List folders
  app.get('/api/files/folders', async (req, res) => {
    try {
      if (useMockData) {
        // Extract unique folder paths from mock files
        const folderPaths: Set<string> = new Set();
        mockFiles.forEach(file => {
          const pathParts = file.key.split('/');
          pathParts.pop(); // Remove filename
          
          // Add all parent folders
          let currentPath = '';
          for (const part of pathParts) {
            if (part) {
              currentPath = currentPath ? `${currentPath}/${part}` : part;
              folderPaths.add(`${currentPath}/`);
            }
          }
        });
        
        // Create folder objects
        const folders = Array.from(folderPaths).map(path => ({
          key: path,
          name: path.split('/').filter(Boolean).pop() || path,
          path
        }));
        
        console.log(`Using mock data for folder listing, found ${folders.length} folders`);
        return res.json({ folders });
      }
      
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: '/'
      });

      const response = await s3Client.send(command);
      
      // Process folders (CommonPrefixes)
      const folders = (response.CommonPrefixes || []).map(prefix => {
        const key = prefix.Prefix || '';
        return {
          key,
          name: key.split('/').filter(Boolean).pop() || key,
          path: key
        };
      });
      
      res.json({ folders });
    } catch (error) {
      console.error('Error listing folders:', error);
      
      // Return error details to help troubleshoot AWS connection issues
      return res.status(500).json({ 
        error: 'Failed to list folders from S3', 
        details: (error as Error).message,
        bucket: bucketName,
        region: region
      });
    }
  });

  // 13. Move file or folder
  app.post('/api/files/move', async (req, res) => {
    try {
      const { sourceKey, destinationPath } = req.body;
      
      if (!sourceKey || destinationPath === undefined) {
        return res.status(400).json({ error: 'Source key and destination path are required' });
      }
      
      // Prevent direct moves to the trash folder - should use the trash API instead
      if (destinationPath.startsWith('_trash')) {
        return res.status(400).json({ 
          error: 'Cannot move directly to trash folder',
          details: 'Use the trash operation instead'
        });
      }

      // Check if this is a folder (ends with /)
      const isFolder = sourceKey.endsWith('/');
      
      if (isFolder) {
        // Handle folder move
        const folderName = sourceKey.split('/').filter(Boolean).pop() || '';
        const newFolderPath = destinationPath ? `${destinationPath}${destinationPath.endsWith('/') ? '' : '/'}${folderName}/` : `${folderName}/`;
        
        // List all files in the folder
        const listCommand = new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: sourceKey,
          Delimiter: '/'
        });
        
        const listResponse = await s3Client.send(listCommand);
        
        // Move all files in the folder
        if (listResponse.Contents) {
          for (const file of listResponse.Contents) {
            if (file.Key && file.Key !== sourceKey && !file.Key.endsWith('/')) {
              const relativePath = file.Key.substring(sourceKey.length);
              const newFileKey = `${newFolderPath}${relativePath}`;
              
              // Copy file to new location
              const copyCommand = new CopyObjectCommand({
                Bucket: bucketName,
                CopySource: encodeURIComponent(`${bucketName}/${file.Key}`),
                Key: newFileKey
              });
              
              await s3Client.send(copyCommand);
              
              // Delete old file
              const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: file.Key
              });
              
              await s3Client.send(deleteCommand);
            }
          }
        }
        
        res.json({
          message: 'Folder moved successfully',
          sourceKey,
          destinationKey: newFolderPath
        });
      } else {
        // Handle file move
        const filename = sourceKey.split('/').pop() || '';
        const newKey = destinationPath ? `${destinationPath}${destinationPath.endsWith('/') ? '' : '/'}${filename}` : filename;
        
        // Copy the object to new location
        const copyCommand = new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: encodeURIComponent(`${bucketName}/${sourceKey}`),
          Key: newKey
        });
        
        await s3Client.send(copyCommand);
        
        // Delete the original object
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: sourceKey
        });
        
        await s3Client.send(deleteCommand);
        
        res.json({
          message: 'File moved successfully',
          sourceKey,
          destinationKey: newKey
        });
      }
    } catch (error) {
      console.error('Error moving file/folder:', error);
      res.status(500).json({ error: 'Failed to move file/folder', details: (error as Error).message });
    }
  });

  // 14.5 Drag and drop files (batch move files)
  app.post('/api/files/drop', async (req, res) => {
    try {
      const { sourceKeys, destinationPath } = req.body;
      
      if (!sourceKeys || !Array.isArray(sourceKeys) || sourceKeys.length === 0 || destinationPath === undefined) {
        return res.status(400).json({ error: 'Source keys array and destination path are required' });
      }
      
      // Prevent direct moves to the trash folder - should use the trash API instead
      if (destinationPath.startsWith('_trash')) {
        return res.status(400).json({ 
          error: 'Cannot move directly to trash folder',
          details: 'Use the trash operation instead'
        });
      }
      
      const results = [];
      const errors = [];
      
      // Process each file move operation
      for (const sourceKey of sourceKeys) {
        try {
          // Get filename
          const filename = sourceKey.split('/').pop() || '';
          const newKey = destinationPath ? `${destinationPath}${destinationPath.endsWith('/') ? '' : '/'}${filename}` : filename;
          
          // Copy the object to new location
          const copyCommand = new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: encodeURIComponent(`${bucketName}/${sourceKey}`),
            Key: newKey
          });
          
          await s3Client.send(copyCommand);
          
          // Delete the original object
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: sourceKey
          });
          
          await s3Client.send(deleteCommand);
          
          results.push({
            sourceKey,
            destinationKey: newKey,
            success: true
          });
        } catch (error) {
          console.error(`Error moving file ${sourceKey}:`, error);
          errors.push({
            sourceKey,
            error: (error as Error).message
          });
        }
      }
      
      // Return combined results
      res.json({
        message: 'Files moved with drag and drop',
        results,
        errors,
        success: errors.length === 0
      });
    } catch (error) {
      console.error('Error in drag and drop operation:', error);
      res.status(500).json({ error: 'Failed to complete drag and drop operation', details: (error as Error).message });
    }
  });

  // 14. Create folder
  app.post('/api/files/folders', async (req, res) => {
    try {
      const { path, name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
      }

      // Create folder key (S3 uses empty files with trailing slash to represent folders)
      const folderKey = path ? `${path}/${name}/` : `${name}/`;
      
      // Create empty object with trailing slash
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: folderKey,
        Body: ''
      });
      
      await s3Client.send(command);
      
      res.json({
        message: 'Folder created successfully',
        key: folderKey,
        name,
        path: folderKey
      });
    } catch (error) {
      console.error('Error creating folder:', error);
      res.status(500).json({ error: 'Failed to create folder', details: (error as Error).message });
    }
  });
  
  // 15. Star/unstar file
  app.post('/api/files/starred/toggle', async (req, res) => {
    try {
      const { key, star } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }

      // In a real implementation, this would update a database entry
      // For now, we'll just return a success message
      
      res.json({
        message: star ? 'File starred successfully' : 'File unstarred successfully',
        key,
        starred: star
      });
    } catch (error) {
      console.error('Error starring/unstarring file:', error);
      res.status(500).json({ error: 'Failed to star/unstar file', details: (error as Error).message });
    }
  });

  // In-memory storage for shared files (would be a database in production)
  const sharedFiles = new Map<string, {
    key: string,
    shareId: string,
    url: string,
    expiresAt: Date,
    createdAt: Date
  }>();

  // 16. Generate share link for a file
  app.post('/api/files/share', async (req, res) => {
    try {
      const { key, expiresIn } = req.body;
      
      if (!key) {
        return res.status(400).json({ error: 'File key is required' });
      }

      // Validate that the file exists
      const headCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });

      try {
        await s3Client.send(headCommand);
      } catch (error) {
        return res.status(404).json({ error: 'File not found', details: 'The specified file does not exist' });
      }

      // Generate a unique share ID (in production, use a more robust method)
      const shareId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Calculate expiration time
      const secondsToExpire = expiresIn || 3600; // Default to 1 hour
      const expiresAt = new Date(Date.now() + secondsToExpire * 1000);
      
      // Generate a pre-signed URL for temporary access
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key
      });
      
      const url = await getSignedUrl(s3Client, command, { expiresIn: secondsToExpire });
      
      // Store the shared file info
      const sharedFile = {
        key,
        shareId,
        url,
        expiresAt,
        createdAt: new Date()
      };
      
      sharedFiles.set(shareId, sharedFile);
      
      // Return the share information
      res.json({
        message: 'Share link generated successfully',
        shareId,
        url,
        expiresAt,
        fileKey: key,
        fileName: key.split('/').pop() || key
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      res.status(500).json({ error: 'Failed to generate share link', details: (error as Error).message });
    }
  });

  // 17. Get shared file by ID
  app.get('/api/files/shared/:shareId', async (req, res) => {
    try {
      const { shareId } = req.params;
      
      // Check if the share exists
      if (!sharedFiles.has(shareId)) {
        return res.status(404).json({ error: 'Share not found', details: 'The share link is invalid or has expired' });
      }
      
      const sharedFile = sharedFiles.get(shareId)!;
      
      // Check if the share has expired
      if (sharedFile.expiresAt < new Date()) {
        // Remove expired share
        sharedFiles.delete(shareId);
        return res.status(410).json({ error: 'Share expired', details: 'The share link has expired' });
      }
      
      // Get file info
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: sharedFile.key
      });
      
      try {
        const { ContentType, ContentLength, LastModified } = await s3Client.send(command);
        
        // Return the shared file info
        res.json({
          shareId,
          fileKey: sharedFile.key,
          fileName: sharedFile.key.split('/').pop() || sharedFile.key,
          url: sharedFile.url,
          expiresAt: sharedFile.expiresAt,
          createdAt: sharedFile.createdAt,
          contentType: ContentType,
          size: ContentLength,
          lastModified: LastModified
        });
      } catch (error) {
        // If the file no longer exists
        return res.status(404).json({ error: 'File not found', details: 'The shared file no longer exists' });
      }
    } catch (error) {
      console.error('Error retrieving shared file:', error);
      res.status(500).json({ error: 'Failed to retrieve shared file', details: (error as Error).message });
    }
  });

  // 18. List all shared files
  app.get('/api/files/shared', async (req, res) => {
    try {
      // Filter out expired shares
      const now = new Date();
      const activeShares = Array.from(sharedFiles.values())
        .filter(share => share.expiresAt > now)
        .map(share => ({
          shareId: share.shareId,
          fileKey: share.key,
          fileName: share.key.split('/').pop() || share.key,
          expiresAt: share.expiresAt,
          createdAt: share.createdAt
        }));
      
      res.json({
        sharedFiles: activeShares
      });
    } catch (error) {
      console.error('Error listing shared files:', error);
      res.status(500).json({ error: 'Failed to list shared files', details: (error as Error).message });
    }
  });

  // Get folder hierarchy for column view
  app.get("/api/files/hierarchy", async (req, res) => {
    try {
      const prefix = req.query.prefix as string || "";
      
      if (useMockData) {
        // Use mock data for development
        const hierarchy = buildMockHierarchy(prefix);
        return res.json({
          nodes: hierarchy,
          prefix: prefix
        });
      }
      
      // Use real S3 data with ListObjectsV2
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Delimiter: '/',
        Prefix: prefix
      });

      const response = await s3Client.send(command);
      
      const nodes: any[] = [];
      
      // Process folders (CommonPrefixes) - match exactly with /api/files
      const folders = (response.CommonPrefixes || []).map(prefix => {
        const key = prefix.Prefix || '';
        return {
          key,
          name: key.split('/').filter(Boolean).pop() || key,
          type: 'folder',
          isFolder: true,
          lastModified: null,
          size: 0,
          children: [],
          isExpanded: false,
          isLoading: false
        };
      });
      
      // Process files (Contents) - exclude keys ending with "/" - match exactly with /api/files
      const files = (response.Contents || [])
        .filter(item => (item.Key !== prefix) && !item.Key?.endsWith('/'))
        .map(item => {
          const key = item.Key || '';
          return {
            key,
            name: key.split('/').pop() || key,
            type: 'file',
            isFolder: false,
            size: item.Size,
            lastModified: item.LastModified,
            etag: item.ETag,
            children: []
          };
        });
      
      // Combine and sort: folders first A-Z, then files A-Z
      nodes.push(...folders, ...files);
      nodes.sort((a, b) => {
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
      
      res.json({
        nodes,
        prefix: prefix
      });
    } catch (error) {
      console.error("Error getting folder hierarchy:", error);
      res.status(500).json({
        error: "Failed to get folder hierarchy",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Helper function to build mock hierarchy (for development)
  function buildMockHierarchy(prefix: string): any[] {
    // Filter mock files based on prefix
    const relevantFiles = mockFiles.filter(file => {
      if (!prefix) return true;
      return file.key.startsWith(prefix) && file.key !== prefix;
    });
    
    // Group by immediate subdirectories and files
    const groups = new Map<string, any[]>();
    const filesInCurrentLevel: any[] = [];
    
    relevantFiles.forEach(file => {
      const relativePath = prefix ? file.key.substring(prefix.length) : file.key;
      const parts = relativePath.split('/').filter(Boolean);
      
      if (parts.length === 1) {
        // This is a file in the current level
        filesInCurrentLevel.push({
          key: file.key,
          name: file.name,
          type: 'file',
          size: file.size,
          lastModified: file.lastModified,
          children: []
        });
      } else if (parts.length > 1) {
        // This is a file in a subdirectory
        const firstPart = parts[0];
        const groupKey = prefix ? `${prefix}${firstPart}/` : `${firstPart}/`;
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        
        groups.get(groupKey)!.push({
          key: file.key,
          name: file.name,
          type: 'file',
          size: file.size,
          lastModified: file.lastModified,
          children: []
        });
      }
    });
    
    // Convert to tree structure
    const result: any[] = [];
    
    // Add folders
    groups.forEach((files, folderKey) => {
      const folderName = folderKey.split('/').slice(-2)[0]; // Get folder name
      
      result.push({
        key: folderKey,
        name: folderName,
        type: 'folder',
        children: files,
        isExpanded: false,
        isLoading: false
      });
    });
    
    // Add files in current level
    result.push(...filesInCurrentLevel);
    
    // Sort folders first, then files
    result.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
    
    return result;
  }

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
