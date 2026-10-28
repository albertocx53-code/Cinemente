import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Inter } from 'next/font/google';
import './globals.css';

const display = Bebas_Neue({ weight: '400', subsets: ['latin', 'latin-ext'], variable: '--font-bebas', display: 'swap' });
const body = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'CineMente — O cinema transforma. O conhecimento permanece.', template: '%s · CineMente' },
  description:
    'Plataforma de streaming educacional para professores de Filosofia e Sociologia: filmes, documentários, fichas pedagógicas, planos de aula e perguntas para debate.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icons/icon-192.png' },
  appleWebApp: { capable: true, title: 'CineMente', statusBarStyle: 'black-translucent' },
  openGraph: { title: 'CineMente', description: 'Filmes que viram aulas. Aulas que viram debate.', type: 'website', locale: 'pt_BR' },
};

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="grain">
        <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
        {children}
      </body>
    </html>
  );
}
