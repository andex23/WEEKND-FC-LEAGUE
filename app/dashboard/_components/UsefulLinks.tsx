"use client"

import Link from "next/link"
import { ArrowUpRight, BookText, ClipboardList, MessageCircle } from "lucide-react"

export default function UsefulLinks({
  rulesUrl,
  discordInvite,
  reportHref,
}: {
  rulesUrl?: string
  discordInvite?: string
  reportHref?: string
}) {
  const links = [
    { href: rulesUrl || "/rules", label: "League Rules", icon: BookText, external: !!rulesUrl },
    { href: discordInvite || "https://discord.gg/YZumc42p", label: "Discord", icon: MessageCircle, external: true },
    { href: reportHref || "/report", label: "Report Result", icon: ClipboardList, external: false },
  ]

  return (
    <section aria-label="Quick links" className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <h3 className="font-heading text-sm text-white">Quick Links</h3>
      <div className="mt-3 space-y-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            target={l.external ? "_blank" : undefined}
            rel={l.external ? "noopener noreferrer" : undefined}
            className="flex items-center gap-3 rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] px-3 py-2.5 text-sm text-[#D1D1D1] transition-colors hover:border-emerald-500/40 hover:text-white"
          >
            <l.icon className="h-4 w-4 text-emerald-400" />
            <span className="flex-1">{l.label}</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#5C5C5C]" />
          </Link>
        ))}
      </div>
    </section>
  )
}
