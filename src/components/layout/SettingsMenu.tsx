
'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, Sun, Moon, Languages, ArrowUpDown, User, Check, Loader2 } from "lucide-react";
import { useWorkout } from '@/context/WorkoutContext';
import { useToast } from '@/hooks/use-toast';
import { DateOfBirthInput } from '@/components/ui/date-of-birth-input';

const profileFormSchema = z.object({
  dateOfBirth: z.date({ 
    required_error: "A date of birth is required.",
    invalid_type_error: "Please enter a valid date." 
  }),
  weight: z.coerce.number().positive({ message: "Weight must be a positive number." }),
  height: z.coerce.number().positive({ message: "Height must be a positive number." }),
});

const calculateAge = (dob: Date | undefined): number | null => {
    if (!dob) return null;
    const today = new Date();
    // Use UTC methods to calculate age to be consistent with date handling
    const birthDate = new Date(Date.UTC(dob.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const m = today.getUTCMonth() - birthDate.getUTCMonth();
    if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
        age--;
    }
    return age;
};

export const SettingsMenu: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { toast } = useToast();
    const { workoutData, userProfile, updateUserProfile, setCardioVisibility, setSectionsOrder, setThemePreference, setLanguagePreference } = useWorkout();
    
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const settings = workoutData?.settings;
    const theme = settings?.theme || 'light';
    const language = settings?.language || 'en';

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        mode: 'onChange',
        defaultValues: {
            dateOfBirth: undefined,
            weight: "" as unknown as number,
            height: "" as unknown as number,
        },
    });
    
    const { reset } = form;
    const dobValue = form.watch('dateOfBirth');
    const calculatedAge = calculateAge(dobValue);

    useEffect(() => {
        if (userProfile && isProfileDialogOpen) {
            const { dobDay, dobMonth, dobYear, dateOfBirth } = userProfile;
            let dobDate: Date | undefined = undefined;

            if (dobDay && dobMonth && dobYear) {
                const year = parseInt(dobYear, 10);
                const month = parseInt(dobMonth, 10);
                const day = parseInt(dobDay, 10);
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    dobDate = new Date(Date.UTC(year, month - 1, day));
                }
            } else if (dateOfBirth) { // Fallback for old data
                const parts = dateOfBirth.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10);
                    const day = parseInt(parts[2], 10);
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                        dobDate = new Date(Date.UTC(year, month - 1, day));
                    }
                }
            }
            
            reset({
                weight: Number(userProfile.weight) || "" as unknown as number,
                height: Number(userProfile.height) || "" as unknown as number,
                dateOfBirth: dobDate,
            });
        }
    }, [userProfile, isProfileDialogOpen, reset]);

    useEffect(() => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);
    
    if (!settings) {
      return null;
    }
    
    const handleProfileFormSubmit = async (values: z.infer<typeof profileFormSchema>) => {
        setIsSaving(true);
        setIsSuccess(false);

        const dobString = values.dateOfBirth.toISOString().split('T')[0];
        const [year, month, day] = dobString.split('-');

        const result = await updateUserProfile({
            weight: String(values.weight),
            height: String(values.height),
            dateOfBirth: dobString,
            dobDay: day,
            dobMonth: month,
            dobYear: year,
        });
        
        setIsSaving(false);

        if(result?.success) {
            setIsSuccess(true);
            toast({
                title: t('Settings.profile.successTitle'),
                description: t('Settings.profile.successDescription'),
            });
            setTimeout(() => {
                setIsSuccess(false);
                setIsProfileDialogOpen(false);
            }, 1500);
        } else {
            toast({
                variant: 'destructive',
                title: "Error",
                description: result?.error?.message || "Failed to update profile",
            });
        }
    };

    const handleOrderChange = () => {
        const newOrder = [...settings.sectionsOrder].reverse() as ('cardio' | 'strength')[];
        setSectionsOrder(newOrder);
    };
    
    const handleVisibilityChange = (visible: boolean) => {
        setCardioVisibility(visible);
    };

    const handleThemeChange = (value: string) => {
        if (value === 'light' || value === 'dark') {
            setThemePreference(value);
        }
    };
    
    const handleLanguageChange = (lang: string) => {
        if (lang === 'en' || lang === 'ro') {
            setLanguagePreference(lang);
            i18n.changeLanguage(lang);
        }
    };

    return (
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <SlidersHorizontal className="mr-2 h-4 w-4" />
                        {t('Settings.title')}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>{t('Settings.display.title')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                        <Label htmlFor="cardio-visibility" className="pr-2 font-normal cursor-pointer">{t('Settings.display.showCardio')}</Label>
                        <Switch
                            id="cardio-visibility"
                            checked={settings.cardioVisible}
                            onCheckedChange={handleVisibilityChange}
                        />
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleOrderChange} disabled={!settings.cardioVisible}>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        <span>{t('Settings.display.swap')}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span>{t('Settings.display.theme')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
                                <DropdownMenuRadioItem value="light">{t('Settings.display.light')}</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="dark">{t('Settings.display.dark')}</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Languages className="mr-2 h-4 w-4" />
                            <span>{t('Settings.display.language')}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={language} onValueChange={handleLanguageChange}>
                                <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="ro">Română</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('Settings.profile.title')}</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setIsProfileDialogOpen(true)} disabled={!userProfile}>
                        <User className="mr-2 h-4 w-4" />
                        {t('Settings.profile.editProfile')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {userProfile && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold select-none">{t('Settings.profile.editProfile')}</DialogTitle>
                        <DialogDescription className="opacity-80 select-none">{t('Settings.profile.description')}</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleProfileFormSubmit)} className="space-y-8 pt-4 select-none">
                            <FormField
                                control={form.control}
                                name="dateOfBirth"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <DateOfBirthInput
                                                value={field.value}
                                                onChange={field.onChange}
                                                showAge={true}
                                                calculatedAge={calculatedAge}
                                                ageLabel={t('Onboarding.age')}
                                            />
                                        </FormControl>
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
                            <DialogFooter className="!mt-8">
                                <Button type="submit" disabled={isSaving || isSuccess || !form.formState.isValid} className="w-full sm:w-auto">
                                     {isSaving ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('Settings.profile.saving')}</>
                                    ) : isSuccess ? (
                                        <><Check className="mr-2 h-4 w-4" /> {t('Settings.profile.saved')}</>
                                    ) : (
                                        t('Settings.profile.save')
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            )}
        </Dialog>
    )
}
