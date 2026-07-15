
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSpring, animated } from "@react-spring/web";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface FloatingActionButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
  label?: string;
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  hideOnDesktop?: boolean;
}

export function FloatingActionButton({
  children,
  onClick,
  className,
  icon = <Plus className="h-6 w-6" />,
  label,
  position = "bottom-right",
  hideOnDesktop = true,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const actionsId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  const animation = useSpring({
    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
    config: { tension: 300, friction: 20 },
    immediate: reducedMotion,
  });

  useEffect(() => {
    if (!isOpen) return;
    actionsRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const closeQuickActions = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const positionClasses = {
    "bottom-right": "bottom-20 right-4",
    "bottom-left": "bottom-20 left-4",
    "bottom-center": "bottom-20 left-1/2 -translate-x-1/2",
  };

  const handleClick = () => {
    if (children) {
      if (isOpen) closeQuickActions();
      else setIsOpen(true);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <>
      {/* Main FAB */}
      <div
        className={cn(
          "fixed z-40",
          positionClasses[position],
          hideOnDesktop && "md:hidden",
          className
        )}
      >
        <Button
          ref={triggerRef}
          onClick={handleClick}
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full border border-primary",
            !reducedMotion && "transition-transform hover:scale-105",
            "min-h-[44px] min-w-[44px]",
          )}
          aria-label={
            children
              ? isOpen
                ? "Close quick actions"
                : "Open quick actions"
              : label || "Floating action button"
          }
          aria-expanded={children ? isOpen : undefined}
          aria-controls={children ? actionsId : undefined}
        >
          <animated.div style={animation}>
            {children && isOpen ? <X className="h-6 w-6" /> : icon}
          </animated.div>
        </Button>
        {label && !children && (
          <span className="sr-only">{label}</span>
        )}
      </div>

      {/* Speed Dial Options */}
      {children && isOpen && (
        <div
          id={actionsId}
          ref={actionsRef}
          role="group"
          aria-label="Quick actions"
          className={cn(
            "fixed z-30",
            position === "bottom-right" && "bottom-36 right-4",
            position === "bottom-left" && "bottom-36 left-4",
            position === "bottom-center" && "bottom-36 left-1/2 -translate-x-1/2",
            "flex flex-col gap-3",
            hideOnDesktop && "md:hidden"
          )}
        >
          {children}
        </div>
      )}

      {/* Backdrop */}
      {children && isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-20 bg-black/20",
            hideOnDesktop && "md:hidden"
          )}
          aria-hidden="true"
          onClick={closeQuickActions}
        />
      )}
    </>
  );
}

interface SpeedDialActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

export function SpeedDialAction({
  icon,
  label,
  onClick,
  className,
}: SpeedDialActionProps) {
  const reducedMotion = useReducedMotion();
  const animation = useSpring({
    from: { opacity: 0, transform: "scale(0)" },
    to: { opacity: 1, transform: "scale(1)" },
    config: { tension: 300, friction: 20 },
    immediate: reducedMotion,
  });

  return (
    <animated.div style={animation} className="flex items-center gap-3">
      <span className="whitespace-nowrap rounded border border-border bg-background px-2 py-1 text-sm">
        {label}
      </span>
      <Button
        onClick={onClick}
        size="icon"
        variant="secondary"
        className={cn(
          "h-12 w-12 rounded-full border border-border",
          "min-h-[44px] min-w-[44px]",
          className
        )}
        aria-label={label}
      >
        {icon}
      </Button>
    </animated.div>
  );
}