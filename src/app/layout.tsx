import type { Metadata, Viewport } from 'next'
import { Cinzel_Decorative, Cinzel, IM_Fell_English_SC } from 'next/font/google'
import localFont from 'next/font/local'
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

const newRocker = localFont({
  src: '../../public/newrocker-font/Newrocker-Gy5a.ttf',
  variable: '--font-new-rocker',
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
  themeColor: '#191713',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzelDecorative.variable} ${cinzel.variable} ${imFell.variable} ${newRocker.variable} h-full`}
    >
      <body className="min-h-dvh flex flex-col antialiased">{children}</body>
    </html>
  )
}
