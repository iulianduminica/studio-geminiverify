
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bike, Sunrise, HeartPulse, Flame, Moon, Repeat, Timer, TrendingUp, Zap } from 'lucide-react';
import type { CardioMainValues } from '@/types/workout';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrevious } from '@/hooks/usePrevious';
import { useWorkout } from '@/context/WorkoutContext';

const CardioProtocol: React.FC = () => {
  const { t } = useTranslation();
  const { workoutData, updateCardio } = useWorkout();
  const [openValue, setOpenValue] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);
  const prevOpenValue = usePrevious(openValue);

  useEffect(() => {
    const savedState = localStorage.getItem('cardioAccordionOpen');
    // Default to closed for new users (savedState is null) or if explicitly set to false.
    // Only open if it's explicitly saved as 'true'.
    if (savedState === 'true') {
      setOpenValue('cardio-section');
    } else {
      setOpenValue('');
    }
  }, []);

  useEffect(() => {
    if (prevOpenValue !== undefined && prevOpenValue !== openValue) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [openValue, prevOpenValue]);

  const handleValueChange = (value: string) => {
    setOpenValue(value);
    localStorage.setItem('cardioAccordionOpen', value === 'cardio-section' ? 'true' : 'false');
  };

  const cardioData = workoutData?.cardio;
  if (!cardioData) return null;

  const { warmup, main, high, cooldown } = cardioData;

  const phases = [
    { key: 'warmup', title: t('CardioProtocol.warmUp'), data: warmup, hasCycles: false, icon: Sunrise },
    { key: 'main', title: t('CardioProtocol.main'), data: main, hasCycles: true, icon: HeartPulse },
    { key: 'high', title: t('CardioProtocol.highIntensity'), data: high, hasCycles: true, icon: Flame },
    { key: 'cooldown', title: t('CardioProtocol.coolDown'), data: cooldown, hasCycles: false, icon: Moon },
  ];

  return (
    <Card ref={cardRef}>
      <CardHeader className="p-0">
        <Accordion type="single" collapsible className="w-full" value={openValue} onValueChange={handleValueChange}>
          <AccordionItem value="cardio-section" className="border-b-0">
            <AccordionTrigger className="p-4 sm:p-6 hover:no-underline">
              <CardTitle className="flex items-center gap-3 select-none text-xl font-semibold">
                <Bike className="text-primary" />
                {t('CardioProtocol.title')}
              </CardTitle>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className="p-2 sm:p-4 pt-0">
                {/* Mobile Layout */}
                <div className="space-y-4 md:hidden">
                    {phases.map((phase) => {
                      const Icon = phase.icon;
                      return (
                        <div key={phase.key} className="p-4 rounded-lg border bg-muted/30">
                            <div className="flex items-center gap-2 font-semibold text-card-foreground select-none">
                              <Icon className="h-5 w-5 text-primary"/>
                              <h3 className="select-none">{phase.title}</h3>
                            </div>
                            <div className="mt-4 space-y-3">
                                {phase.hasCycles && (
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 select-none">
                                          <Repeat className="h-4 w-4 text-muted-foreground" />
                                          <Label htmlFor={`${phase.key}-cycles-mobile`} className="select-none">{t('CardioProtocol.cycles')}</Label>
                                        </div>
                                        <Input
                                            id={`${phase.key}-cycles-mobile`}
                                            type="text"
                                            className="w-24 text-center"
                                            value={(phase.data as CardioMainValues).cycles}
                                            onChange={(e) => updateCardio(phase.key, 'cycles', e.target.value)}
                                            placeholder={t('CardioProtocol.cyclesPlaceholder')}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 select-none">
                                      <Timer className="h-4 w-4 text-muted-foreground" />
                                      <Label htmlFor={`${phase.key}-duration-mobile`} className="select-none">{t('CardioProtocol.duration')}</Label>
                                    </div>
                                    <Input
                                        id={`${phase.key}-duration-mobile`}
                                        type="text"
                                        className="w-24 text-center"
                                        value={phase.data.duration}
                                        onChange={(e) => updateCardio(phase.key, 'duration', e.target.value)}
                                        placeholder={t('CardioProtocol.durationPlaceholder')}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 select-none">
                                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                      <Label htmlFor={`${phase.key}-level-mobile`} className="select-none">{t('CardioProtocol.level')}</Label>
                                    </div>
                                    <Input
                                        id={`${phase.key}-level-mobile`}
                                        type="text"
                                        className="w-24 text-center"
                                        value={phase.data.level}
                                        onChange={(e) => updateCardio(phase.key, 'level', e.target.value)}
                                        placeholder={t('CardioProtocol.levelPlaceholder')}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 select-none">
                                      <Zap className="h-4 w-4 text-muted-foreground" />
                                      <Label htmlFor={`${phase.key}-rpm-mobile`} className="select-none">{t('CardioProtocol.rpm')}</Label>
                                    </div>
                                    <Input
                                        id={`${phase.key}-rpm-mobile`}
                                        type="text"
                                        className="w-24 text-center"
                                        value={phase.data.rpm}
                                        onChange={(e) => updateCardio(phase.key, 'rpm', e.target.value)}
                                        placeholder={t('CardioProtocol.rpmPlaceholder')}
                                    />
                                </div>
                            </div>
                        </div>
                      )
                    })}
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-x-4 gap-y-3 items-center">
                  <div className="select-none" /> {/* Empty cell for alignment */}
                  <div className="text-center text-sm font-medium text-muted-foreground select-none">{t('CardioProtocol.cycles')}</div>
                  <div className="text-center text-sm font-medium text-muted-foreground select-none">{t('CardioProtocol.duration')}</div>
                  <div className="text-center text-sm font-medium text-muted-foreground select-none">{t('CardioProtocol.level')}</div>
                  <div className="text-center text-sm font-medium text-muted-foreground select-none">{t('CardioProtocol.rpm')}</div>
                  
                  {phases.map((phase) => (
                    <React.Fragment key={phase.key}>
                      <div className="font-medium text-card-foreground text-right select-none">{phase.title}</div>
                      
                      <div className="flex justify-center select-none">
                        {phase.hasCycles ? (
                          <Input
                            id={`${phase.key}-cycles`}
                            type="text"
                            className="w-20 text-center"
                            placeholder={t('CardioProtocol.cyclesPlaceholder')}
                            value={(phase.data as CardioMainValues).cycles}
                            onChange={(e) => updateCardio(phase.key, 'cycles', e.target.value)}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>

                      <div className="flex justify-center select-none">
                        <Input
                          id={`${phase.key}-duration`}
                          type="text"
                          className="w-20 text-center"
                          placeholder={t('CardioProtocol.durationPlaceholder')}
                          value={phase.data.duration}
                          onChange={(e) => updateCardio(phase.key, 'duration', e.target.value)}
                        />
                      </div>

                      <div className="flex justify-center select-none">
                        <Input
                          id={`${phase.key}-level`}
                          type="text"
                          className="w-20 text-center"
                          placeholder={t('CardioProtocol.levelPlaceholder')}
                          value={phase.data.level}
                          onChange={(e) => updateCardio(phase.key, 'level', e.target.value)}
                        />
                      </div>

                      <div className="flex justify-center select-none">
                        <Input
                          id={`${phase.key}-rpm`}
                          type="text"
                          className="w-20 text-center"
                          placeholder={t('CardioProtocol.rpmPlaceholder')}
                          value={phase.data.rpm}
                          onChange={(e) => updateCardio(phase.key, 'rpm', e.target.value)}
                        />
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardHeader>
    </Card>
  );
};

export default CardioProtocol;
