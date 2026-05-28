import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Weekend Premier League - FIFA 25",
  description: "EA FC Community League for FIFA 25 players",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
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
