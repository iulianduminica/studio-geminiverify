
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Copy, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow any authenticated user to read/write workout plans
    match /workouts/{workoutId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow a user to read/write only their own user profile document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

const FirestoreRulesError = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesText);
    toast({
      title: t('Toasts.rulesCopiedTitle'),
      description: t('Toasts.rulesCopiedDescription'),
    });
  };

  return (
    <div className='text-xs w-full'>
      <div className='flex items-start gap-2 mb-2'>
        <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
        <p>{t('Toasts.permissionErrorDescription')}</p>
      </div>
      <pre className='p-2 my-2 rounded-md bg-black/80 text-white font-mono text-[10px] leading-snug select-all'>
        {rulesText}
      </pre>
      <Button
        variant='secondary'
        size='sm'
        onClick={handleCopy}
        className='w-full mt-2'
      >
        <Copy className='mr-2 h-4 w-4' />
        {t('Toasts.copyRules')}
      </Button>
    </div>
  );
};

export default FirestoreRulesError;
