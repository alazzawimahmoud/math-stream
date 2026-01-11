"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GradientOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "blue" | "purple" | "green"
  size?: "xs" | "sm" | "md" | "lg"
  animated?: boolean
}

const sizeClasses = {
  xs: "w-4 h-4",
  sm: "w-6 h-6",
  md: "w-10 h-10",
  lg: "w-14 h-14",
}

const gradientClasses = {
  blue: "from-blue-400/80 via-sky-300/60 to-indigo-400/80",
  purple: "from-violet-400/80 via-purple-300/60 to-indigo-400/80",
  green: "from-emerald-400/80 via-green-300/60 to-teal-400/80",
}

const GradientOrb = React.forwardRef<HTMLDivElement, GradientOrbProps>(
  ({ className, variant = "purple", size = "sm", animated = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-full bg-gradient-to-br blur-[1px]",
          sizeClasses[size],
          gradientClasses[variant],
          animated && "animate-morph animate-float",
          className
        )}
        {...props}
      >
        <div 
          className={cn(
            "absolute inset-0.5 rounded-full bg-gradient-to-tl opacity-60",
            gradientClasses[variant],
            "blur-[2px]"
          )}
        />
        <div 
          className="absolute top-0.5 left-0.5 w-1/3 h-1/3 rounded-full bg-white/40 blur-[1px]"
        />
      </div>
    )
  }
)
GradientOrb.displayName = "GradientOrb"

export { GradientOrb }
