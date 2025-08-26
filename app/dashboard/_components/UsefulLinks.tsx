"use client"

export default function UsefulLinks({ rulesUrl, discordInvite, reportHref }: { rulesUrl?: string; discordInvite?: string; reportHref?: string }) {
  return (
    <nav aria-label="Useful links" className="rounded-2xl p-4 border bg-[#0D0D0D] text-white space-y-2">
      <h3 className="text-sm font-semibold">Useful Links</h3>
      <ul className="text-sm text-[#9E9E9E] space-y-1">
        <li><a className="underline" href={rulesUrl || "#"} target="_blank">Rules PDF</a></li>
        <li><a className="underline" href={discordInvite || "#"} target="_blank">Discord Invite</a></li>
        <li><a className="underline" href={reportHref || "/dashboard?report=1"}>Report Result</a></li>
      </ul>
    </nav>
  )
}
