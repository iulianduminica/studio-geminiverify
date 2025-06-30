
'use client';

import { createContext, useContext } from 'react';
import type { useWorkoutData } from '@/hooks/useWorkoutData';

// This is the return type of our useWorkoutData hook
export type WorkoutContextType = ReturnType<typeof useWorkoutData>;

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export const WorkoutProvider = WorkoutContext.Provider;

export const useWorkout = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
