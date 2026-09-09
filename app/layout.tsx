import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import "./league-fonts.css"
import "./league.css"
import { SiteFooter } from "@/components/site-footer"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Weekend FC | EA FC Community League",
  description:
    "Join Weekend FC, compete in EA FC tournaments, and follow fixtures, results, and league standings.",
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
      <body suppressHydrationWarning>
        <a className="fc-skip" href="#main-content">
          Skip to content
        </a>
        <Navbar />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </body>
    </html>
  )
}
