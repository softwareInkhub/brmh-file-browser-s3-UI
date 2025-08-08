import { S3Client, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function createBucket() {
  try {
    console.log('Creating S3 bucket:', process.env.AWS_BUCKET_NAME);
    
    // Create the bucket
    const createCommand = new CreateBucketCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
    });
    
    await client.send(createCommand);
    console.log('✅ Bucket created successfully!');
    
    // Configure CORS
    const corsCommand = new PutBucketCorsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
          },
        ],
      },
    });
    
    await client.send(corsCommand);
    console.log('✅ CORS configured successfully!');
    
    console.log('🎉 Your S3 bucket is ready! You can now run the application.');
    
  } catch (error) {
    if (error.name === 'BucketAlreadyExists') {
      console.log('✅ Bucket already exists!');
    } else {
      console.error('❌ Error creating bucket:', error.message);
    }
  }
}

createBucket();
