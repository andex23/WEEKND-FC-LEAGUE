"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function DatePicker({ value, onChange, placeholder }: { value?: string; onChange: (iso: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false)
  const date = value ? new Date(value) : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {value ? new Date(value).toLocaleDateString() : (placeholder || "Pick a date")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-[#141414] text-white border">
        <Calendar mode="single" selected={date} onSelect={(d) => { if (d) { onChange(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()); setOpen(false) } }} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

