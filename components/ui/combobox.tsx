"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxProps {
  options: string[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const uniqueOptions = React.useMemo(() => Array.from(new Set(options)), [options])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between border-[#2A2A2A] bg-[#0F0F0F] font-normal text-white hover:bg-[#141414] hover:text-white",
            !value && "text-[#5C5C5C]",
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] border-[#2A2A2A] bg-[#0F0F0F] p-0 text-white">
        <Command className="bg-[#0F0F0F]">
          <CommandInput placeholder={searchPlaceholder} className="text-white" />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-[#6B6B6B]">{emptyText}</CommandEmpty>
            <CommandGroup>
              {uniqueOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option === value ? "" : option)
                    setOpen(false)
                  }}
                  className="text-[#D1D1D1] data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-white"
                >
                  <Check
                    className={cn("mr-2 h-4 w-4 text-emerald-400", value === option ? "opacity-100" : "opacity-0")}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
