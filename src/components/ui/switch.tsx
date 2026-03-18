"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-[color:var(--sg-accent)] focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]/70 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 data-[size=default]:h-[22px] data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-9 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25 data-checked:border-[rgba(99,102,241,0.3)] data-unchecked:border-[color:var(--sg-border-2)] data-checked:bg-[image:var(--sg-accent-gradient)] data-unchecked:bg-[color:var(--sg-surface-2)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-white ring-0 shadow-[0_2px_8px_rgba(0,0,0,0.22)] transition-transform group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-[18px] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=default]/switch:data-unchecked:translate-x-[1px] group-data-[size=sm]/switch:data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
