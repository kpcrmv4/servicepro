import { NextRequest, NextResponse } from 'next/server';
import { getBrandBySlug } from '@/lib/actions/branding';

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const brand = await getBrandBySlug(slug);
  return NextResponse.json(
    { brand },
    {
      headers: {
        // Brand changes infrequently — long cache, short stale
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
      },
    },
  );
}
