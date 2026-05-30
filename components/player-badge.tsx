import { User } from "lucide-react"
import { getTeamBadge } from "@/lib/badges"
import { cn } from "@/lib/utils"

interface PlayerBadgeProps {
  avatarUrl?: string | null
  team?: string | null
  className?: string
}

// Player identity for standings & podium: a circular avatar (uploaded photo or
// silhouette fallback) with the club crest pinned to the bottom-right corner
// when known.
export function PlayerBadge({ avatarUrl, team, className }: PlayerBadgeProps) {
  const crest = getTeamBadge(team)

  return (
    <span className={cn("relative mr-3 inline-block h-8 w-8 shrink-0", className)}>
      <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#1E1E1E] bg-[#0F0F0F] text-[#5C5C5C]">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-4 w-4" aria-hidden />
        )}
      </span>
      {crest && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center overflow-hidden rounded-full border border-[#0A0A0A] bg-[#0F0F0F]">
          <img src={crest} alt="" className="h-full w-full object-contain" />
        </span>
      )}
    </span>
  )
}
