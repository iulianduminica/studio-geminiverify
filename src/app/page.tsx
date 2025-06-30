
import React, { Suspense } from 'react';
import HomePageContent from '@/components/layout/HomePageContent';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePageContent />
    </Suspense>
  );
}
