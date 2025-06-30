
'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { auth } from '@/lib/firebase';
import { UserPlus, Copy, MailCheck } from 'lucide-react';

export const AdminPanel = ({ isDevMode }: { isDevMode: boolean }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleCreateInvite = async () => {
    setIsLoading(true);
    setInviteLink(null);

    try {
      if (!auth) {
        throw new Error("Firebase Authentication is not available.");
      }
      
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      if (!token && !isDevMode) throw new Error("Not authenticated");

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${isDevMode ? 'dev-token' : token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        let errorMessage = "An unknown error occurred.";
        try {
            const data = await response.json();
            errorMessage = data.error || data.message || `Server responded with status ${response.status}`;
        } catch {
            const textError = await response.text();
            if (textError) {
                errorMessage = `Server returned a non-JSON response. Snippet: ${textError.substring(0, 200)}...`;
            } else {
                errorMessage = `Server returned status ${response.status} with no error message.`;
            }
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const baseUrl = window.location.origin;
      const newInviteLink = `${baseUrl}/login?inviteId=${data.inviteId}`;
      setInviteLink(newInviteLink);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('AdminPanel.toast.failedTitle'),
        description: error instanceof Error ? error.message : String(error),
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: t('AdminPanel.toast.copiedTitle'),
      description: t('AdminPanel.toast.copiedDescription'),
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setInviteLink(null);
        setIsLoading(false);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          {t('AdminPanel.createInvite')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!inviteLink ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('AdminPanel.title')}</DialogTitle>
              <DialogDescription>
                {t('AdminPanel.description')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Button onClick={handleCreateInvite} className="w-full" disabled={isLoading}>
                {isLoading ? t('AdminPanel.loading') : t('AdminPanel.generateButton')}
              </Button>
            </div>
          </>
        ) : (
          <div className="pt-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{t('AdminPanel.linkGeneratedTitle')}</h3>
            <p className="text-muted-foreground text-sm mt-2 mb-6">
                {t('AdminPanel.linkGeneratedDescription')}
            </p>
            <div className="flex flex-col items-stretch gap-2">
                <div 
                  className="rounded-md bg-muted/50 p-3 text-center cursor-pointer transition-colors hover:bg-muted"
                  onClick={copyToClipboard}
                >
                    <p className="text-sm text-primary font-mono break-all select-all text-center">
                        {inviteLink}
                    </p>
                </div>
                <Button 
                    variant="outline"
                    onClick={copyToClipboard}
                >
                    <Copy className="mr-2 h-4 w-4" />
                    {t('AdminPanel.copyToClipboard')}
                </Button>
            </div>
            <DialogFooter className="mt-8 sm:justify-center">
                <DialogClose asChild>
                    <Button type="button" variant="default" size="lg" className="w-full sm:w-auto">
                        {t('AdminPanel.done')}
                    </Button>
                </DialogClose>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
