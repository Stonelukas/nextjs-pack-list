
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
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
  const reducedMotion = useReducedMotion();

  const [{ y, rotate }, api] = useSpring(() => ({
    y: 0,
    rotate: 0,
  }));

  useEffect(() => {
    if (reducedMotion) api.start({ y: 0, rotate: 0, immediate: true });
  }, [api, reducedMotion]);

  const handleRefresh = async () => {
    if (disabled || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const bind = useDrag(
    async ({ down, movement: [, my], first, last, memo = { canPull: false } }) => {
      if (disabled || isRefreshing || reducedMotion) return memo;

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
          api.start({
            y: threshold,
            rotate: 360,
            config: { tension: 200, friction: 20 },
          });
          await handleRefresh();
          api.start({
            y: 0,
            rotate: 0,
            config: { tension: 200, friction: 20 },
          });
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
      {reducedMotion ? (
        <div className="mb-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isRefreshing}
            onClick={() => void handleRefresh()}
          >
            <RefreshCw aria-hidden="true" />
            {isRefreshing ? "Refreshing…" : "Refresh list"}
          </Button>
        </div>
      ) : (
        <animated.div
          data-testid="pull-to-refresh-indicator"
          style={{
            opacity: indicatorOpacity,
            transform: y.to((val) => `translateY(${val - 40}px)`),
          }}
          className="absolute left-1/2 z-10 -translate-x-1/2"
        >
          <animated.div
            style={{
              transform: rotate.to((rotation) =>
                `rotate(${rotation}deg) scale(${indicatorScale.get()})`,
              ),
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background",
              isRefreshing && "animate-spin",
            )}
          >
            <RefreshCw className="h-5 w-5 text-primary" aria-hidden="true" />
          </animated.div>
        </animated.div>
      )}

      <animated.div
        {...(reducedMotion ? {} : bind())}
        ref={containerRef}
        style={{ y: reducedMotion ? 0 : y }}
        className="relative touch-pan-x overflow-y-auto"
      >
        {children}
      </animated.div>
    </div>
  );
}