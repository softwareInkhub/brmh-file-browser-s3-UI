import { S3Client, ListBucketsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import 'dotenv/config';

const client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testConnection() {
  try {
    console.log('Testing S3 connection...');
    console.log('Bucket:', process.env.AWS_BUCKET_NAME);
    console.log('Region:', process.env.AWS_REGION);
    
    // Test listing buckets
    const listBucketsCommand = new ListBucketsCommand({});
    const bucketsResponse = await client.send(listBucketsCommand);
    console.log('✅ Available buckets:', bucketsResponse.Buckets.map(b => b.Name));
    
    // Test listing objects in the specific bucket
    const listObjectsCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_BUCKET_NAME,
      MaxKeys: 10
    });
    
    const objectsResponse = await client.send(listObjectsCommand);
    console.log('✅ Bucket access successful!');
    console.log('Objects in bucket:', objectsResponse.Contents?.length || 0);
    
  } catch (error) {
    console.error('❌ S3 connection error:', error.message);
    console.error('Error code:', error.$metadata?.httpStatusCode);
  }
}

testConnection();
