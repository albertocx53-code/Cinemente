import { NextResponse, type NextRequest } from 'next/server';

// Barreira rápida: sem cookie de sessão, nem chega a renderizar áreas privadas.
// A validação real da sessão (banco de dados) acontece no servidor, em cada página.
export function middleware(req: NextRequest) {
  if (!req.cookies.get('cm_session')) {
    const url = req.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = `?volta=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/navegar/:path*', '/titulo/:path*', '/buscar/:path*', '/perfis/:path*', '/conta/:path*'],
};
