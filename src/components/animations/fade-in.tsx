"use client"

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export function FadeIn({ 
  children, 
  duration = 0.3, 
  delay = 0,
  className 
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerChildren({ 
  children, 
  staggerDelay = 0.1,
  className 
}: StaggerChildrenProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  duration?: number;
  className?: string;
}

export function SlideIn({ 
  children, 
  direction = "left",
  duration = 0.3,
  className 
}: SlideInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "left":
        return { x: -50, y: 0 };
      case "right":
        return { x: 50, y: 0 };
      case "up":
        return { x: 0, y: -50 };
      case "down":
        return { x: 0, y: 50 };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...getInitialPosition() }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
}