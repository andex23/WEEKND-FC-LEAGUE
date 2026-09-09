import type React from "react"
import type { Metadata } from "next"
import { pageMetadata, SITE_URL } from "@/lib/seo"
import Script from "next/script"
import "./globals.css"
import "./league-fonts.css"
import "./league.css"
import "./home.css"
import { SiteFooter } from "@/components/site-footer"
import { Navbar } from "@/components/navbar"
import { Toaster } from "sonner"
import { DruAnalytics } from "@/components/dru-analytics"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  ...pageMetadata(
    "Weekend FC | Online EA FC League",
    "Join Weekend FC, an online EA FC community league. Play Friday to Sunday, build your player card and follow fixtures, results and standings.",
    "/",
  ),
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
        <DruAnalytics />
        <a className="fc-skip" href="#main-content">
          Skip to content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Weekend FC",
              url: SITE_URL,
              description:
                "An independent online EA FC community league with Friday–Sunday matchdays.",
            }),
          }}
        />
        <Navbar />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </body>
    </html>
  )
}
