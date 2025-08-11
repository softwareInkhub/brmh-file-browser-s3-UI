# BRMH S3 Browser

A modern, responsive cloud drive interface for browsing and managing files stored in AWS S3.

## Features

### Responsive Sidebar Toggle
The application features a fully responsive sidebar that can be collapsed and expanded:

- **Smooth Transitions**: Fluid animations when toggling between collapsed and expanded states
- **Responsive Design**: Automatically adapts to different screen sizes
- **Keyboard Shortcuts**: Use `Ctrl+B` (or `Cmd+B` on Mac) to toggle the sidebar
- **State Persistence**: Remembers your sidebar preference across sessions
- **Mobile Optimized**: On mobile devices, the sidebar becomes a slide-out menu
- **No Layout Shifts**: Main content area smoothly adjusts to occupy freed space

#### Sidebar States:
- **Expanded**: Full width (288px) showing navigation labels, quick access folders, and storage info
- **Collapsed**: Minimal width (64px) showing only icons with tooltips
- **Mobile**: Slide-out overlay that can be toggled with the menu button

#### Usage:
- Click the chevron button on the sidebar edge to toggle
- Use keyboard shortcut `Ctrl+B` / `Cmd+B`
- On mobile, use the menu button in the top-left corner
- Hover over icons in collapsed state to see tooltips

### Browser History Navigation
The application features comprehensive browser history support that preserves the complete UI state:

#### Navigation Features:
- **State Preservation**: All UI state (current path, active tab, search terms, view mode, sorting, modals, etc.) is preserved in browser history
- **Smooth Transitions**: Fluid navigation between different states without page reloads
- **URL Synchronization**: Browser URL reflects the current application state for bookmarking and sharing
- **Back/Forward Support**: Full support for browser back/forward buttons with visual indicators

#### Preserved State Elements:
- **Navigation State**: Current folder path, active tab (My Drive, Recent, Starred, etc.)
- **UI Preferences**: View mode (grid/list), sort settings, file type filters, sidebar collapse state
- **Search State**: Current search terms and results
- **Modal States**: Open modals (preview, upload, rename, move, delete) with selected items
- **Scroll Position**: Maintains scroll position when navigating back/forward

#### Browser Navigation Controls:
- **Visual Indicators**: Back/forward buttons in the header show navigation availability
- **Keyboard Shortcuts**: 
  - `Alt+←`: Navigate back in browser history
  - `Alt+→`: Navigate forward in browser history
- **URL Parameters**: All state is encoded in URL parameters for direct linking

#### URL Structure:
The application uses URL parameters to encode state:
```
/?prefix=folder/path&tab=my-drive&search=document&view=grid&sortBy=name&sortDir=asc&sidebar=collapsed&preview=true&selected=file.pdf
```

![S3 File Browser Screenshot](./attached_assets/image_1743190877829.png)

## Deployment Guide

This guide provides detailed instructions for deploying the S3 File Browser to AWS Amplify and Vercel.

### Prerequisites for Deployment

Before deploying, make sure you have:ddddjkkkkkk

1. Your application code in a Git repository (GitHub, GitLab, or Bitbucket)
2. An AWS account with an S3 bucket properly configured with CORS
3. AWS IAM credentials with access to your S3 bucket
4. (For AWS Amplify) AWS Amplify CLI installed: `npm install -g @aws-amplify/cli`
5. (For Vercel) Vercel CLI installed: `npm install -g vercel`

### Important Notes Before Deployment

This application is a full-stack app with both a backend (Express.js) and frontend (React). When deploying to services like AWS Amplify and Vercel, special considerations are needed:

1. The application uses a unified build process that bundles both frontend and backend
2. Environment variables must be properly set for both build time and runtime
3. The server-side component needs server-side rendering (SSR) or API routes support

### Deploying to AWS Amplify

AWS Amplify is a great option for deploying full-stack web applications. Follow these steps to deploy your S3 File Browser:

#### 1. Prepare Your Repository

Ensure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

#### 2. Create an amplify.yml File

Create a file named `amplify.yml` in the root of your project:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 3. Sign in to AWS Amplify Console

1. Sign in to the [AWS Management Console](https://aws.amazon.com/console/)
2. Navigate to AWS Amplify
3. Click "New app" > "Host web app"

#### 4. Connect to Your Git Repository

1. Select your Git provider (GitHub, GitLab, or Bitbucket)
2. Authorize AWS Amplify to access your repositories
3. Select the repository containing your S3 File Browser
4. Select the branch you want to deploy (e.g., main or master)

#### 5. Configure Build Settings

1. Verify the build settings are using your `amplify.yml` file
2. Add environment variables:
   - `ACCESS_KEY_ID` (your AWS access key)
   - `SECRET_ACCESS_KEY` (your AWS secret key)
   - `BUCKET_NAME` (your S3 bucket name)
   - `REGION` (your AWS region, e.g., ap-northeast-1)

> **Important**: For security, create a dedicated IAM user with restricted permissions just for this application!

#### 6. Configure Advanced Settings (Important)

Under "Advanced settings", make sure to:

1. Set "Build image settings" to use the latest Node.js version (16.x or later)
2. Under "Service role", create or select a role that allows Amplify to access your resources
3. Under "Build specifications", make sure your `amplify.yml` is being used

#### 7. Review and Deploy

1. Review all settings to ensure they're correct
2. Click "Save and deploy"

AWS Amplify will now build and deploy your application. Once the deployment is complete, your app will be available at the provided Amplify URL (e.g., `https://main.d123456789.amplifyapp.com`).

#### 8. Custom Domain (Optional)

To add a custom domain:

1. In the Amplify Console, select your app
2. Click on "Domain management"
3. Click "Add domain"
4. Follow the steps to add and verify your domain

### Deploying to Vercel

Vercel is optimized for frontend applications but can also host full-stack applications with some adjustments. Here's how to deploy your S3 File Browser to Vercel:

#### 1. Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

#### 2. Create a vercel.json File

Create a file named `vercel.json` in the root of your project:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "dist/$1"
    }
  ]
}
```

#### 3. Modify package.json Build Script

Update your `package.json` to include a Vercel-specific build command. Add this line to your scripts section:

```json
"scripts": {
  // other scripts...
  "vercel-build": "npm run build"
  // other scripts...
}
```

**Important:** This step is crucial as it tells Vercel how to build your application properly.

#### 4. Sign in to Vercel

1. Go to [Vercel](https://vercel.com/) and sign in or create an account
2. Click "New Project" on your dashboard

#### 5. Import Your Repository

1. Select the repository containing your S3 File Browser
2. Vercel will detect your project settings

#### 6. Configure Project

1. Set the Framework Preset to "Other" (since this is a custom setup)
2. Add your environment variables in Vercel's "Environment Variables" section:
   - `AWS_ACCESS_KEY_ID` (your AWS access key)
   - `AWS_SECRET_ACCESS_KEY` (your AWS secret key)
   - `AWS_BUCKET_NAME` (your S3 bucket name)
   - `AWS_REGION` (your AWS region, e.g., ap-northeast-1)
   - `NODE_ENV` set to `production`
   
   **Important Notes:**
   - Make sure all environment variables are set properly in Vercel's dashboard. These will not be automatically picked up from your .env file.
   - The application supports the non-prefixed versions (`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, etc.) for backward compatibility, but using the AWS-prefixed versions is recommended.
   - Double-check that there are no typos in your environment variables.
   
3. Set the Output Directory to `dist` in build settings

#### 7. Deploy

Click "Deploy" to start the deployment process. Vercel will build and deploy your application.

#### 8. Custom Domain (Optional)

To add a custom domain:

1. Go to the project settings on Vercel
2. Click on "Domains"
3. Add your domain and follow the verification steps

### Troubleshooting Deployment Issues

#### Common Issues with AWS Amplify

1. **Build Failures**:
   - Check build logs for specific errors
   - Ensure Node.js version is compatible (use Node.js 16.x or later)
   - Verify all dependencies are correctly installed

2. **Missing Environment Variables**:
   - Double-check that all required environment variables are set
   - Ensure values are correct (no typos in access keys, region, etc.)

3. **CORS Issues**:
   - Update your S3 bucket's CORS configuration to include your Amplify app URL

#### Common Issues with Vercel

1. **API Routes Not Working**:
   - Ensure `vercel.json` correctly routes API requests to your server
   - Check server logs for errors in the Vercel dashboard
   - Verify that the API routes are correctly configured in the `vercel.json` file

2. **AWS Connection Issues in Production**:
   - If your API works locally but fails on Vercel, this is almost always an environment variable issue
   - Check that you've added all AWS environment variables in the Vercel dashboard (not just in your local .env file)
   - Verify that your AWS credentials have the correct permissions and are active
   - Ensure your bucket name and region are correct for the deployment environment

3. **Build Failures**:
   - Look at build logs for specific errors in the Vercel dashboard
   - Verify Node.js version compatibility (set to 16.x or later)
   - Ensure all dependencies are properly installed

4. **Environment Variable Issues**:
   - Double-check that all required environment variables are set in the Vercel dashboard
   - Verify there are no typos in the variable names or values
   - Check that you're using `AWS_` prefixed variables in the Vercel dashboard
   - Restart the deployment after updating environment variables

5. **Serverless Function Size Limits**:
   - Vercel has a limit on serverless function size (50MB)
   - You may need to optimize your dependencies or split the application

6. **CORS Issues with S3**:
   - Make sure your S3 bucket CORS configuration allows requests from your Vercel deployment domain
   - Update the AllowedOrigins in your S3 CORS config to include your Vercel domain

## Features

- **Complete File Management**: Upload, download, rename, move, and delete files
- **Folder Organization**: Create folders, navigate through nested directories
- **Preview System**: View and edit files directly in the browser
- **Advanced Filtering**: Filter files by type and extension
- **File Operations**: Context menus for quick file actions
- **Responsive Design**: Works on desktop and mobile devices
- **Starred Files**: Mark important files as favorites
- **Trash Bin**: Safely recover deleted files

## Prerequisites

Before you start, make sure you have the following:

1. Node.js (v16.x or later)
2. npm (v8.x or later)
3. An AWS account with an S3 bucket set up
4. AWS credentials with access to your S3 bucket

## Environment Setup

You'll need to set up the following environment variables:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_BUCKET_NAME` - Your S3 bucket name
- `AWS_REGION` - The AWS region where your bucket is located (e.g., "ap-northeast-1")
- `PORT` - (Optional) The port for the server to run on, defaults to 8000 in Replit and 8000 locally

Note: The application also supports the non-prefixed versions (`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, etc.) for backward compatibility, but using the AWS-prefixed versions is recommended.

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/s3-file-browser.git
   cd s3-file-browser
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your AWS credentials:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_id
   AWS_SECRET_ACCESS_KEY=your_secret_access_key
   AWS_BUCKET_NAME=your_bucket_name
   AWS_REGION=ap-northeast-1
   PORT=8000
   ```
   
   Note: The application also supports the non-prefixed versions (`ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, etc.) for backward compatibility, but using the AWS-prefixed versions is recommended.

## Running the Application

Start the development server with:

```bash
npm run dev
```

This will launch both the Express backend and the React frontend. The application will be available at http://localhost:8000.

## Project Structure

```
.
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # React hooks
│   │   ├── lib/           # Utility functions and services
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript interfaces and types
├── server/                # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Storage interfaces
│   └── vite.ts            # Vite integration
├── shared/                # Shared code between frontend and backend
│   └── schema.ts          # Shared TypeScript interfaces
├── package.json
└── tsconfig.json
```

## Backend API Endpoints

The server exposes the following API endpoints:

- `GET /api/files` - List files in a directory
- `GET /api/files/folders` - List all folders in the bucket
- `GET /api/files/preview` - Get a presigned URL for file preview
- `GET /api/files/content` - Get the content of a text file
- `POST /api/files` - Upload a file
- `POST /api/files/folder` - Create a folder
- `PATCH /api/files/rename` - Rename a file or folder
- `PATCH /api/files/move` - Move a file or folder
- `DELETE /api/files` - Delete a file or move it to trash
- `GET /api/files/starred` - List starred files
- `POST /api/files/star` - Star or unstar a file
- `GET /api/files/trash` - List files in trash
- `POST /api/files/restore` - Restore a file from trash

## S3 Bucket Setup

For the application to work properly, you need to set up your S3 bucket with the appropriate CORS configuration. Here's a sample CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Development

For local development:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Building for Production

To build the application for production:

```bash
npm run build
```

Then, to start the production server:

```bash
npm start
```

## Troubleshooting

### AWS Connection Issues

If you encounter AWS connection issues:

1. Verify your AWS credentials are correct
2. Check if the bucket name and region match your S3 bucket
3. Ensure your S3 bucket has the proper CORS configuration
4. Verify your IAM user has the necessary permissions for S3 operations

### Common Error Messages

- **"InvalidAccessKeyId"**: Your AWS access key is invalid or expired
- **"PermanentRedirect"**: The bucket is in a different region than specified
- **"Access Denied"**: Your IAM user doesn't have sufficient permissions

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.