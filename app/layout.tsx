import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StockSense — Real-Time Warehouse Stock Ledger',
  description: 'Real-time stock ledger with predictive alerts replacing manual registers, Excel, and WhatsApp workflows for SMB warehouses.',
};

import { AuthProvider } from '@/hooks/use-auth';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen bg-[#0A0A0B] text-[#FAFAFA] font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#161618',
              border: '1px solid #27272A',
              color: '#FAFAFA',
            },
          }}
        />
      </body>
    </html>
  );
}
