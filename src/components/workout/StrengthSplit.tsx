
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dumbbell, Footprints, Play, RotateCw, PartyPopper, Clock, Pause, RotateCcw, X, SkipForward, PersonStanding, GitCommitHorizontal, ChevronsDownUp } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslation } from 'react-i18next';
import IconBack from '@/components/icons/IconBack';
import IconShoulder from '@/components/icons/IconShoulder';
import IconChest from '@/components/icons/IconChest';
import { usePrevious } from '@/hooks/usePrevious';
import { useWorkout } from '@/context/WorkoutContext';

const iconMap: { [key: string]: React.ElementType } = {
  IconChest,
  IconBack,
  Footprints,
  PersonStanding,
  GitCommitHorizontal,
  ChevronsDownUp,
  BicepsFlexed: Dumbbell,
  IconShoulder,
};

const StrengthSplit: React.FC = () => {
  const { t } = useTranslation();
  const {
    workoutData,
    activeDayIndex,
    startWorkout,
    cancelWorkout,
    resetDay,
    resetWeek,
    breakStopwatch,
    showBreakTimerAfter,
    justCompletedDayIndex,
    resetJustCompletedDay,
    endBreak,
  } = useWorkout();

  const [openAccordionValue, setOpenAccordionValue] = useState<string | undefined>(
    activeDayIndex !== null ? `day-${activeDayIndex}` : undefined
  );
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);

  const prevActiveDayIndex = usePrevious(activeDayIndex);

  useEffect(() => {
    if (activeDayIndex !== null && prevActiveDayIndex === null) {
      setOpenAccordionValue(`day-${activeDayIndex}`);
    }
    
    if (openAccordionValue) {
      const dayIndex = openAccordionValue.split('-')[1];
      const itemEl = document.getElementById(`day-item-${dayIndex}`);
      if (itemEl) {
        setTimeout(() => {
          itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [openAccordionValue, activeDayIndex, prevActiveDayIndex]);
  
  const handleCancelWorkout = (dayIndex: number) => {
    cancelWorkout(dayIndex);
    if(openAccordionValue === `day-${dayIndex}`) {
      setOpenAccordionValue(undefined);
    }
  };

  useEffect(() => {
    if (showBreakTimerAfter) {
      const breakTimerId = `break-timer-${showBreakTimerAfter.dayIndex}-${showBreakTimerAfter.exIndex}`;
      const element = document.getElementById(breakTimerId);
      setTimeout(() => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [showBreakTimerAfter]);

  useEffect(() => {
    if (justCompletedDayIndex === null) return;
  
    const itemEl = document.getElementById(`day-item-${justCompletedDayIndex}`);
    if (!itemEl) {
      resetJustCompletedDay();
      return;
    }
  
    itemEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedDay(justCompletedDayIndex);
  
    const triggerConfetti = async () => {
      try {
        const confetti = (await import('canvas-confetti')).default;
        const rect = itemEl.getBoundingClientRect();
        const origin = {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        };
        confetti({
          particleCount: 150,
          spread: 90,
          origin: origin,
          zIndex: 1000,
        });
      } catch (e) {
        console.error("Confetti failed to load or run", e);
      }
    };
    triggerConfetti();
  
    const cleanupTimer = setTimeout(() => {
      setOpenAccordionValue(undefined);
      setHighlightedDay(null);
      resetJustCompletedDay();
    }, 1500);
  
    return () => {
      clearTimeout(cleanupTimer);
    };
  }, [justCompletedDayIndex, resetJustCompletedDay]);

  const handleAccordionValueChange = useCallback((value: string | undefined) => {
    if (activeDayIndex !== null && value !== `day-${activeDayIndex}`) {
      return;
    }
    setOpenAccordionValue(value);
  }, [activeDayIndex]);

  if (!workoutData) return null;

  const days = workoutData.settings.activeSplit === '3-day' ? workoutData.threeDaySplit : workoutData.fiveDaySplit;
  const allDaysCompleted = days.every(day => day.isCompleted);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 select-none text-xl font-semibold">
          <Dumbbell className="text-primary" />
          {t('StrengthSplit.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-3" value={openAccordionValue} onValueChange={handleAccordionValueChange}>
          {days.map((day, dayIndex) => {
            const IconComponent = iconMap[day.icon] || Dumbbell;
            const isDayOpen = openAccordionValue === `day-${dayIndex}`;
            return (
              <AccordionItem value={`day-${dayIndex}`} key={dayIndex} id={`day-item-${dayIndex}`} className={cn("border border-transparent rounded-md overflow-hidden transition-all duration-300", day.isCompleted && "bg-green-50 dark:bg-card dark:border-green-500/60", highlightedDay === dayIndex && "animate-highlight-border-pulse")}>
                 <AccordionTrigger className={cn(
                    "font-semibold text-left text-foreground bg-secondary/50 hover:bg-secondary transition-colors px-4 hover:no-underline select-none",
                    isDayOpen ? "rounded-t-md" : "rounded-md",
                    day.isCompleted && "bg-green-100 dark:bg-card hover:bg-green-100/90 dark:hover:bg-accent"
                 )}>
                    <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-primary flex items-start gap-3 select-none">
                            <IconComponent className="mt-1 flex-shrink-0" />
                            <span className="text-left select-none">{t(day.day)}</span>
                        </span>
                        <div className="flex items-center gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
                          {activeDayIndex === dayIndex ? (
                              <div className="flex items-center gap-2">
                                  {!day.exercises.some(ex => ex.isDone) && (
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <div className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer")}>
                                              <X className="mr-1 h-4 w-4"/> {t('StrengthSplit.cancelWorkout')}
                                            </div>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                              <AlertDialogHeader>
                                                  <AlertDialogTitle>{t('StrengthSplit.dialogs.cancelTitle')}</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    {t('StrengthSplit.dialogs.cancelDescription')}
                                                  </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                  <AlertDialogCancel>{t('StrengthSplit.dialogs.cancelDeny')}</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleCancelWorkout(dayIndex)}>{t('StrengthSplit.dialogs.cancelConfirm')}</AlertDialogAction>
                                              </AlertDialogFooter>
                                          </AlertDialogContent>
                                      </AlertDialog>
                                  )}
                                  <span className="font-semibold text-primary select-none text-sm px-2">{t('StrengthSplit.inProgress')}</span>
                              </div>
                          ) : day.isCompleted ? (
                              <span className="font-semibold text-green-600 select-none text-sm px-2">{t('StrengthSplit.completed')}</span>
                          ) : (
                            <div className={cn(buttonVariants({ variant: "default", size: "sm" }), 'cursor-pointer')} onClick={() => startWorkout(dayIndex)}>
                                <Play className="mr-2 h-4 w-4" /> {t('StrengthSplit.start')}
                            </div>
                          )}
                        </div>
                    </div>
                 </AccordionTrigger>
                <AccordionContent className="bg-card p-2 sm:p-4 rounded-b-md border-t">
                  <div className="space-y-4">
                    {day.exercises.map((exercise, exIndex) => (
                      <React.Fragment key={exIndex}>
                        <ExerciseCard
                          exercise={exercise}
                          dayIndex={dayIndex}
                          exIndex={exIndex}
                        />
                        {showBreakTimerAfter && showBreakTimerAfter.dayIndex === dayIndex && showBreakTimerAfter.exIndex === exIndex && (
                          <Card id={`break-timer-${dayIndex}-${exIndex}`} className="my-4 p-4 bg-primary/10 border-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background">
                            <CardContent className="p-0 flex flex-col items-center gap-4">
                              <div className="flex items-center gap-2 font-semibold text-primary select-none">
                                <Clock className="h-5 w-5"/>
                                <span>{t('StrengthSplit.breakTime')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Button size="icon" variant="outline" onClick={breakStopwatch.isRunning ? breakStopwatch.stop : breakStopwatch.start}>
                                      {breakStopwatch.isRunning ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
                                  </Button>
                                  <span className="text-2xl font-mono font-semibold w-24 text-center select-none">
                                      {`${Math.floor(breakStopwatch.value / 60)}:${String(breakStopwatch.value % 60).padStart(2, '0')}`}
                                  </span>
                                  <Button size="icon" variant="ghost" onClick={breakStopwatch.reset}>
                                      <RotateCcw className="h-5 w-5"/>
                                  </Button>
                              </div>
                              <Button onClick={endBreak} size="sm">
                                <SkipForward className="mr-2 h-4 w-4" />
                                {t('StrengthSplit.endBreak')}
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </React.Fragment>
                    ))}
                    {day.isCompleted && (
                       <div className="mt-4 pt-4 border-t flex justify-center select-none">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" className="cursor-pointer">
                                <RotateCw className="mr-2 h-4 w-4" /> {t('StrengthSplit.restartDay')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('StrengthSplit.dialogs.restartTitle')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('StrengthSplit.dialogs.restartDescription')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('StrengthSplit.dialogs.restartDeny')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => resetDay(dayIndex)}>{t('StrengthSplit.dialogs.restartConfirm')}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                       </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        <div className="mt-6 flex justify-center">
            {allDaysCompleted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-primary-foreground cursor-pointer">
                    <PartyPopper className="mr-2 h-4 w-4" />
                    {t('StrengthSplit.finishWeek')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('StrengthSplit.dialogs.finishTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('StrengthSplit.dialogs.finishDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('StrengthSplit.dialogs.finishDeny')}</AlertDialogCancel>
                    <AlertDialogAction onClick={resetWeek}>{t('StrengthSplit.dialogs.finishConfirm')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StrengthSplit;
