import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'istaysin | Hotel & Lodge Management Platform',
  description: 'All-in-one operating system for hospitality. From a single-room dharamshala to a 500-room resort. Booking engine, PMS, billing, and more.',
  keywords: 'hotel management, lodge management, PMS, booking engine, hospitality software, India',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
