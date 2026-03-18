/* eslint-disable react-refresh/only-export-components */

"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[12px] border border-transparent bg-clip-padding text-sm font-semibold tracking-[-0.015em] whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow,opacity,filter] duration-150 outline-none select-none focus-visible:border-[color:var(--sg-accent)] focus-visible:ring-4 focus-visible:ring-[color:var(--ring)]/80 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "sg-btn-accent text-primary-foreground shadow-[0_16px_36px_-22px_rgba(99,102,241,0.75)] hover:shadow-[0_18px_42px_-18px_rgba(99,102,241,0.72)]",
        outline:
          "border-[color:var(--sg-border-2)] bg-[color:var(--sg-surface-1)] text-foreground shadow-none backdrop-blur-xl hover:border-[color:var(--sg-border-3)] hover:bg-[color:var(--sg-surface-2)] hover:text-foreground aria-expanded:bg-[color:var(--sg-surface-2)] aria-expanded:text-foreground",
        secondary:
          "border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] text-secondary-foreground hover:border-[color:var(--sg-border-2)] hover:bg-[color:var(--sg-surface-3)] aria-expanded:bg-[color:var(--sg-surface-3)]",
        ghost:
          "border-transparent bg-transparent hover:border-[color:var(--sg-border-1)] hover:bg-[color:var(--sg-surface-2)] hover:text-foreground aria-expanded:border-[color:var(--sg-border-1)] aria-expanded:bg-[color:var(--sg-surface-2)] aria-expanded:text-foreground",
        destructive:
          "border-[color:var(--sg-error)] bg-[color:var(--sg-error-soft)] text-[color:var(--sg-error)] hover:bg-[rgba(248,113,113,0.16)] focus-visible:border-[color:var(--sg-error)] focus-visible:ring-[rgba(248,113,113,0.2)] dark:hover:bg-[rgba(248,113,113,0.2)]",
        accent:
          "sg-btn-accent text-primary-foreground shadow-[0_18px_38px_-22px_rgba(99,102,241,0.85)] hover:shadow-[0_20px_44px_-20px_rgba(99,102,241,0.82)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-[10px] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-[12px] px-3 text-[0.85rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-[0.95rem] has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-10",
        "icon-xs":
          "size-7 rounded-[10px] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[12px] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
