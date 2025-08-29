import type {Metadata} from 'next';
import {Rubik} from 'next/font/google';
import {ReactNode} from "react";
import './globals.css';

const rubik = Rubik({
  variable: '--font-rubik',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Oğuzhan ve Hatice',
  description: 'Oğuzhan ve Hatice\'nin düğünü için medya paylaşım portalı.',
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="tr">
    <body className={`${rubik.className} antialiased`}>{children}</body>
    </html>
  );
}
