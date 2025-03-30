# Deploying to Vercel - Detailed Guide

This guide provides detailed instructions for deploying the S3 File Browser to Vercel, addressing common issues and troubleshooting steps.

## Prerequisites

Before you start the deployment process, make sure you have:

1. An AWS account with:
   - An S3 bucket set up
   - IAM credentials with permissions to access the bucket
   - The bucket properly configured with CORS settings

2. A GitHub repository with your S3 File Browser code

3. A Vercel account (you can sign up at [vercel.com](https://vercel.com))

## Step 1: Prepare Your Code for Deployment

1. Make sure your `vercel.json` file exists and is correctly configured:

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
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. Ensure your `package.json` has the correct build scripts:

```json
"scripts": {
  "dev": "tsx server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "NODE_ENV=production node dist/index.js"
}
```

## Step 2: Deploy to Vercel

1. Log in to your Vercel account
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Configure the project settings:
   - Framework Preset: Select "Other"
   - Build Command: Leave as default (`npm run build`)
   - Output Directory: `dist`
   - Install Command: Leave as default (`npm install`)

## Step 3: Configure Environment Variables

This is the most critical step for a successful deployment:

1. In the Vercel project settings, go to "Environment Variables"
2. Add the following variables:
   - `AWS_ACCESS_KEY_ID` = Your AWS access key
   - `AWS_SECRET_ACCESS_KEY` = Your AWS secret key
   - `AWS_BUCKET_NAME` = Your S3 bucket name
   - `AWS_REGION` = Your S3 bucket region (e.g., ap-northeast-1)
   - `NODE_ENV` = production

3. Click "Save" to store your environment variables

## Step 4: Deploy

1. Click "Deploy" to start the build and deployment process
2. Wait for the build to complete
3. Once deployment is finished, Vercel will provide you with a URL to access your application

## Common Issues and Troubleshooting

### API Routes Not Working

**Symptoms**: Frontend loads but no files are displayed, API calls fail

**Solutions**:
1. Check that your `vercel.json` file correctly routes API requests to `server/index.ts`
2. Verify API routes in the network tab of your browser's developer tools
3. Check Vercel function logs for errors in the Vercel dashboard (Functions tab)

### AWS Connection Issues

**Symptoms**: Error messages related to AWS services

**Solutions**:
1. Double-check that all AWS environment variables are correctly set in Vercel's dashboard
2. Verify that your AWS credentials have the necessary permissions
3. Check that your bucket name and region are correct
4. Test the credentials locally to ensure they're valid

### Build Failures

**Symptoms**: Deployment fails during the build process

**Solutions**:
1. Check the build logs in Vercel for specific error messages
2. Ensure that all dependencies are correctly listed in `package.json`
3. Try building locally first to identify any issues
4. Check for incompatible Node.js versions

### CORS Issues

**Symptoms**: API requests work but file operations fail with CORS errors

**Solutions**:
1. Update your S3 bucket CORS configuration to include your Vercel domain:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["https://your-vercel-domain.vercel.app", "*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

2. If using a custom domain, add that to the AllowedOrigins as well

### Serverless Function Size Limits

**Symptoms**: Deployment fails with "Function size exceeds limits" error

**Solutions**:
1. Optimize dependencies to reduce bundle size
2. Consider splitting backend functionality into multiple serverless functions
3. Remove unnecessary dependencies or use smaller alternatives

## Best Practices for Vercel Deployment

1. **Test locally first**: Always ensure your application works locally before deploying
2. **Use environment secrets**: Store sensitive information in Vercel's environment variables
3. **Check deployment logs**: Always review logs after deployment to identify any issues
4. **Set up proper redirects**: Configure redirects in `vercel.json` to handle client-side routing
5. **Enable automatic preview deployments**: Use Vercel's preview deployments to test changes before merging

## Getting Help

If you're still experiencing issues with your Vercel deployment:

1. Check the [Vercel documentation](https://vercel.com/docs)
2. Review the [AWS S3 documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)
3. Post an issue on the project's GitHub repository