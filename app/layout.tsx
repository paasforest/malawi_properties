import './globals.css';
import type { ReactNode } from 'react';
import { Header } from '../src/components/Header';

export const metadata = {
  title: 'Malawi Properties',
  description: 'Malawi Property Marketplace for the diaspora',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Header />
        {children}
      </body>
    </html>
  );
}

