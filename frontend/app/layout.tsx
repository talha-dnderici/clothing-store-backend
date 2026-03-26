import type { Metadata } from 'next';
import { SiteHeader } from '../components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clothes Minimal Store',
  description: 'Minimal storefront, login page, and backend studio for the clothing store API',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
