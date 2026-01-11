import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all",
  {
    variants: {
      variant: {
        default: "border-0 gradient-blue text-secondary-foreground neu-raised-sm",
        secondary: "border-0 bg-muted text-muted-foreground neu-flat",
        destructive: "border-0 bg-destructive/10 text-destructive",
        outline: "border-border bg-card text-foreground",
        success: "border-0 gradient-green text-success-foreground neu-raised-sm",
        accent: "border-0 gradient-purple text-accent-foreground neu-raised-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
