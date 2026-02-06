import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: "Passaggio a Livello Bitonto | Monitoraggio Real-Time",
  description: "Controlla se il passaggio a livello di Bitonto è aperto o chiuso in tempo reale. Dati basati sugli orari Ferrotramviaria.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Passaggio a Livello Bitonto",
    description: "Evita le attese! Controlla lo stato del passaggio a livello in tempo reale.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bitonto Crossing",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

import { ThemeProvider } from '@/components/theme-provider';

// ... imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen selection:bg-cyan-500/30`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
