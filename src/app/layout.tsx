import type { Metadata, Viewport } from 'next'
import { Cinzel_Decorative, Cinzel, IM_Fell_English_SC } from 'next/font/google'
import './globals.css'

const cinzelDecorative = Cinzel_Decorative({
  variable: '--font-cinzel-decorative',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
})

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

const imFell = IM_Fell_English_SC({
  variable: '--font-im-fell',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'go!go!budapest',
  description: 'A gothic quest through the streets of Budapest',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'go!go!budapest',
    description: 'A gothic quest through the streets of Budapest',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f0d0a',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzelDecorative.variable} ${cinzel.variable} ${imFell.variable} h-full`}
    >
      <body className="min-h-dvh flex flex-col antialiased">{children}</body>
    </html>
  )
}
