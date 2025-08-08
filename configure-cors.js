import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function configureCORS() {
  try {
    console.log('Configuring CORS for S3 bucket:', process.env.AWS_BUCKET_NAME);
    
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
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error.message);
  }
}

configureCORS();
