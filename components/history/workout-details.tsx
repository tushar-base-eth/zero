"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUnitPreference } from "@/lib/hooks/use-unit-preference";
import { motion } from "framer-motion";
import { useHistoryContext } from "@/contexts/history-context";

export function WorkoutDetails() {
  const { selectedWorkout, setSelectedWorkout } = useHistoryContext();
  const { formatWeight } = useUnitPreference();

  if (!selectedWorkout) return null;

  return (
    <Sheet open={!!selectedWorkout} onOpenChange={() => setSelectedWorkout(null)}>
      <SheetContent
        className="w-full sm:max-w-lg p-0 bg-background z-50 rounded-t-3xl"
        style={{ maxHeight: "calc(100vh - 60px)", overflowY: "auto" }}
      >
        <div className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl text-foreground">Workout Details</SheetTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setSelectedWorkout(null)}
              className="rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-4 space-y-6"
        >
          {selectedWorkout.exercises.map((exercise, index) => {
            const { uses_reps, uses_weight, uses_duration, uses_distance } = exercise.exercise;
            return (
              <div key={index} className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">{exercise.exercise.name}</h3>
                {exercise.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {setIndex + 1}
                      </div>
                      {uses_reps && <span className="text-muted-foreground">{set.reps || 0} reps</span>}
                      {uses_weight && <span className="text-muted-foreground">{formatWeight(set.weight_kg || 0)}</span>}
                      {uses_duration && <span className="text-muted-foreground">{set.duration_seconds || 0} s</span>}
                      {uses_distance && <span className="text-muted-foreground">{set.distance_meters?.toFixed(1) || 0} m</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}