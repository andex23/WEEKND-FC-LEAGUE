import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Weekend FC | EA FC Community League",
  description: "Join Weekend FC, compete in EA FC tournaments, and follow fixtures, results, and league standings.",
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
