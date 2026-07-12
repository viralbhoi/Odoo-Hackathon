import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Custom domain status variants
        available: "border-transparent bg-green-500/20 text-green-500 border border-green-500/30",
        on_trip: "border-transparent bg-blue-500/20 text-blue-500 border border-blue-500/30",
        dispatched: "border-transparent bg-blue-500/20 text-blue-500 border border-blue-500/30",
        in_shop: "border-transparent bg-amber-500/20 text-amber-500 border border-amber-500/30",
        suspended: "border-transparent bg-amber-500/20 text-amber-500 border border-amber-500/30",
        retired: "border-transparent bg-rose-500/20 text-rose-500 border border-rose-500/30",
        draft: "border-transparent bg-gray-500/20 text-gray-400 border border-gray-500/30",
        off_duty: "border-transparent bg-gray-500/20 text-gray-400 border border-gray-500/30",
        completed: "border-transparent bg-green-500/20 text-green-500 border border-green-500/30",
        cancelled: "border-transparent bg-red-500/20 text-red-500 border border-red-500/30",
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
