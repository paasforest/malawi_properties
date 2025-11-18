import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '../../../src/lib/storage';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Upload API: Received request');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    console.log('📥 Upload API: Extracted data', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      path 
    });

    if (!file || !path) {
      console.error('❌ Upload API: Missing file or path', { hasFile: !!file, hasPath: !!path });
      return NextResponse.json(
        { error: 'File and path are required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('📤 Upload API: Uploading to Hetzner...', { path, size: buffer.length });

    // Upload to Hetzner Object Storage
    const url = await uploadFile(buffer, path, file.type);

    console.log('✅ Upload API: Upload successful', { url });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('❌ Upload API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('❌ Upload API error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

