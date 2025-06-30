
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, googleProvider, db, hasFirebaseConfig } from '@/lib/firebase';
import { signInWithPopup, type AuthError } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import IconGoogle from '@/components/icons/IconGoogle';
import { useTranslation } from 'react-i18next';
import IconPancake from '@/components/icons/IconPancake';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Lock } from 'lucide-react';
import { Label } from '@/components/ui/label';

const LoginContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const [secretCode, setSecretCode] = useState('');
    const [isDevDialogOpen, setIsDevDialogOpen] = useState(false);
    const [firebaseError, setFirebaseError] = useState<string | null>(null);

    useEffect(() => {
        if (!hasFirebaseConfig) {
            setFirebaseError("Firebase is not configured correctly. The app will not work.");
        }
    }, []);

    useEffect(() => {
        const inviteId = searchParams.get('inviteId');
        if (inviteId) {
            sessionStorage.setItem('inviteId', inviteId);
            router.replace('/login', { scroll: false });
        }

        const errorType = searchParams.get('error');
        if (errorType === 'uninvited') {
            setError(t('LoginPage.uninvited'));
            router.replace('/login', { scroll: false });
        }
    }, [router, searchParams, t]);

    const handleSignIn = async () => {
        if (!auth || !googleProvider || !db) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                router.push('/');
            } else {
                router.push('/welcome');
            }
        } catch (err) {
            const authError = err as AuthError;
            console.error("Google Sign-In Error:", authError);
            setError(authError.message || t('LoginPage.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSecretCodeLogin = () => {
        if (secretCode === 'dxw') {
            setIsLoading(true);
            sessionStorage.setItem('devWorkoutId', 'dxw-admin');
            router.push('/');
            setIsLoading(false);
        } else if (secretCode === 'invited') {
            setIsLoading(true);
            sessionStorage.setItem('devWorkoutId', 'dxw-invited');
            router.push('/welcome');
            setIsLoading(false);
        }
        else {
            setError('Invalid secret code.');
            setSecretCode('');
            setIsDevDialogOpen(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
            <div className="mx-auto grid w-full max-w-sm gap-8">
                <div className="grid gap-4 text-center">
                    <IconPancake className="h-20 w-20 mx-auto drop-shadow-lg" />
                    <div className='space-y-1'>
                        <h1 className="text-3xl font-bold font-headline">{t('Global.appName')}</h1>
                        <p className="text-balance text-muted-foreground">
                            {t('Global.appDescription')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-center">
                        <p className="text-muted-foreground">{t('LoginPage.description')}</p>
                    </div>
                    <Button onClick={handleSignIn} disabled={isLoading || !!firebaseError} className="w-full">
                        <IconGoogle className="mr-2 h-5 w-5" />
                        {isLoading ? t('LoginPage.loading') : t('LoginPage.button')}
                    </Button>
                    {error && (
                        <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                            {error}
                        </p>
                    )}
                    {firebaseError && (
                        <p className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
                            {firebaseError}
                        </p>
                    )}
                </div>

                <div className="text-center text-sm">
                    <Dialog open={isDevDialogOpen} onOpenChange={setIsDevDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="link" className="text-muted-foreground px-0 font-normal">
                                <Lock className="mr-2 h-4 w-4" />
                                Developer Access
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Developer Access</DialogTitle>
                                <DialogDescription>Enter a developer code to sign in to a test account.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-2">
                            <Label htmlFor="secret-code" className="sr-only">Secret Code</Label>
                            <Input 
                                    id="secret-code"
                                    type="password" 
                                    placeholder="Enter dev code..." 
                                    value={secretCode}
                                    onChange={(e) => setSecretCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSecretCodeLogin()}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSecretCodeLogin} className="w-full">
                                    {isLoading ? t('LoginPage.loading') : 'Sign in with Code'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <LoginContent />
        </Suspense>
    );
}
