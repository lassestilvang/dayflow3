"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const isSmallSize = className?.includes('size-3');
  
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base styles with enhanced contrast
        "peer relative shrink-0 border-2 transition-all duration-200 outline-none",
        // Default size (can be overridden with size-* classes)
        "size-4",
        // Adaptive border radius - smaller for small checkboxes
        isSmallSize ? "rounded-[2px]" : "rounded-sm",
        // Default state - better contrast for both light and dark
        "border-gray-400 bg-white dark:border-gray-500 dark:bg-gray-800",
        // Hover state
        "hover:border-gray-600 dark:hover:border-gray-400 hover:shadow-sm",
        // Focus state
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900",
        // Checked state - vibrant colors with good contrast
        "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white",
        "data-[state=checked]:hover:bg-blue-700 data-[state=checked]:hover:border-blue-700",
        "dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 dark:data-[state=checked]:hover:bg-blue-600",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid state
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-white transition-transform duration-200 data-[state=checked]:scale-100 data-[state=unchecked]:scale-0"
      >
        <CheckIcon 
          className={cn(
            "drop-shadow-sm",
            isSmallSize ? "size-2" : "size-3"
          )} 
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
