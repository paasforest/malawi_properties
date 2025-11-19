import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, extractPathFromUrl } from '../../../src/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Delete Image API: Received request', { imageUrl });

    // Extract path from URL
    const path = extractPathFromUrl(imageUrl);

    if (!path) {
      console.error('❌ Delete Image API: Could not extract path from URL', { imageUrl });
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    console.log('🗑️ Delete Image API: Deleting from Hetzner...', { path });

    // Delete from Hetzner Object Storage
    await deleteFile(path);

    console.log('✅ Delete Image API: Deleted successfully', { path });

    return NextResponse.json({ success: true, path }, { status: 200 });
  } catch (error) {
    console.error('❌ Delete Image API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

