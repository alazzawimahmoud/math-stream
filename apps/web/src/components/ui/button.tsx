import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground neu-raised-sm hover:brightness-105",
        destructive: "bg-destructive text-destructive-foreground neu-raised-sm hover:brightness-105",
        outline: "border-2 border-border bg-card neu-flat hover:bg-muted",
        secondary: "gradient-blue text-secondary-foreground neu-raised-sm hover:brightness-105",
        ghost: "hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        neu: "bg-card text-foreground neu-raised hover:neu-raised-sm",
        "neu-pressed": "bg-muted text-foreground neu-pressed",
        pill: "gradient-blue text-secondary-foreground rounded-full neu-raised-sm hover:brightness-105",
        "pill-accent": "gradient-purple text-accent-foreground rounded-full neu-raised-sm hover:brightness-105",
        "pill-success": "gradient-green text-success-foreground rounded-full neu-raised-sm hover:brightness-105",
      },
      size: {
        default: "h-8 px-4 py-1.5 rounded-xl text-xs",
        sm: "h-7 px-3 text-xs rounded-lg",
        lg: "h-10 px-6 text-sm rounded-xl",
        xl: "h-11 px-8 text-base rounded-2xl",
        icon: "h-8 w-8 rounded-xl",
        "icon-sm": "h-7 w-7 rounded-lg",
        "icon-lg": "h-9 w-9 rounded-xl",
        pill: "h-8 px-4 rounded-full text-xs",
        "pill-sm": "h-7 px-3 text-xs rounded-full",
        "pill-lg": "h-9 px-5 text-sm rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
