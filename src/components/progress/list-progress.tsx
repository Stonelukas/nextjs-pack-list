"use client"

import { List, Category, Item, Priority } from "@/types";
import { ProgressBar } from "./progress-bar";
import { getItemsStats, getWeightStats, getPriorityColor } from "@/lib/progress-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Weight,
  TrendingUp,
  Clock,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { throttle } from "@/lib/performance";

interface ListProgressProps {
  list: List;
  className?: string;
}

export function ListProgress({ list, className }: ListProgressProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  
  // Memoize item collection and stats calculation for performance
  const allItems: Item[] = useMemo(() => 
    list.categories.flatMap(cat => cat.items),
    [list.categories]
  );
  
  const stats = useMemo(() => getItemsStats(allItems), [allItems]);
  const weightStats = useMemo(() => getWeightStats(allItems), [allItems]);
  
  // Throttle confetti trigger to prevent excessive animations
  const triggerConfetti = useCallback(
    throttle(() => {
      // Fire confetti from multiple angles
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: Record<string, unknown>) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }, 1000),
    []
  );
  
  // Trigger confetti on 100% completion
  useEffect(() => {
    if (stats.progress === 100 && !hasTriggeredConfetti && allItems.length > 0) {
      setHasTriggeredConfetti(true);
      triggerConfetti();
    }
    
    // Reset confetti trigger if progress drops below 100%
    if (stats.progress < 100) {
      setHasTriggeredConfetti(false);
    }
  }, [stats.progress, hasTriggeredConfetti, allItems.length, triggerConfetti]);

  const getPriorityLabel = useCallback((priority: Priority) => {
    switch (priority) {
      case Priority.ESSENTIAL:
        return "Essential";
      case Priority.HIGH:
        return "High";
      case Priority.MEDIUM:
        return "Medium";
      case Priority.LOW:
        return "Low";
    }
  }, []);

  return (
    <div className={className}>
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Progress
            </CardTitle>
            {stats.progress === 100 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  List Complete!
                </Badge>
              </motion.div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Progress Bar */}
          <ProgressBar
            value={stats.progress}
            showEmoji
            size="lg"
            animated
          />
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Packed</p>
              <p className="text-2xl font-bold text-green-600">{stats.packed}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">{stats.remaining}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{list.categories.length}</p>
            </div>
          </div>

          {/* Priority Breakdown */}
          {stats.total > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Priority Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.byPriority).map(([priority, count]) => {
                  if (count === 0) return null;
                  const packed = stats.packedByPriority[priority as Priority];
                  const percentage = count > 0 ? Math.round((packed / count) * 100) : 0;
                  
                  return (
                    <div key={priority} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={cn("font-medium", getPriorityColor(priority as Priority))}>
                          {getPriorityLabel(priority as Priority)}
                        </span>
                        <span className="text-muted-foreground">
                          {packed}/{count} items
                        </span>
                      </div>
                      <ProgressBar
                        value={percentage}
                        showPercentage={false}
                        size="sm"
                        animated={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weight Statistics */}
          {weightStats.hasWeightData && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Weight</span>
              </div>
              <div className="text-sm">
                <span className="font-bold">{weightStats.packed.toFixed(1)}kg</span>
                <span className="text-muted-foreground"> / {weightStats.total.toFixed(1)}kg</span>
              </div>
            </div>
          )}

          {/* Completion Status Messages */}
          <AnimatePresence mode="wait">
            {stats.progress === 0 && (
              <motion.div
                key="not-started"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ready to start packing!</span>
              </motion.div>
            )}
            
            {stats.progress > 0 && stats.progress < 100 && (
              <motion.div
                key="in-progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 dark:bg-blue-500/20"
              >
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm">Keep going! You&apos;re {stats.progress}% complete.</span>
              </motion.div>
            )}
            
            {stats.progress === 100 && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 dark:bg-green-500/20"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">All packed and ready to go! 🎉</span>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}