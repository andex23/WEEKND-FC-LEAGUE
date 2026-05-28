import * as React from "react"

import { cn } from "@/lib/utils"

function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn("relative grid w-full grid-cols-[0_1fr] gap-x-3 rounded-lg border p-4 text-sm [&>svg]:size-4 [&>svg]:translate-y-0.5", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("col-start-2 text-sm", className)} {...props} />
}

export { Alert, AlertDescription }
