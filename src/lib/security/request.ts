import { headers } from 'next/headers';

export async function getRequestInfo() {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0] : h.get('x-real-ip')) || 'desconhecido';
  return { ip: ip.trim(), userAgent: (h.get('user-agent') || '').slice(0, 300) };
}
