import Image from "next/image"
import Link from "next/link"

export function SiteLogo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <Image src="/logo.png" alt="Weeknd FC" width={size} height={size} priority />
      <span className="sr-only">Weeknd FC</span>
    </Link>
  )
}
