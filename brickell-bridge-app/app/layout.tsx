import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Brickell Bridge Status',
  description: 'Check whether the Brickell Avenue Bridge is up or down using Florida 511 data.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
