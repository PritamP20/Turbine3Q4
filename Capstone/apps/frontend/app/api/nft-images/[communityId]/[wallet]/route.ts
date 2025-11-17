import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (in production, use a database or cloud storage)
const imageStore = new Map<string, string>();

export async function GET(
  request: NextRequest,
  { params }: { params: { communityId: string; wallet: string } }
) {
  const key = `${params.communityId}-${params.wallet}`;
  const image = imageStore.get(key);
  
  if (!image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  
  return NextResponse.json({ image });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { communityId: string; wallet: string } }
) {
  try {
    const { image } = await request.json();
    
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }
    
    const key = `${params.communityId}-${params.wallet}`;
    imageStore.set(key, image);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to store image' }, { status: 500 });
  }
}
