import type React from "react"
import type { Metadata } from "next"
import { Roboto } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-roboto",
})

export const metadata: Metadata = {
  title: "Weekend Premier League - FIFA 25",
  description: "EA FC Community League for FIFA 25 players",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${roboto.variable}`}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-F1DCSXWT0Q"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-F1DCSXWT0Q');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning className="font-courier">
        <Navbar />
        <main>{children}</main>
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </body>
    </html>
  )
}
