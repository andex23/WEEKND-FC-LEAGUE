import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-[#1E1E1E] bg-[#141414] px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-3xl">{icon}</div> : null}
      <div className="text-base font-semibold text-white">{title}</div>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[#9E9E9E]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
