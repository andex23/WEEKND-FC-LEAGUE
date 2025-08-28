"use client"

import * as React from "react"

export function TimePicker({ value, onChange, disabled }: { value?: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <input
      type="time"
      step={300}
      value={value || ""}
      onChange={(e) => onChange(e.currentTarget.value)}
      disabled={disabled}
      className="bg-transparent border rounded px-2 py-1 h-9"
    />
  )
}



