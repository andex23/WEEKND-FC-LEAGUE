import React from "react"

type StatusType = "Pending" | "Confirmed" | "Approved" | "Disputed"

const classes: Record<StatusType, string> = {
  Pending: "bg-amber-100 text-amber-800 border border-amber-200",
  Confirmed: "bg-blue-100 text-blue-800 border border-blue-200",
  Approved: "bg-green-100 text-green-800 border border-green-200",
  Disputed: "bg-red-100 text-red-800 border border-red-200",
}

export function StatusChip({ status }: { status: StatusType }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[status]}`}>{status}</span>
}
