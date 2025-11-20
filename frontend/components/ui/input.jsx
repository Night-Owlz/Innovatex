import * as React from "react"
import { cn } from "@/lib/utils-cn"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
