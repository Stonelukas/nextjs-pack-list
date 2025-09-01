"use client"

import { ReactNode, useState, useRef, useCallback } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [{ y, rotate }, api] = useSpring(() => ({
    y: 0,
    rotate: 0,
  }));

  const bind = useDrag(
    async ({ down, movement: [, my], first, last, memo = { canPull: false } }) => {
      if (disabled || isRefreshing) return memo;

      // Check if we're at the top of the scrollable area
      if (first) {
        const container = containerRef.current;
        if (container) {
          memo.canPull = container.scrollTop <= 0;
        }
      }

      if (!memo.canPull || my < 0) {
        api.start({ y: 0, rotate: 0 });
        return memo;
      }

      const pullDistance = Math.min(my, threshold * 1.5);
      const rotation = (pullDistance / threshold) * 360;

      if (down) {
        api.start({
          y: pullDistance,
          rotate: rotation,
          immediate: true,
        });
      } else if (last) {
        if (pullDistance >= threshold) {
          // Trigger refresh
          setIsRefreshing(true);
          api.start({
            y: threshold,
            rotate: 360,
            config: { tension: 200, friction: 20 },
          });

          try {
            await onRefresh();
          } finally {
            setIsRefreshing(false);
            api.start({
              y: 0,
              rotate: 0,
              config: { tension: 200, friction: 20 },
            });
          }
        } else {
          // Spring back
          api.start({
            y: 0,
            rotate: 0,
            config: { tension: 200, friction: 20 },
          });
        }
      }

      return memo;
    },
    {
      axis: "y",
      filterTaps: true,
      bounds: { top: 0 },
      rubberband: false,
    }
  );

  const indicatorOpacity = y.to([0, threshold], [0, 1]);
  const indicatorScale = y.to([0, threshold], [0.5, 1]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull indicator */}
      <animated.div
        style={{
          opacity: indicatorOpacity,
          transform: y.to((val) => `translateY(${val - 40}px)`),
        }}
        className="absolute left-1/2 -translate-x-1/2 z-10"
      >
        <animated.div
          style={{
            transform: rotate.to((r) => `rotate(${r}deg) scale(${indicatorScale.get()})`),
          }}
          className={cn(
            "flex items-center justify-center",
            "h-10 w-10 rounded-full bg-background shadow-md",
            isRefreshing && "animate-spin"
          )}
        >
          <RefreshCw className="h-5 w-5 text-primary" />
        </animated.div>
      </animated.div>

      {/* Content container */}
      <animated.div
        {...bind()}
        ref={containerRef}
        style={{ y }}
        className="relative touch-pan-x overflow-y-auto"
      >
        {children}
      </animated.div>
    </div>
  );
}