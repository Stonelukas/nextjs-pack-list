"use client"

export function SkipNav() {
  return (
    <a
      href="#main-content"
      className="absolute top-0 left-0 -translate-y-full focus:translate-y-0 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}