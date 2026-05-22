import { AlertCircle } from "lucide-react"

/** A designed inline error panel for form and page error states. */
export function ErrorBanner({
  title = "Something went wrong",
  message,
}: {
  title?: string
  message: string
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-rose-300">{title}</p>
        <p className="text-[13px] leading-relaxed text-rose-200/80">{message}</p>
      </div>
    </div>
  )
}
