"use client"

import { ReactNode } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon?: ReactNode;
    label?: string;
    color?: string;
  };
  rightAction?: {
    icon?: ReactNode;
    label?: string;
    color?: string;
  };
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = { icon: <Check className="h-5 w-5" />, label: "Complete", color: "bg-green-500" },
  rightAction = { icon: <Trash2 className="h-5 w-5" />, label: "Delete", color: "bg-red-500" },
  threshold = 100,
  disabled = false,
  className,
}: SwipeableItemProps) {
  const [{ x, opacity }, api] = useSpring(() => ({
    x: 0,
    opacity: 1,
  }));

  const bind = useDrag(
    ({ down, movement: [mx], velocity: [vx], cancel }) => {
      if (disabled) return;

      // If the swipe is fast enough, trigger the action
      if (!down && Math.abs(vx) > 0.5) {
        if (mx > threshold && onSwipeRight) {
          api.start({
            x: window.innerWidth,
            opacity: 0,
            onRest: () => {
              onSwipeRight();
              api.start({ x: 0, opacity: 1, immediate: true });
            },
          });
          cancel();
          return;
        } else if (mx < -threshold && onSwipeLeft) {
          api.start({
            x: -window.innerWidth,
            opacity: 0,
            onRest: () => {
              onSwipeLeft();
              api.start({ x: 0, opacity: 1, immediate: true });
            },
          });
          cancel();
          return;
        }
      }

      // Spring back if not swiped far enough
      if (!down && Math.abs(mx) < threshold) {
        api.start({ x: 0, opacity: 1 });
        return;
      }

      // While dragging, update position
      if (down) {
        api.start({ x: mx, immediate: true });
      } else {
        // Released but past threshold
        if (mx > threshold && onSwipeRight) {
          api.start({
            x: window.innerWidth,
            opacity: 0,
            onRest: () => {
              onSwipeRight();
              api.start({ x: 0, opacity: 1, immediate: true });
            },
          });
        } else if (mx < -threshold && onSwipeLeft) {
          api.start({
            x: -window.innerWidth,
            opacity: 0,
            onRest: () => {
              onSwipeLeft();
              api.start({ x: 0, opacity: 1, immediate: true });
            },
          });
        } else {
          api.start({ x: 0, opacity: 1 });
        }
      }
    },
    {
      axis: "x",
      bounds: { left: -window.innerWidth, right: window.innerWidth },
      rubberband: true,
    }
  );

  const actionOpacity = x.to((val) => Math.abs(val) / threshold);
  const leftActionX = x.to((val) => Math.min(0, val + threshold));
  const rightActionX = x.to((val) => Math.max(0, val - threshold));

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Left Action Background */}
      {onSwipeRight && (
        <animated.div
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-6",
            leftAction.color
          )}
          style={{
            opacity: actionOpacity,
            transform: rightActionX.to((val) => `translateX(${val}px)`),
          }}
        >
          <div className="flex items-center gap-2 text-white">
            {leftAction.icon}
            {leftAction.label && (
              <span className="font-medium">{leftAction.label}</span>
            )}
          </div>
        </animated.div>
      )}

      {/* Right Action Background */}
      {onSwipeLeft && (
        <animated.div
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-6",
            rightAction.color
          )}
          style={{
            opacity: actionOpacity,
            transform: leftActionX.to((val) => `translateX(${val}px)`),
          }}
        >
          <div className="flex items-center gap-2 text-white">
            {rightAction.label && (
              <span className="font-medium">{rightAction.label}</span>
            )}
            {rightAction.icon}
          </div>
        </animated.div>
      )}

      {/* Main Content */}
      <animated.div
        {...bind()}
        style={{ x, opacity }}
        className="relative bg-background touch-pan-y"
      >
        {children}
      </animated.div>
    </div>
  );
}