import './globals.css';
import type { ReactNode } from 'react';
import { Header } from '../src/components/Header';

export const metadata = {
  title: 'Malawi Properties',
  description: 'Malawi Property Marketplace for the diaspora',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <Header />
        {children}
      </body>
    </html>
  );
}

