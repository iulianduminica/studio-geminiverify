
"use client";

import React from 'react';
import { useWorkoutData } from '@/hooks/useWorkoutData';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CardioProtocol from '@/components/workout/CardioProtocol';
import StrengthSplit from '@/components/workout/StrengthSplit';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { SettingsMenu } from '@/components/layout/SettingsMenu';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { WorkoutProvider, useWorkout } from '@/context/WorkoutContext';

const AppControls = () => {
    const { t } = useTranslation();
    const { 
        workoutData, 
        switchActiveSplit, 
        activeDayIndex,
        isUserAdmin,
        isDevMode
    } = useWorkout();
    
    const settings = workoutData?.settings;
    if (!settings) return null;

    const handleSplitChange = (value: string) => {
        if (value === '5-day' || value === '3-day') {
            switchActiveSplit(value);
        }
    };
    
    return (
        <Card>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                <Tabs value={settings.activeSplit || '5-day'} onValueChange={handleSplitChange} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="5-day" disabled={activeDayIndex !== null}>{t('Settings.fiveDaySplit')}</TabsTrigger>
                        <TabsTrigger value="3-day" disabled={activeDayIndex !== null}>{t('Settings.threeDaySplit')}</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="w-full sm:w-auto flex justify-end items-center gap-2">
                  {(isUserAdmin || isDevMode) && <AdminPanel isDevMode={isDevMode} />}
                  <SettingsMenu />
                </div>
            </CardContent>
        </Card>
    );
};

const MainContent = () => {
  const { workoutData } = useWorkout();

  if (!workoutData) {
    return null;
  }

  const settings = workoutData.settings;

  const sections: { [key: string]: React.ReactNode } = {
    cardio: <CardioProtocol key="cardio" />,
    strength: <StrengthSplit key="strength" />,
  };

  const days = settings.activeSplit === '3-day' && workoutData.threeDaySplit
    ? workoutData.threeDaySplit
    : workoutData.fiveDaySplit;

  return (
    <main className="space-y-6">
      <AppControls />
      {settings.sectionsOrder.map((sectionId) => {
          if (sectionId === 'cardio' && !settings.cardioVisible) {
              return null;
          }
          if (sectionId === 'strength' && !days) return null;
          return sections[sectionId];
      })}
    </main>
  );
};


export default function HomePageContent() {
  const workoutDataHook = useWorkoutData();
  const { status, workoutId, userName, user, signOutUser } = workoutDataHook;
  
  if (status === 'connecting' || !workoutDataHook.workoutData) {
    return <LoadingScreen />;
  }

  return (
    <WorkoutProvider value={workoutDataHook}>
      <div className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          <Header status={status} workoutId={workoutId} userName={userName} user={user} signOutUser={signOutUser} />
          <MainContent />
          <Footer workoutId={workoutId} />
        </div>
      </div>
    </WorkoutProvider>
  );
}
