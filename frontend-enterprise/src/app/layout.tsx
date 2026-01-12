import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SaaS AI Sales Assistant',
    template: '%s | SalesAI',
  },
  description: 'Assistente de vendas com IA para ligações e WhatsApp em tempo real',
  keywords: ['vendas', 'IA', 'sales', 'whatsapp', 'ligações', 'assistente'],
  authors: [{ name: 'SalesAI' }],
  creator: 'SalesAI',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'SaaS AI Sales Assistant',
    title: 'SaaS AI Sales Assistant',
    description: 'Assistente de vendas com IA para ligações e WhatsApp em tempo real',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaaS AI Sales Assistant',
    description: 'Assistente de vendas com IA para ligações e WhatsApp em tempo real',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR" suppressHydrationWarning>
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
        >
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
