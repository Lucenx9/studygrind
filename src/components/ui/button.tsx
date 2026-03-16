/* eslint-disable react-refresh/only-export-components */

"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[14px] border border-transparent bg-clip-padding text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/18 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/25 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_24px_-18px_color-mix(in_oklab,var(--color-primary)_40%,transparent)] hover:bg-primary/95 hover:shadow-[0_16px_28px_-18px_color-mix(in_oklab,var(--color-primary)_48%,transparent)]",
        outline:
          "border-border/75 bg-background/72 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-sm hover:border-primary/20 hover:bg-accent/60 hover:text-foreground aria-expanded:bg-accent/60 aria-expanded:text-foreground dark:border-input dark:bg-input/28 dark:hover:bg-input/48",
        secondary:
          "bg-secondary/85 text-secondary-foreground hover:bg-secondary/95 aria-expanded:bg-secondary/95 aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-accent/55 hover:text-foreground aria-expanded:bg-accent/55 aria-expanded:text-foreground dark:hover:bg-muted/42",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/16 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/18 dark:hover:bg-destructive/26 dark:focus-visible:ring-destructive/35",
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
