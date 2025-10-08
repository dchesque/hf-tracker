import { cn } from "@/lib/utils"

interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string
  speed?: string
  size?: "sm" | "md" | "lg"
  className?: string
  children: React.ReactNode
}

export function StarBorder({
  className,
  color,
  speed = "6s",
  size = "md",
  children,
  ...props
}: StarBorderProps) {
  const defaultColor = color || "hsl(var(--foreground))"

  const sizeClasses = {
    sm: "py-2 px-4 text-sm",
    md: "py-4 px-6 text-base",
    lg: "py-5 px-8 text-lg"
  }

  return (
    <div
      className={cn(
        "relative inline-block py-[1px] overflow-hidden rounded-[20px] cursor-pointer",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute w-[300%] h-[50%] bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0",
          "opacity-30 dark:opacity-70"
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute w-[300%] h-[50%] top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0",
          "opacity-30 dark:opacity-70"
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn(
        "relative z-1 border text-foreground text-center rounded-[20px]",
        "bg-gradient-to-b from-background/90 to-muted/90 border-border/40",
        "dark:from-background dark:to-muted dark:border-border",
        sizeClasses[size]
      )}>
        {children}
      </div>
    </div>
  )
}
