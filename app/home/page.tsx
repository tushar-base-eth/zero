"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell } from "lucide-react";
import Workout from "@/components/workout/workout";
import { useAvailableExercises } from "@/lib/hooks/data-hooks";

export default function HomePage() {
  const { exercises, isLoading } = useAvailableExercises(); // Eager fetch on mount
  const [exercisesState, setExercisesState] = useState([]);

  const handleExercisesChange = (updatedExercises: any) => {
    setExercisesState(updatedExercises);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <AnimatePresence mode="wait">
        {exercisesState.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6 glass rounded-3xl shadow-md"
            style={{ marginBottom: "60px" }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <Dumbbell className="w-20 h-20 text-primary" />
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <Dumbbell className="w-20 h-20 text-primary blur-md" />
              </motion.div>
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Don't Die!</h2>
              <p className="text-lg text-muted-foreground max-w-sm">Smash that + button below</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Workout onExercisesChange={handleExercisesChange} />
    </div>
  );
}