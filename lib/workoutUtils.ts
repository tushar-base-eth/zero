import { supabase } from '@/lib/supabase/browser';
import type { UIExtendedWorkout, NewWorkout, UIWorkoutExercise } from "@/types/workouts";
import { parseISO } from "date-fns";
import { format } from "date-fns";

/**
 * Fetches all workouts for a user with pagination, including exercises and sets, formatted for UI display.
 * @param userId - The ID of the user whose workouts to fetch.
 * @param pageIndex - The page number (0-based) for pagination.
 * @param pageSize - Number of workouts per page.
 * @returns A promise resolving to an array of formatted workouts.
 */
export async function fetchWorkouts(userId: string, pageIndex: number, pageSize: number): Promise<UIExtendedWorkout[]> {
  const start = pageIndex * pageSize;
  const end = start + pageSize - 1;
  const { data, error } = await supabase
    .from("workouts")
    .select(`
      id, user_id, workout_date, created_at,
      workout_exercises (
        id, workout_id, exercise_type, predefined_exercise_id, user_exercise_id, order, effort_level, created_at,
        exercises (id, name, primary_muscle_group, secondary_muscle_group, category, uses_reps, uses_weight, uses_duration, uses_distance, is_deleted),
        user_exercises (id, name, primary_muscle_group, secondary_muscle_group, category, uses_reps, uses_weight, uses_duration, uses_distance),
        sets (id, workout_exercise_id, set_number, reps, weight_kg, duration_seconds, distance_meters, created_at)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("order", { ascending: true, foreignTable: "workout_exercises" })
    .order("set_number", { ascending: true, foreignTable: "workout_exercises.sets" })
    .range(start, end);

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message);
  }

  const formattedWorkouts: UIExtendedWorkout[] = data
    .filter((rawWorkout) => rawWorkout.created_at !== null)
    .map((rawWorkout) => {
      const utcDate = parseISO(rawWorkout.created_at as string);
      const localDate = format(utcDate, "yyyy-MM-dd"); // Uses local timezone
      const localTime = format(utcDate, "hh:mm a"); // Uses local timezone

      const exercises: UIWorkoutExercise[] = rawWorkout.workout_exercises.map((we: any) => {
        const exerciseData = we.exercise_type === "predefined" ? we.exercises : we.user_exercises;
        return {
          id: we.id,
          workout_id: we.workout_id,
          exercise_type: we.exercise_type,
          predefined_exercise_id: we.predefined_exercise_id,
          user_exercise_id: we.user_exercise_id,
          order: we.order,
          effort_level: we.effort_level || null, // Ensure effort_level matches enum type
          created_at: we.created_at,
          instance_id: `${we.id}-${we.order}`,
          exercise: {
            id: exerciseData?.id ?? "",
            name: exerciseData?.name ?? "Unknown",
            primary_muscle_group: exerciseData?.primary_muscle_group ?? "other",
            secondary_muscle_group: exerciseData?.secondary_muscle_group ?? null,
            category: exerciseData?.category ?? "other",
            uses_reps: exerciseData?.uses_reps ?? true,
            uses_weight: exerciseData?.uses_weight ?? true,
            uses_duration: exerciseData?.uses_duration ?? false,
            uses_distance: exerciseData?.uses_distance ?? false,
            is_deleted: exerciseData?.is_deleted ?? false, // Added to match Exercise type
            source: we.exercise_type, // Added for UI consistency
          },
          sets: we.sets ?? [],
        };
      });

      return {
        id: rawWorkout.id,
        user_id: rawWorkout.user_id ?? "",
        workout_date: rawWorkout.workout_date,
        created_at: rawWorkout.created_at,
        exercises,
        date: localDate,
        time: localTime,
        totalVolume: exercises.reduce(
          (sum, ex) =>
            sum +
            ex.sets.reduce(
              (setSum, set) => setSum + ((set.reps || 0) * (set.weight_kg || 0)),
              0
            ),
          0
        ),
      };
    });

  return formattedWorkouts;
}

/**
 * Saves a new workout, including its exercises and sets. Stats updates are handled by database triggers.
 * @param workout - The workout data to save, including exercises and sets.
 * @returns A promise that resolves when the workout is saved.
 */
export async function saveWorkout(workout: NewWorkout): Promise<void> {
  try {
    const workoutDate = workout.workout_date || new Date().toISOString().split("T")[0]; // Default to today if not provided
    const { data: workoutData, error: workoutError } = await supabase
      .from("workouts")
      .insert({ user_id: workout.user_id, workout_date: workoutDate })
      .select("id")
      .single();

    if (workoutError) {
      console.error("Error inserting workout:", workoutError);
      throw workoutError;
    }

    const workoutId = workoutData.id;

    for (const ex of workout.exercises) {
      const { data: weData, error: weError } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: workoutId,
          exercise_type: ex.exercise_type,
          predefined_exercise_id: ex.predefined_exercise_id,
          user_exercise_id: ex.user_exercise_id,
          order: ex.order,
          effort_level: ex.effort_level || null, // Ensure effort_level matches enum type
        })
        .select("id")
        .single();

      if (weError) {
        console.error("Error inserting workout_exercise:", weError);
        throw weError;
      }

      const weId = weData.id;

      const setsToInsert = ex.sets.map((set, setIndex) => ({
        workout_exercise_id: weId,
        set_number: set.set_number || setIndex + 1,
        reps: set.reps,
        weight_kg: set.weight_kg,
        duration_seconds: set.duration_seconds,
        distance_meters: set.distance_meters,
      }));

      const { error: setsError } = await supabase.from("sets").insert(setsToInsert);

      if (setsError) {
        console.error("Error inserting sets:", setsError);
        throw setsError;
      }
    }
  } catch (error) {
    console.error("Error saving workout:", error);
    throw error;
  }
}

/**
 * Deletes a workout by ID. Stats updates are handled by database triggers.
 * @param workoutId - The ID of the workout to delete.
 * @returns A promise that resolves when the workout is deleted.
 */
export async function deleteWorkout(workoutId: string): Promise<void> {
  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);

  if (error) throw error;
}

/**
 * Fetches volume data by day for a user over a specified period.
 * @param userId - The ID of the user.
 * @param timeRange - The time range ("7days", "8weeks", "12months").
 * @returns A promise resolving to the volume data array.
 */
export async function fetchVolumeData(userId: string, timeRange: string) {
  const daysToFetch = timeRange === "7days" ? 7 : timeRange === "8weeks" ? 56 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);

  const { data, error } = await supabase
    .from("daily_volume")
    .select("date, volume")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0]) // 'YYYY-MM-DD' format
    .order("date", { ascending: true });

  if (error) throw error;

  // Ensure data is in the expected format: { date: string, volume: number }[]
  return data.map((row) => ({ date: row.date, volume: row.volume }));
}

/**
 * Fetches all available exercises.
 * @returns A promise resolving to an array of exercises.
 */
export async function fetchAvailableExercises() {
  const { data, error } = await supabase.from("exercises").select("*");
  if (error) throw error;
  return data.map(ex => ({ ...ex, source: "predefined" as const }));
}