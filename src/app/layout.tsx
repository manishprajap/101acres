// src/app/layout.tsx
import 'yet-another-react-lightbox/styles.css';
import './globals.css';
import '../app/landing/assets/css/tailwind.css';
import '../app/landing/assets/css/materialdesignicons.min.css';

import type { Metadata } from 'next';
import SessionWrapper from './dashboard/components/SessionWrapper';

export const metadata: Metadata = {
  title: '101Acres - Buy, Sell & Rent Property in Delhi NCR',
  description:
    'Find properties for sale and rent in Delhi NCR, Noida, Gurgaon, Greater Noida, Ghaziabad and Faridabad. Buy, sell or rent flats, houses, plots, villas and commercial properties on 101Acres.',

   icons: {
    icon: "/images/logo1.png",
    shortcut: "/images/logo1.png",
    apple: "/images/logo1.png",
  },

  openGraph: {
    title: '101Acres - Buy, Sell & Rent Property in Delhi NCR',
    description:
      'Find properties for sale and rent across Delhi NCR including Noida, Gurgaon, Greater Noida, Ghaziabad and Faridabad.',
    url: 'https://101acres.com/',
    siteName: '101Acres',
    type: 'website',
    images: [
      {
        url: '/images/logo1.png',
        alt: '101Acres',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: '101Acres - Buy, Sell & Rent Property in Delhi NCR',
    description:
      'Search properties for sale and rent in Delhi NCR, Noida, Gurgaon, Greater Noida, Ghaziabad and Faridabad.',
    images: ['/images/logo1.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light scroll-smooth" dir="ltr">
      <body className="font-body text-base text-black">
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  );
}