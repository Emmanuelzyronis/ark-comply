import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ArkComply — AI-native Regulatory Compliance Intelligence',
  description: 'Gap analysis in seconds, not weeks. Monitor EU AI Act, US Federal Register, FCA, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-brand-bg text-brand-text-base antialiased">
        {children}
      </body>
    </html>
  );
}
