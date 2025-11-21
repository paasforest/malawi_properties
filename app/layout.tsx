import './globals.css';
import type { ReactNode } from 'react';
import { Header } from '../src/components/Header';
import { Footer } from '../src/components/Footer';
import { VisitTracker } from '../src/components/VisitTracker';

export const metadata = {
  title: 'Malawi Properties',
  description: 'Malawi Property Marketplace for the diaspora',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <VisitTracker />
      </body>
    </html>
  );
}

