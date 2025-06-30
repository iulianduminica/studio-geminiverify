
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { auth, hasFirebaseConfig } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useTranslation } from 'react-i18next';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useToast } from '@/hooks/use-toast';
import FirestoreRulesError from '@/components/auth/FirestoreRulesError';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Image from 'next/image';
import { DateOfBirthInput } from '@/components/ui/date-of-birth-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
    invalid_type_error: "Please enter a valid date.",
  }),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }),
  height: z.coerce.number().positive({ message: "Height must be a positive number." }),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: "You need to select a real gender.",
  }),
});


export default function WelcomePage() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showGif, setShowGif] = useState(false);
    const [isDevMode, setIsDevMode] = useState(false);
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();

    const isMounted = useRef(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: { dateOfBirth: undefined, weight: "" as unknown as number, height: "" as unknown as number, gender: undefined },
    });

    const genderValue = form.watch('gender');
    
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;
        if (genderValue === 'other') {
            setShowGif(true);
            timer = setTimeout(() => {
                setShowGif(false);
                form.resetField('gender');
                form.setError('gender', { type: 'custom', message: t('Onboarding.errors.realGender') });
            }, 5000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [genderValue, form, t]);

    useEffect(() => {
        const devWorkoutId = sessionStorage.getItem('devWorkoutId');
        if (devWorkoutId) {
            setIsDevMode(true);
        }
        if (devWorkoutId === 'dxw-invited') {
            const mockUser = {
                displayName: 'Invited Dev',
                getIdToken: async () => 'dev-token',
            } as unknown as User;
            setUser(mockUser);
            return;
        }

        if (!hasFirebaseConfig) {
            router.push('/login');
            return;
        }
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                } else {
                    router.push('/login');
                }
            });
            return () => unsubscribe();
        } else {
            router.push('/login');
        }
    }, [router]);
    
    const showFirestoreRulesError = React.useCallback(() => {
        toast({
          variant: "destructive",
          title: t('Toasts.permissionErrorTitle'),
          description: React.createElement(FirestoreRulesError),
          duration: Infinity,
        });
    }, [toast, t]);

    const createProfileAndWorkout = async (values: z.infer<typeof formSchema>) => {
        const devWorkoutId = sessionStorage.getItem('devWorkoutId');
        if (devWorkoutId === 'dxw-invited') {
            toast({ title: "Dev Mode", description: "Profile creation skipped." });
            sessionStorage.removeItem('devWorkoutId');
            sessionStorage.setItem('devWorkoutId', 'dxw-admin');
            router.push('/');
            return;
        }

        if (!user) return;
        setIsLoading(true);

        try {
            const inviteId = sessionStorage.getItem('inviteId');
            
            const profileData = {
              ...values,
              weight: String(values.weight),
              height: String(values.height),
              dateOfBirth: values.dateOfBirth.toISOString().split('T')[0],
            };

            const token = await user.getIdToken();
            const response = await fetch('/api/create-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    profileData,
                    inviteId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.code === 'invitation_required') {
                    if(auth) await signOut(auth);
                    router.push('/login?error=uninvited');
                    return;
                }
                if (result.code === 'invalid_invite') {
                    toast({
                        variant: "destructive",
                        title: t('Toasts.invalidInviteTitle'),
                        description: t('Toasts.invalidInviteDescription'),
                    });
                    if(auth) await signOut(auth);
                    router.push('/login');
                    return;
                }
                throw new Error(result.message || 'Failed to create profile.');
            }

            if(inviteId) {
                sessionStorage.removeItem('inviteId');
            }

            router.push('/');
        } catch (error) {
            console.error("Error creating profile:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('permission-denied')) {
                showFirestoreRulesError();
            } else {
                 toast({
                    variant: "destructive",
                    title: "Profile Creation Failed",
                    description: errorMessage,
                });
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };
    
    if (!user) {
        return <LoadingScreen />;
    }
      
    const userName = user.displayName?.split(' ')[0] || 'User';

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
            <Dialog open={showGif}>
              <DialogContent hideCloseButton={true} className="p-0 border-0 max-w-md w-full bg-transparent shadow-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>{t('Global.jokeTitle')}</DialogTitle>
                    <DialogDescription>{t('Global.jokeDescription')}</DialogDescription>
                </DialogHeader>
                <Image src="https://i.giphy.com/FoghFLRdeWVLDWHckm.webp" alt="Helicopter GIF" width={480} height={270} className="w-full h-auto rounded-lg" data-ai-hint="funny helicopter" />
              </DialogContent>
            </Dialog>

            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="select-none">{t('Onboarding.title', { name: userName })}</CardTitle>
                    <CardDescription className="select-none">{t('Onboarding.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(createProfileAndWorkout)} className="space-y-6 select-none">
                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <DateOfBirthInput
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>{t('Onboarding.weight')}</Label>
                                            <FormControl>
                                                <Input type="number" placeholder="70" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="height"
                                    render={({ field }) => (
                                        <FormItem>
                                            <Label>{t('Onboarding.height')}</Label>
                                            <FormControl>
                                                <Input type="number" placeholder="180" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <Label>{t('Onboarding.gender')}</Label>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={(value) => {
                                                    form.clearErrors('gender');
                                                    field.onChange(value);
                                                }}
                                                defaultValue={field.value}
                                                className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="male" />
                                                    </FormControl>
                                                    <Label className="font-normal">{t('Onboarding.male')}</Label>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="female" />
                                                    </FormControl>
                                                    <Label className="font-normal">{t('Onboarding.female')}</Label>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="other" />
                                                    </FormControl>
                                                    <Label className="font-normal">{t('Onboarding.other')}</Label>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading || !form.formState.isValid}>
                                {isLoading ? t('Onboarding.loading') : t('Onboarding.button')}
                            </Button>
                            {isDevMode && (
                                <Button
                                    type="button"
                                    variant="link"
                                    className="w-full !mt-2"
                                    onClick={() => {
                                        sessionStorage.removeItem('devWorkoutId');
                                        router.push('/login');
                                    }}
                                >
                                    Back to Login (Dev Mode)
                                </Button>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
