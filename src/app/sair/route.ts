import { NextResponse, type NextRequest } from 'next/server';
import { destroySession } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  // Aceita apenas formulários do próprio site
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== req.nextUrl.host) {
    return new NextResponse('Origem inválida', { status: 403 });
  }
  await destroySession();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
