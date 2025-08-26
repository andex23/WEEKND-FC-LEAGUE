"use client"

import Image from "next/image"

export default function UserCard({ user }: { user: any }) {
  return (
    <section aria-label="User info" className="rounded-2xl p-4 border bg-[#0D0D0D] text-white">
      <div className="flex items-center gap-3">
        <Image src={user.avatar_url || "/placeholder-user.jpg"} alt="Avatar" width={48} height={48} className="rounded-full" />
        <div>
          <h2 className="text-base font-semibold">{user.name}</h2>
          <p className="text-xs text-[#9E9E9E]">{user.preferredClub || user.assignedTeam || "—"} · {user.console || "—"}</p>
          <p className="text-xs text-[#9E9E9E]">Season: {user.season_name || "—"}</p>
        </div>
      </div>
    </section>
  )
}
