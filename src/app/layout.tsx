import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 여자친구 💕',
  description: '나만의 AI 여자친구와 대화해요',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
