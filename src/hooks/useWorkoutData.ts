
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, FirestoreError, type DocumentReference } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { WorkoutPlan, Exercise, WorkoutDay, UserProfile, CardioValues, CardioMainValues } from '@/types/workout';
import { auth, db, hasFirebaseConfig } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import i18n from '@/lib/i18n';
import FirestoreRulesError from '@/components/auth/FirestoreRulesError';
import { initialWorkoutData } from '@/data/initial-data';
import { useStopwatch } from './useStopwatch';


type Status = 'connecting' | 'syncing' | 'synced' | 'error' | 'offline';

export function useWorkoutData() {
  const [workoutData, setWorkoutData] = useState<WorkoutPlan | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const docRef = useRef<DocumentReference<WorkoutPlan> | null>(null);
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const isUpdatingFromSnapshot = useRef(false);
  const unsubscribeSnapshot = useRef<() => void>(() => {});
  const router = useRouter();

  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [skippedExercises, setSkippedExercises] = useState<number[]>([]);
  const [justCompletedDayIndex, setJustCompletedDayIndex] = useState<number | null>(null);

  const restStopwatch = useStopwatch();
  const breakStopwatch = useStopwatch();
  const [showBreakTimerAfter, setShowBreakTimerAfter] = useState<{ dayIndex: number; exIndex: number } | null>(null);
  
  const findNextExercise = (day: WorkoutDay, localSkipped: number[]) => {
    if (localSkipped.length > 0) {
      return localSkipped[0];
    }
    return day.exercises.findIndex(ex => !ex.isDone);
  };

  const endBreak = useCallback(() => {
    if (!showBreakTimerAfter || !workoutData) return;

    const { dayIndex } = showBreakTimerAfter;
    const splitKey = workoutData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
    const day = workoutData[splitKey][dayIndex];
    const nextExerciseIndex = findNextExercise(day, skippedExercises);
    
    if (isMounted.current) {
        if (nextExerciseIndex !== -1) {
            setActiveExerciseIndex(nextExerciseIndex);
        }
        setShowBreakTimerAfter(null);
        breakStopwatch.reset();
    }
  }, [showBreakTimerAfter, workoutData, skippedExercises, breakStopwatch]);

  const showFirestoreRulesError = useCallback(() => {
    toast({
      variant: "destructive",
      title: i18n.t('Toasts.permissionErrorTitle'),
      description: React.createElement(FirestoreRulesError),
      duration: Infinity,
    });
  }, [toast]);

  const saveData = useCallback((dataToSave: WorkoutPlan | null) => {
    if (isDevMode || !dataToSave) return;
    
    if (isMounted.current) setStatus('syncing');

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!docRef.current) {
          console.error("docRef is not available, cannot save data.");
          if (isMounted.current) setStatus('error');
          return;
      }
      try {
        await setDoc(docRef.current, dataToSave, { merge: true });
        if (isMounted.current) setStatus('synced');
      } catch (error) {
        console.error("Failed to save data", error);
        if (isMounted.current) {
          setStatus('error');
          if (error instanceof FirestoreError && error.code === 'permission-denied') {
            showFirestoreRulesError();
          }
        }
      }
    }, 1500);
  }, [showFirestoreRulesError, isDevMode]);

  const clearLocalState = useCallback(() => {
    if (!isMounted.current) return;
    sessionStorage.removeItem('devWorkoutId');
    unsubscribeSnapshot.current();
    unsubscribeSnapshot.current = () => {};
    docRef.current = null;
    setUser(null);
    setWorkoutId(null);
    setUserName(null);
    setWorkoutData(null);
    setUserProfile(null);
    setActiveDayIndex(null);
    setActiveExerciseIndex(null);
    setStatus('connecting');
    setIsUserAdmin(false);
    setIsDevMode(false);
  }, []);
  
  const signOutUser = useCallback(async () => {
    const wasDevMode = !!sessionStorage.getItem('devWorkoutId');
    sessionStorage.removeItem('devWorkoutId');

    if (wasDevMode) {
      clearLocalState();
      router.push('/login');
    } else if (auth) {
      await signOut(auth);
    }
  }, [clearLocalState, router]);

  const loadWorkoutPlan = useCallback(async (id: string) => {
    if (!db) return;
    if (isMounted.current) setStatus('syncing');
    
    const newDocRef = doc(db, 'workouts', id) as DocumentReference<WorkoutPlan>;
    docRef.current = newDocRef;

    unsubscribeSnapshot.current();

    unsubscribeSnapshot.current = onSnapshot(newDocRef, (document) => {
        if (!isMounted.current) return;
        isUpdatingFromSnapshot.current = true;

        if (document.exists()) {
            const data = document.data() as WorkoutPlan;
            setWorkoutData(data);
            setWorkoutId(id);
            setUserName(data.userName || 'Guest');
            setStatus('synced');
        } else {
            unsubscribeSnapshot.current();
            if (isMounted.current) {
              clearLocalState();
              toast({ variant: "destructive", title: i18n.t('Toasts.invalidCodeTitle'), description: i18n.t('Toasts.invalidCodeDescription') });
            }
        }
        setTimeout(() => { isUpdatingFromSnapshot.current = false; }, 100);
    }, (error: FirestoreError) => {
        console.error("Firestore snapshot error", error);
        if (!isMounted.current) return;
        setStatus('error');
        if (error.code === 'permission-denied') {
            showFirestoreRulesError();
        }
    });
  }, [toast, showFirestoreRulesError, clearLocalState]);
  
  useEffect(() => {
    isMounted.current = true;
    
    const devWorkoutId = sessionStorage.getItem('devWorkoutId');

    if (devWorkoutId) {
        setIsDevMode(true);
        if (devWorkoutId === 'dxw-admin') {
            const mockUser = {
                uid: 'dev-admin-user',
                email: 'dev-admin@example.com',
                displayName: 'Dev Admin',
                getIdToken: async () => 'dev-token',
            } as unknown as User;
            setUser(mockUser);
            setIsUserAdmin(true);
            const mockUserProfile: UserProfile = {
                firstName: 'Dev',
                email: 'dev-admin@example.com',
                photoURL: null,
                workoutId: 'dxw-admin-plan',
                isAdmin: true,
                dateOfBirth: '1990-01-15',
                dobDay: '15',
                dobMonth: '01',
                dobYear: '1990',
                weight: '80',
                height: '180',
                gender: 'male',
            };
            setUserProfile(mockUserProfile);
            setWorkoutData({ ...initialWorkoutData, userName: 'Dev Admin' });
            setWorkoutId('dxw-admin-plan');
            setUserName('Dev Admin');
            setStatus('synced');
        } else if (devWorkoutId === 'dxw-invited') {
            const mockUser = {
                uid: 'dev-invited-user',
                email: 'invited@example.com',
                displayName: 'New User',
                getIdToken: async () => 'dev-token',
            } as unknown as User;
            setUser(mockUser);
            // Don't set profile or workout data to simulate a new user flow
            router.push('/welcome');
        } else {
            // Invalid dev code, clean up and proceed to normal auth
            sessionStorage.removeItem('devWorkoutId');
        }

        if (sessionStorage.getItem('devWorkoutId')) {
            return () => { isMounted.current = false; };
        }
    }

    if (!hasFirebaseConfig || !auth) {
      setStatus('offline');
      return;
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted.current) return;
      
      if (currentUser) {
        if (!db) {
          console.error("Firestore DB is not initialized.");
          setStatus('error');
          return;
        }
        setUser(currentUser);
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userProfileData = userDocSnap.data() as UserProfile;
            setUserProfile(userProfileData);
            if (userProfileData.isAdmin) {
                setIsUserAdmin(true);
            }
            if (userProfileData && userProfileData.workoutId) {
                await loadWorkoutPlan(userProfileData.workoutId);
            } else {
                router.push('/welcome');
            }
          } else {
            router.push('/welcome');
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
          if(isMounted.current) {
            setStatus('error');
            if (error instanceof FirestoreError && error.code === 'permission-denied') {
              showFirestoreRulesError();
            }
          }
        }
      } else {
        clearLocalState();
        router.push('/login');
      }
    });

    return () => {
        isMounted.current = false;
        unsubscribeAuth();
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        unsubscribeSnapshot.current();
    };
  }, [loadWorkoutPlan, clearLocalState, router, showFirestoreRulesError]);

  const handleDataChange = useCallback((getNewData: (d: WorkoutPlan) => WorkoutPlan) => {
    if(isUpdatingFromSnapshot.current) return;
      setWorkoutData(currentData => {
          if (!currentData) return null;
          const newData = getNewData(currentData);
          saveData(newData);
          return newData;
      });
  }, [saveData]);

  const updateUserProfile = useCallback(async (dataToUpdate: Partial<UserProfile>) => {
    if (isDevMode) {
      setUserProfile(prev => prev ? { ...prev, ...dataToUpdate } : null);
      return { success: true };
    }
    if (!user || !db) return { success: false, error: new Error("User or DB not available") };
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await setDoc(userDocRef, dataToUpdate, { merge: true });
        setUserProfile(prev => prev ? { ...prev, ...dataToUpdate } : null);
        return { success: true };
    } catch (error) {
        console.error("Error updating user profile:", error);
        if (error instanceof FirestoreError && error.code === 'permission-denied') {
            showFirestoreRulesError();
        }
        return { success: false, error: error as Error };
    }
  }, [user, isDevMode, showFirestoreRulesError]);

  const updateCardio = useCallback((group: string, key: string, value: string) => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        const groupKey = group as keyof typeof currentData.cardio;
        const phaseData = newData.cardio[groupKey];
        
        if (key in phaseData) {
            (phaseData as CardioValues | CardioMainValues)[key as keyof (CardioValues | CardioMainValues)] = value;
        }

        return newData;
    });
  }, [handleDataChange]);

  const updateExercise = useCallback((dayIndex: number, exIndex: number, key: keyof Exercise | `splitWeights.set${1 | 2 | 3}`, value: unknown) => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
        const exercise = newData[splitKey][dayIndex].exercises[exIndex];
        if (typeof key === 'string' && key.startsWith('splitWeights.')) {
            const setKey = key.split('.')[1] as keyof Exercise['splitWeights'];
            exercise.splitWeights[setKey] = String(value);
        } else {
            const propKey = key as keyof Exercise;
            (exercise as Record<keyof Exercise, unknown>)[propKey] = value;
        }
        return newData;
    });
  }, [handleDataChange]);

  const reorderSplitWeights = useCallback((dayIndex: number, exIndex: number) => {
    handleDataChange(currentData => {
      const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
      const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
      const exercise = newData[splitKey][dayIndex].exercises[exIndex];
      const { set1, set2, set3 } = exercise.splitWeights;

      const v1 = parseFloat(set1);
      const v2 = parseFloat(set2);
      const v3 = parseFloat(set3);
      
      if (isNaN(v1) || isNaN(v2) || isNaN(v3) || v1 <= 0 || v2 <= 0 || v3 <= 0) {
        return currentData; 
      }

      const weights = [v1, v2, v3];
      const sortedWeights = [...weights].sort((a, b) => a - b);
      
      const newSet1 = sortedWeights[0];
      const newSet2 = sortedWeights[2];
      const newSet3 = sortedWeights[1];

      if (v1 === newSet1 && v2 === newSet2 && v3 === newSet3) {
        return currentData;
      }
      
      exercise.splitWeights.set1 = String(newSet1);
      exercise.splitWeights.set2 = String(newSet2);
      exercise.splitWeights.set3 = String(newSet3);
      
      return newData;
    });
  }, [handleDataChange]);

  const toggleSplitMode = useCallback((dayIndex: number, exIndex: number) => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
        const exercise = newData[splitKey][dayIndex].exercises[exIndex];
        const currentMode = exercise.weightMode;

        if (currentMode === 'standard') {
            exercise.weightMode = 'split';
            const standardWeight = exercise.weight;
            if (standardWeight && standardWeight.trim() !== '') {
                exercise.splitWeights = {
                    set1: standardWeight,
                    set2: standardWeight,
                    set3: standardWeight,
                };
            }
        } else {
            exercise.weightMode = 'standard';
        }

        return newData;
    });
  }, [handleDataChange]);

  const updateProgress = useCallback((dayIndex: number, exIndex: number, pathIndex: number, isChecked: boolean) => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
        const progress = newData[splitKey][dayIndex].exercises[exIndex].progress;
        progress[pathIndex] = isChecked;

        if (!isChecked) {
          for (let i = pathIndex + 1; i < progress.length; i++) {
            progress[i] = false;
          }
        }
        return newData;
    });
  }, [handleDataChange]);

  const setCardioVisibility = useCallback((visible: boolean) => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        if (!newData.settings) {
            newData.settings = initialWorkoutData.settings;
        }
        newData.settings.cardioVisible = visible;
        return newData;
    });
  }, [handleDataChange]);

  const setSectionsOrder = useCallback((newOrder: ('cardio' | 'strength')[]) => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        if (!newData.settings) {
            newData.settings = initialWorkoutData.settings;
        }
        newData.settings.sectionsOrder = newOrder;
        return newData;
    });
  }, [handleDataChange]);

  const switchActiveSplit = useCallback((split: '5-day' | '3-day') => {
    setActiveDayIndex(null);
    setActiveExerciseIndex(null);
    setSkippedExercises([]);
    setShowBreakTimerAfter(null);
    breakStopwatch.reset();
    restStopwatch.reset();
    
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        newData.settings.activeSplit = split;
        return newData;
    });
  }, [handleDataChange, breakStopwatch, restStopwatch]);
  
  const startWorkout = useCallback((dayIndex: number) => {
    if (!workoutData) return;
    const splitKey = workoutData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
    setActiveDayIndex(dayIndex);
    const firstExerciseIndex = workoutData[splitKey][dayIndex].exercises.findIndex(ex => !ex.isDone);
    setActiveExerciseIndex(firstExerciseIndex);
    setSkippedExercises([]);
    setShowBreakTimerAfter(null);
    breakStopwatch.reset();
  }, [workoutData, breakStopwatch]);
  
  const cancelWorkout = useCallback((dayIndex: number) => {
    if (!workoutData || activeDayIndex !== dayIndex) return;

    const splitKey = workoutData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
    const day = workoutData[splitKey][dayIndex];
    const hasProgress = day.exercises.some(ex => ex.isDone);

    if (!hasProgress) {
        if (isMounted.current) {
            setActiveDayIndex(null);
            setActiveExerciseIndex(null);
            setSkippedExercises([]);
            setShowBreakTimerAfter(null);
            breakStopwatch.reset();
            restStopwatch.reset();
        }
    } else {
        toast({
            variant: "destructive",
            title: i18n.t('Toasts.cannotCancelTitle'),
            description: i18n.t('Toasts.cannotCancelDescription'),
        });
    }
  }, [workoutData, activeDayIndex, breakStopwatch, restStopwatch, toast]);

  const markExerciseAsDone = useCallback((dayIndex: number, exIndex: number) => {
    restStopwatch.reset();
    
    handleDataChange(currentData => {
      const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
      const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
      const day = newData[splitKey][dayIndex];
      day.exercises[exIndex].isDone = true;

      let currentSkipped = skippedExercises;
      if (skippedExercises.includes(exIndex)) {
        currentSkipped = skippedExercises.filter(i => i !== exIndex);
        if (isMounted.current) setSkippedExercises(currentSkipped);
      }
      
      const nextExerciseIndex = findNextExercise(day, currentSkipped);

      if (isMounted.current) {
        if (nextExerciseIndex === -1) { 
          day.isCompleted = true;
          setActiveDayIndex(null);
          setActiveExerciseIndex(null);
          setSkippedExercises([]);
          setJustCompletedDayIndex(dayIndex);
          setShowBreakTimerAfter(null);
          breakStopwatch.reset();
        } else {
          setActiveExerciseIndex(null); // Deactivate current exercise to show break timer
          setShowBreakTimerAfter({ dayIndex, exIndex });
          breakStopwatch.start();
        }
      }
      
      return newData;
    });
  }, [handleDataChange, skippedExercises, restStopwatch, breakStopwatch]);

  const undoMarkAsDone = useCallback((dayIndex: number, exIndex: number) => {
    handleDataChange(currentData => {
      const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
      const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
      const day = newData[splitKey][dayIndex];
      day.exercises[exIndex].isDone = false;

      if (day.isCompleted) {
        day.isCompleted = false;
      }
      
      if (isMounted.current) {
        if (showBreakTimerAfter && showBreakTimerAfter.dayIndex === dayIndex && showBreakTimerAfter.exIndex === exIndex) {
            setShowBreakTimerAfter(null);
            breakStopwatch.reset();
        }
        
        setActiveDayIndex(dayIndex);
        setActiveExerciseIndex(exIndex);
      }

      return newData;
    });
  }, [handleDataChange, showBreakTimerAfter, breakStopwatch]);

  const skipExercise = useCallback((dayIndex: number, exIndex: number) => {
    if (!workoutData) return;
    
    restStopwatch.reset();
    breakStopwatch.reset();
    setShowBreakTimerAfter(null);

    const newSkipped = [...skippedExercises, exIndex];
    if (isMounted.current) setSkippedExercises(newSkipped);
    
    const splitKey = workoutData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
    const day = workoutData[splitKey][dayIndex];
    const nextIndex = day.exercises.findIndex((ex, idx) => !ex.isDone && !newSkipped.includes(idx));
    
    if (isMounted.current) {
      if (nextIndex === -1) {
        setActiveExerciseIndex(newSkipped[0]);
      } else {
        setActiveExerciseIndex(nextIndex);
      }
    }
  }, [workoutData, skippedExercises, restStopwatch, breakStopwatch]);
  
  const resetDay = useCallback((dayIndex: number) => {
    handleDataChange(currentData => {
      const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
      const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
      newData[splitKey][dayIndex].isCompleted = false;
      newData[splitKey][dayIndex].exercises.forEach((ex: Exercise) => {
        ex.isDone = false;
      });
      return newData;
    });
  }, [handleDataChange]);

  const resetWeek = useCallback(() => {
    handleDataChange(currentData => {
      const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
      const splitKey = newData.settings.activeSplit === '3-day' ? 'threeDaySplit' : 'fiveDaySplit';
      newData[splitKey].forEach((day: WorkoutDay) => {
        day.isCompleted = false;
        day.exercises.forEach((ex: Exercise) => {
          ex.isDone = false;
        });
      });
      return newData;
    });
    if (isMounted.current) {
      setActiveDayIndex(null);
      setActiveExerciseIndex(null);
      setSkippedExercises([]);
    }
  }, [handleDataChange]);

  const resetJustCompletedDay = useCallback(() => {
    setJustCompletedDayIndex(null);
  }, []);

  const setThemePreference = useCallback((theme: 'light' | 'dark') => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        if (!newData.settings) {
            newData.settings = initialWorkoutData.settings;
        }
        newData.settings.theme = theme;
        return newData;
    });
  }, [handleDataChange]);

  const setLanguagePreference = useCallback((language: 'en' | 'ro') => {
    handleDataChange(currentData => {
        const newData = JSON.parse(JSON.stringify(currentData)) as WorkoutPlan;
        if (!newData.settings) {
            newData.settings = initialWorkoutData.settings;
        }
        newData.settings.language = language;
        return newData;
    });
  }, [handleDataChange]);

  return { workoutData, userProfile, updateUserProfile, status, workoutId, userName, user, isUserAdmin, isDevMode, signOutUser, updateCardio, updateExercise, toggleSplitMode, updateProgress, setCardioVisibility, setSectionsOrder, activeDayIndex, activeExerciseIndex, startWorkout, cancelWorkout, markExerciseAsDone, undoMarkAsDone, skipExercise, resetDay, resetWeek, restStopwatch, breakStopwatch, showBreakTimerAfter, justCompletedDayIndex, resetJustCompletedDay, endBreak, reorderSplitWeights, switchActiveSplit, setThemePreference, setLanguagePreference };
}
