import type { LucideIcon } from "lucide-react"
import { Gamepad2, MapPin, Shield, Sparkles } from "lucide-react"
import { getTeamBadge } from "@/lib/badges"
import { cn } from "@/lib/utils"

interface PlayerCardProps {
  name?: string
  username?: string
  gamertag?: string
  club?: string
  consoleType?: string
  location?: string
  rating?: number | null
  tierLabel?: string
  minted?: boolean
  stats?: { label: string; value: string | number }[]
  className?: string
}

function getInitials(value?: string) {
  const v = (value ?? "").trim()
  if (!v) return ""
  return v
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />
      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-100/35">{label}</span>
      <span className="ml-auto max-w-[62%] truncate text-right text-[11px] text-white/85">
        {value?.trim() || "—"}
      </span>
    </div>
  )
}

export function PlayerCard({
  name,
  username,
  gamertag,
  club,
  consoleType,
  location,
  rating,
  tierLabel = "Rookie",
  minted = false,
  stats,
  className,
}: PlayerCardProps) {
  const crest = getTeamBadge(club)
  const displayName = (name ?? "").trim()
  const monogram = getInitials(name) || "★"

  return (
    <div className={cn("relative w-[290px] max-w-full animate-fut-rise", className)}>
      <div
        aria-hidden
        className={cn(
          "absolute -inset-5 rounded-[40px] blur-3xl transition-colors duration-700",
          minted ? "bg-emerald-500/25" : "bg-amber-400/10",
        )}
      />

      <div
        className={cn("relative rounded-[22px] p-[1.5px] transition-all duration-500", minted && "animate-fut-mint")}
        style={{
          background: minted
            ? "linear-gradient(160deg,#54f08f,#0f8a45 48%,#0a3d22)"
            : "linear-gradient(160deg,#f6dd93,#bd8f3e 38%,#6a4d1a 72%,#241a09)",
          boxShadow: minted ? "0 0 44px rgba(16,185,129,0.35)" : "0 24px 60px -24px rgba(0,0,0,0.9)",
        }}
      >
        <div
          className="fut-shine relative overflow-hidden rounded-[21px] px-5 pb-5 pt-6"
          style={{ background: "linear-gradient(168deg,#352c19 0%,#1f1b12 26%,#111111 60%,#0a0a0a 100%)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{ background: "radial-gradient(120% 58% at 50% 0%, rgba(246,221,147,0.16), transparent 62%)" }}
          />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex flex-col items-center">
              <div className="font-heading text-[46px] leading-none text-amber-100">{rating ?? "—"}</div>
              <div className="mt-1 text-[10px] font-bold tracking-[0.22em] text-amber-300/80">OVR</div>
              <div className="my-1.5 h-px w-8 bg-amber-400/40" />
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300/70">{tierLabel}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-black/50">
                {crest ? (
                  <img src={crest} alt="" className="h-8 w-8 object-contain" />
                ) : club ? (
                  <span className="font-heading text-[11px] text-amber-100">{getInitials(club)}</span>
                ) : (
                  <Sparkles className="h-5 w-5 text-amber-400/40" />
                )}
              </div>
              <span
                className={cn(
                  "rounded px-2 py-0.5 text-[9px] font-bold tracking-[0.16em]",
                  consoleType ? "bg-amber-400/15 text-amber-100" : "bg-white/5 text-white/25",
                )}
              >
                {consoleType || "—"}
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-1 flex justify-center">
            <div
              className="animate-fut-float flex h-28 w-28 items-center justify-center rounded-full"
              style={{ background: "radial-gradient(circle at 50% 38%, rgba(246,221,147,0.22), transparent 68%)" }}
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-amber-400/25 bg-gradient-to-b from-[#211d12] to-[#0c0c0c]">
                <span className="font-heading text-4xl tracking-wide text-amber-50">{monogram}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-2 text-center">
            <div className="truncate font-heading text-xl tracking-wide text-white">{displayName || "Your Name"}</div>
            <div className="mt-0.5 text-[10px] tracking-wide text-amber-300/60">
              {username ? `@${username}` : "@yourhandle"}
            </div>
          </div>

          <div className="relative z-10 my-3 h-px bg-gradient-to-r from-transparent via-amber-400/45 to-transparent" />

          {stats && stats.length > 0 ? (
            <div className="relative z-10 grid grid-cols-3 gap-1.5">
              {stats.slice(0, 6).map((st) => (
                <div
                  key={st.label}
                  className="rounded-md border border-amber-400/10 bg-black/30 px-1 py-1.5 text-center"
                >
                  <div className="font-heading text-base leading-none text-amber-100">{st.value}</div>
                  <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-amber-200/45">
                    {st.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative z-10 space-y-2">
              <InfoRow icon={Gamepad2} label="Gamertag" value={gamertag} />
              <InfoRow icon={Shield} label="Club" value={club} />
              <InfoRow icon={MapPin} label="Base" value={location} />
            </div>
          )}

          <div className="relative z-10 mt-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-amber-400/20" />
            <span className="text-[9px] font-bold tracking-[0.24em] text-amber-300/55">WEEKEND FC · S1</span>
            <div className="h-px flex-1 bg-amber-400/20" />
          </div>

          {minted && (
            <div className="absolute inset-x-0 top-[33%] z-30 flex justify-center">
              <div className="animate-fut-pop -rotate-12 rounded-md border-2 border-emerald-400/90 bg-black/45 px-3 py-1 backdrop-blur-sm">
                <span className="font-heading text-sm tracking-[0.2em] text-emerald-300">Minted</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
