import { NextResponse, type NextRequest } from 'next/server';
import { getSuggestions } from '@/lib/catalog';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const items = await getSuggestions(q);
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
