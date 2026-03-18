/* eslint-disable react-refresh/only-export-components */

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em] whitespace-nowrap transition-all focus-visible:border-[color:var(--sg-accent)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--ring)]/70 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[color:var(--sg-accent-soft)] text-primary-foreground sg-btn-accent [a]:hover:opacity-90",
        secondary:
          "border-[color:var(--sg-border-1)] bg-[color:var(--sg-surface-2)] text-secondary-foreground [a]:hover:bg-[color:var(--sg-surface-3)]",
        destructive:
          "border-[color:var(--sg-error)] bg-[color:var(--sg-error-soft)] text-[color:var(--sg-error)] focus-visible:ring-destructive/20 [a]:hover:bg-[rgba(248,113,113,0.2)]",
        outline:
          "border-[color:var(--sg-border-2)] bg-transparent text-foreground [a]:hover:bg-[color:var(--sg-surface-2)] [a]:hover:text-foreground",
        ghost:
          "border-transparent hover:bg-[color:var(--sg-surface-2)] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
