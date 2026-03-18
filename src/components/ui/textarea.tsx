import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-[16px] border border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-1)] px-3.5 py-3 text-[0.95rem] text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] outline-none placeholder:text-muted-foreground/78 focus-visible:border-[color:var(--sg-accent)] focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]/80 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
