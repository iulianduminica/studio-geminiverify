
'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface DateOfBirthInputProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  showAge?: boolean;
  calculatedAge?: number | null;
  ageLabel?: string;
}

export const DateOfBirthInput: React.FC<DateOfBirthInputProps> = ({ value, onChange, showAge = false, calculatedAge, ageLabel }) => {
  const id = useId();
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [dayHasError, setDayHasError] = useState(false);
  const [monthHasError, setMonthHasError] = useState(false);
  const [yearHasError, setYearHasError] = useState(false);
  const [globalErrorMessage, setGlobalErrorMessage] = useState<string | null>(null);
  
  const [hasInteractedAny, setHasInteractedAny] = useState(false);
  
  const yearInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const isInternalChange = useRef(false);

  const [yearBlurred, setYearBlurred] = useState(false);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
      setDay(String(value.getUTCDate()));
      setMonth(String(value.getUTCMonth() + 1));
      setYear(String(value.getUTCFullYear()));
    } else if (value === null || value === undefined) {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  useEffect(() => {
    if (!hasInteractedAny) {
      return;
    }

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    let isDayInvalid = false;
    let isMonthInvalid = false;
    let isYearInvalid = false;
    
    const singleErrorMessages: {field: 'day' | 'month' | 'year', message: string}[] = [];

    if (month && (monthNum < 1 || monthNum > 12)) {
        isMonthInvalid = true;
        singleErrorMessages.push({field: 'month', message: t('Onboarding.errors.invalidMonth')});
    }
    
    if (day && (dayNum < 1 || dayNum > 31)) {
        isDayInvalid = true;
        singleErrorMessages.push({field: 'day', message: t('Onboarding.errors.invalidDay')});
    }

    if (year) {
        if (year.length === 4) {
            const currentYear = new Date().getFullYear();
            if (yearNum > currentYear) {
                isYearInvalid = true;
                singleErrorMessages.push({field: 'year', message: t('Onboarding.errors.dateInFuture')});
            } else if (yearNum < currentYear - 120) {
                isYearInvalid = true;
                singleErrorMessages.push({field: 'year', message: t('Onboarding.errors.yearTooFar')});
            }
        } else if (yearBlurred) {
            isYearInvalid = true;
            singleErrorMessages.push({field: 'year', message: t('Onboarding.errors.incompleteYear')});
        }
    }
    
    const allFieldsFilled = day.length > 0 && month.length > 0 && year.length === 4;

    if (allFieldsFilled && !isDayInvalid && !isMonthInvalid && !isYearInvalid) {
        const daysInMonth = new Date(Date.UTC(yearNum, monthNum, 0)).getUTCDate();
        if(dayNum > daysInMonth) {
            isDayInvalid = true; 
            const existingErrorIndex = singleErrorMessages.findIndex(e => e.field === 'day');
            const newError = {field: 'day' as const, message: t('Onboarding.errors.invalidDayForMonth')};
            if (existingErrorIndex > -1) {
                singleErrorMessages[existingErrorIndex] = newError;
            } else {
                singleErrorMessages.push(newError);
            }
        }
    }

    const errorCount = (isDayInvalid ? 1 : 0) + (isMonthInvalid ? 1 : 0) + (isYearInvalid ? 1 : 0);

    setDayHasError(isDayInvalid);
    setMonthHasError(isMonthInvalid);
    setYearHasError(isYearInvalid);

    if (errorCount > 1) {
        setGlobalErrorMessage(t('Onboarding.errors.invalidDate'));
    } else if (singleErrorMessages.length === 1) {
        setGlobalErrorMessage(singleErrorMessages[0].message);
    } else {
        setGlobalErrorMessage(null);
    }

    const noFieldsFilled = day.length === 0 && month.length === 0 && year.length === 0;

    if (allFieldsFilled && errorCount === 0) {
        const finalDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
        if (value?.getTime() !== finalDate.getTime()) {
            isInternalChange.current = true;
            onChange(finalDate);
        }
    } else if (noFieldsFilled) {
        if (value !== null) {
            isInternalChange.current = true;
            onChange(null);
        }
    } else if (allFieldsFilled && errorCount > 0) {
        if (value !== null) {
            isInternalChange.current = true;
            onChange(null);
        }
    }
    
  }, [day, month, year, t, hasInteractedAny, yearBlurred, onChange, value]);

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    setter(numericValue);
    if(!hasInteractedAny) setHasInteractedAny(true);
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if(!hasInteractedAny) setHasInteractedAny(true);

    if (numericValue.length <= 4) {
      setYear(numericValue);
    }
  };
  
  const handleYearBlur = () => {
    setYearBlurred(true);
  };

  const errorMessageToDisplay = globalErrorMessage;

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('Onboarding.dateOfBirth')}</legend>
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`${id}-day`} className="text-xs text-foreground/70">{t('Onboarding.day')}</Label>
          <Input
            id={`${id}-day`}
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="DD"
            value={day}
            onChange={handleInputChange(setDay)}
            className={cn(dayHasError && 'border-destructive')}
            aria-invalid={dayHasError}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor={`${id}-month`} className="text-xs text-foreground/70">{t('Onboarding.month')}</Label>
          <Input
            id={`${id}-month`}
            type="text"
            inputMode="numeric"
            maxLength={2}
            placeholder="MM"
            value={month}
            onChange={handleInputChange(setMonth)}
            className={cn(monthHasError && 'border-destructive')}
            aria-invalid={monthHasError}
          />
        </div>
        <div className="w-24 space-y-1">
          <Label htmlFor={`${id}-year`} className="text-xs text-foreground/70">{t('Onboarding.year')}</Label>
          <Input
            ref={yearInputRef}
            id={`${id}-year`}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="YYYY"
            value={year}
            onChange={handleYearChange}
            onBlur={handleYearBlur}
            className={cn(yearHasError && 'border-destructive')}
            aria-invalid={yearHasError}
          />
        </div>
        {showAge && (
            <div className="w-16 space-y-1">
                <Label htmlFor={`${id}-age-display`} className="text-xs text-muted-foreground">{ageLabel}</Label>
                <div
                    id={`${id}-age-display`}
                    className="flex h-10 w-full items-center text-sm font-medium text-foreground"
                >
                    {calculatedAge !== null ? calculatedAge : '––'}
                </div>
            </div>
        )}
      </div>
      {errorMessageToDisplay && <p className="text-xs font-medium text-destructive pt-1">{errorMessageToDisplay}</p>}
    </fieldset>
  );
};
