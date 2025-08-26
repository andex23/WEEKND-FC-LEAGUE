"use client"

export default function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-4 border bg-[#0D0D0D] text-white">
      <div className="text-xs text-[#9E9E9E]">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-[#00C853]">{value}</div>
    </div>
  )
}
