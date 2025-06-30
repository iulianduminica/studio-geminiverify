
"use client"

import React from 'react';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  workoutId: string | null;
}

const appVersion = "2.1.0";

const Footer: React.FC<FooterProps> = ({ workoutId }) => {
  const { t } = useTranslation();
  return (
    <footer className="mt-8 text-center text-xs text-muted-foreground select-none">
      <p>{t('Footer.autoSave')}</p>
      {workoutId && (
        <p className="font-mono mt-2" id="workout-id-display">
          {t('Footer.workoutId')} {workoutId}
        </p>
      )}
      <p className="mt-2 font-mono">v{appVersion}</p>
    </footer>
  );
};

export default Footer;
