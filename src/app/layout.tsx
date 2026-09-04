import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'UTIJEK - Ride Hailing Lokal',
  description: 'Aplikasi layanan antar jemput lokal: UTIJEK, UTIKAN, UTITIP, UTIBASING',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo_tanpateks.png',
    shortcut: '/logo_tanpateks.png',
    apple: '/logo_tanpateks.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UTIJEK',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'UTIJEK',
    title: 'UTIJEK - Ride Hailing Lokal',
    description: 'Layanan antar jemput orang, makanan, dan barang.',
    images: [{ url: '/logo_teks.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#7B1113',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link rel="icon" href="/logo_tanpateks.png" />
        <link rel="apple-touch-icon" href="/logo_tanpateks.png" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
      </head>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#7B1113', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
