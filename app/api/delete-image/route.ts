import { NextRequest, NextResponse } from 'next/server';
import { deleteFile, extractPathFromUrl } from '../../../src/lib/storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.user_type === 'admin';
    const isAgentOrOwner = profile?.user_type === 'agent' || profile?.user_type === 'owner';
    
    if (!isAdmin && !isAgentOrOwner) {
      return NextResponse.json(
        { error: 'Unauthorized - Agent, Owner, or Admin access required' },
        { status: 403 }
      );
    }

    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Extract path from URL
    const path = extractPathFromUrl(imageUrl);

    if (!path) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    // For non-admins, verify they own a property with this image
    if (!isAdmin) {
      // Extract property ID from path (format: property-{id}/image.jpg)
      const pathMatch = path.match(/property-([^/]+)/);
      if (pathMatch) {
        const propertyId = pathMatch[1];
        // Check if user owns this property
        const { data: property } = await supabase
          .from('properties')
          .select('agent_id, owner_id, agents(user_id)')
          .eq('id', propertyId)
          .maybeSingle();
        
        if (property) {
          const ownsProperty = 
            property.owner_id === user.id ||
            (property.agent_id && (property.agents as any)?.user_id === user.id);
          
          if (!ownsProperty) {
            return NextResponse.json(
              { error: 'Unauthorized - You can only delete images from your own properties' },
              { status: 403 }
            );
          }
        }
      }
    }

    // Delete from Hetzner Object Storage
    await deleteFile(path);

    return NextResponse.json({ success: true, path }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
