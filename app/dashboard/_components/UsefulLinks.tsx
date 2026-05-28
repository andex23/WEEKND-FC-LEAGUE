"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, BookText, ClipboardList, LogOut, Send, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const TELEGRAM_GROUP_URL = process.env.NEXT_PUBLIC_TELEGRAM_GROUP_URL || "https://t.me/weekendfc"

export default function UsefulLinks({
  rulesUrl,
  telegramInvite,
  reportHref,
}: {
  rulesUrl?: string
  telegramInvite?: string
  reportHref?: string
}) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const telegramUrl = telegramInvite || TELEGRAM_GROUP_URL
  const links = [
    { href: rulesUrl || "/rules", label: "League Rules", icon: BookText, external: !!rulesUrl },
    { href: "/refer", label: "Refer a friend", icon: UserPlus, external: false },
    { href: telegramUrl, label: "Telegram group chat", icon: Send, external: true },
    { href: reportHref || "/report", label: "Report Result", icon: ClipboardList, external: false },
  ]

  const logout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/auth/login")
    router.refresh()
  }

  return (
    <section aria-label="Quick actions" className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <h3 className="font-heading text-sm text-white">Quick Actions</h3>
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
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg border border-[#1E1E1E] bg-[#0D0D0D] px-3 py-2.5 text-left text-sm text-[#D1D1D1] transition-colors hover:border-rose-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 text-rose-300" />
          <span className="flex-1">{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </section>
  )
}
