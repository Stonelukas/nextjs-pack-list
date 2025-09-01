"use client"

import { cn } from "@/lib/utils";
import { getProgressColor, getProgressGradient, getCompletionEmoji } from "@/lib/progress-utils";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  showEmoji?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  showEmoji = false,
  size = "md",
  animated = true,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const MotionDiv = animated ? motion.div : "div";
  const animationProps = animated ? {
    initial: { width: 0 },
    animate: { width: `${clampedValue}%` },
    transition: { duration: 0.5, ease: "easeOut" }
  } : {
    style: { width: `${clampedValue}%` }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage || showEmoji) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium">{label}</span>}
          <div className="flex items-center gap-2">
            {showEmoji && (
              <span className="text-lg">{getCompletionEmoji(clampedValue)}</span>
            )}
            {showPercentage && (
              <span className="font-medium tabular-nums">
                {clampedValue}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        sizeClasses[size]
      )}>
        <MotionDiv
          className={cn(
            "h-full rounded-full bg-gradient-to-r",
            getProgressGradient(clampedValue)
          )}
          {...animationProps}
        />
        
        {/* Shimmer effect for active progress */}
        {clampedValue > 0 && clampedValue < 100 && animated && (
          <motion.div
            className="absolute inset-0 h-full w-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
            }}
          >
            <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </motion.div>
        )}
      </div>
    </div>
  );
}