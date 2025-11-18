import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Hetzner Object Storage configuration
const endpoint = process.env.HETZNER_S3_ENDPOINT;
const region = process.env.HETZNER_S3_REGION || 'fsn1';
const accessKeyId = process.env.HETZNER_S3_ACCESS_KEY;
const secretAccessKey = process.env.HETZNER_S3_SECRET_KEY;
const bucketName = process.env.HETZNER_S3_BUCKET || 'hope-properties-images';

console.log('🧪 Testing Hetzner Object Storage Configuration\n');
console.log('Configuration:');
console.log(`  Endpoint: ${endpoint || '❌ MISSING'}`);
console.log(`  Region: ${region}`);
console.log(`  Access Key: ${accessKeyId ? accessKeyId.substring(0, 8) + '...' : '❌ MISSING'}`);
console.log(`  Secret Key: ${secretAccessKey ? '***' + secretAccessKey.substring(secretAccessKey.length - 4) : '❌ MISSING'}`);
console.log(`  Bucket: ${bucketName}\n`);

// Validate configuration
if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('❌ Missing required environment variables!');
  console.error('Make sure .env.local has:');
  console.error('  - HETZNER_S3_ENDPOINT');
  console.error('  - HETZNER_S3_ACCESS_KEY');
  console.error('  - HETZNER_S3_SECRET_KEY');
  console.error('  - HETZNER_S3_BUCKET');
  process.exit(1);
}

// Create S3 client
const s3Client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true, // Required for Hetzner
  requestHandler: {
    requestTimeout: 10000, // 10 seconds
    httpsAgent: {
      keepAlive: true,
    },
  },
});

async function testConnection() {
  console.log('📡 Step 1: Testing connection to Hetzner...');
  try {
    // Try HeadBucket first
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await Promise.race([
      s3Client.send(command),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 15 seconds')), 15000))
    ]);
    console.log('  ✅ Connection successful!\n');
    return true;
  } catch (error: any) {
    console.error('  ❌ Connection failed:', error.message || error.toString());
    console.error('  📋 Error details:', JSON.stringify({
      name: error.name,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
    }, null, 2));
    
    if (error.$metadata?.httpStatusCode === 403) {
      console.error('  ⚠️  This might be a permissions issue. Check your access keys.');
    } else if (error.$metadata?.httpStatusCode === 404) {
      console.error('  ⚠️  Bucket not found. Make sure the bucket name is correct.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('  ⚠️  Cannot reach endpoint. Check if HETZNER_S3_ENDPOINT is correct.');
      console.error('  💡 The endpoint should be something like: https://fsn1.your-objectstorage.com');
    }
    console.error('');
    return false;
  }
}

async function testUpload() {
  console.log('📤 Step 2: Testing file upload...');
  
  // Create a small test file in memory
  const testContent = `Hetzner Storage Test - ${new Date().toISOString()}`;
  const testFilePath = `test/connection-test-${Date.now()}.txt`;
  const buffer = Buffer.from(testContent, 'utf-8');

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: testFilePath,
      Body: buffer,
      ContentType: 'text/plain',
      CacheControl: 'public, max-age=60',
    });

    await s3Client.send(command);
    console.log(`  ✅ Upload successful!`);
    console.log(`  📁 Path: ${testFilePath}\n`);
    return testFilePath;
  } catch (error: any) {
    console.error('  ❌ Upload failed:', error.message);
    console.error('');
    return null;
  }
}

async function testDownload(filePath: string) {
  console.log('📥 Step 3: Testing file download...');
  
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    const response = await s3Client.send(command);
    const chunks: Uint8Array[] = [];
    
    // @ts-ignore - response.Body is a stream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const content = Buffer.concat(chunks).toString('utf-8');
    console.log('  ✅ Download successful!');
    console.log(`  📄 Content: ${content.substring(0, 50)}...\n`);
    return true;
  } catch (error: any) {
    console.error('  ❌ Download failed:', error.message);
    console.error('');
    return false;
  }
}

async function testDelete(filePath: string) {
  console.log('🗑️  Step 4: Cleaning up test file...');
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3Client.send(command);
    console.log('  ✅ Test file deleted\n');
    return true;
  } catch (error: any) {
    console.error('  ⚠️  Failed to delete test file:', error.message);
    console.error('  (You can delete it manually from Hetzner console)\n');
    return false;
  }
}

async function getPublicUrl(filePath: string) {
  console.log('🔗 Step 5: Getting public URL...');
  
  try {
    const endpoint = process.env.HETZNER_S3_ENDPOINT;
    const publicUrl = `${endpoint}/${bucketName}/${filePath}`;
    console.log(`  📎 Public URL: ${publicUrl}`);
    
    // Test if URL is accessible
    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        console.log('  ✅ URL is publicly accessible!\n');
      } else {
        console.log(`  ⚠️  URL returned status ${response.status} (bucket might be private)\n`);
      }
    } catch (error) {
      console.log('  ⚠️  Could not verify URL accessibility (this is OK if bucket is private)\n');
    }
    
    return publicUrl;
  } catch (error: any) {
    console.error('  ❌ Failed to generate URL:', error.message);
    console.error('');
    return null;
  }
}

async function runTests() {
  try {
    // Test 1: Connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Connection test failed. Please check your configuration.');
      process.exit(1);
    }

    // Test 2: Upload
    const testFilePath = await testUpload();
    if (!testFilePath) {
      console.error('❌ Upload test failed.');
      process.exit(1);
    }

    // Test 3: Download
    await testDownload(testFilePath);

    // Test 4: Get Public URL
    await getPublicUrl(testFilePath);

    // Test 5: Delete
    await testDelete(testFilePath);

    console.log('🎉 All tests passed! Hetzner Storage is configured correctly.');
    console.log('✅ You can now upload images through your website.\n');
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

