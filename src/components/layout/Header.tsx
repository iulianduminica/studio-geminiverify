
"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Copy, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import IconPancake from '@/components/icons/IconPancake';
import type { User } from 'firebase/auth';

type Status = 'connecting' | 'syncing' | 'synced' | 'error' | 'offline' | 'no-profile';

interface HeaderProps {
  status: Status;
  workoutId: string | null;
  userName: string | null;
  user: User | null;
  signOutUser: () => void;
}

const statusColors: Record<Status, string> = {
    connecting: 'text-primary',
    syncing: 'text-chart-4',
    synced: 'text-chart-2',
    error: 'text-destructive',
    offline: 'text-muted-foreground',
    'no-profile': 'text-muted-foreground',
}

const Header: React.FC<HeaderProps> = ({ status, workoutId, userName, user, signOutUser }) => {
  const [visible, setVisible] = React.useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  const statusMessages: Record<Status, string> = {
    connecting: t('Header.statusConnecting'),
    syncing: t('Header.statusSyncing'),
    synced: t('Header.statusSynced'),
    error: t('Header.statusError'),
    offline: t('Header.statusOffline'),
    'no-profile': t('Header.statusNoProfile'),
  };

  const handleCopy = () => {
    if (workoutId) {
      navigator.clipboard.writeText(workoutId);
      toast({
        title: t('Header.toastCopiedTitle'),
        description: t('Header.toastCopiedDescription'),
      });
    }
  };

  React.useEffect(() => {
    if (status === 'synced') {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(true);
    }
  }, [status]);


  return (
    <header className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <IconPancake className="h-14 w-14" />
        <div>
          <h1 className="text-2xl font-bold text-foreground font-headline select-none">
            {t('Global.appName')}
          </h1>
          <p className="text-sm text-muted-foreground select-none">{t('Global.appDescription')}</p>
        </div>
      </div>

      <div className="flex flex-col items-center sm:items-end">
        {userName && (
            <p className="text-lg font-medium text-primary select-none">{t('Header.userWorkout', { userName })}</p>
        )}
        {workoutId && (
          <div className="mt-1 flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
            <span className="text-secondary-foreground select-none">{t('Header.yourCode')}</span>
            <span className="font-mono font-semibold text-primary select-none">{workoutId}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title={t('Header.copyCode')}>
              <Copy className="h-4 w-4" />
            </Button>
            {user && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={signOutUser} title={t('Header.signOut')}>
                  <LogOut className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
        <div className={`mt-2 text-xs font-medium transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
          <span className={`${statusColors[status]} select-none`}>
              {statusMessages[status]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
