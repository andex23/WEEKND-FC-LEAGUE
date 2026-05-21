"use client"

export default function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#1E1E1E] bg-[#111111] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7A7A]">{label}</div>
      <div className="mt-1 font-heading text-2xl tabular-nums text-emerald-400">{value}</div>
    </div>
  )
}
