import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sheet Sensei',
  description: 'Hybrid chatbot backed by Google Sheets with OpenRouter fallback'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
